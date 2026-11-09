import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { S2SService } from '../s2s/s2s.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: {
    user: { findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    userSession: { create: jest.Mock; findUnique: jest.Mock; deleteMany: jest.Mock };
    oAuthClient: { findUnique: jest.Mock; create: jest.Mock };
    authCode: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let jwtMock: { sign: jest.Mock; decode: jest.Mock };
  let s2sMock: { dispatchUserSync: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
      },
      oAuthClient: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      authCode: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtMock = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      decode: jest.fn(),
    };

    s2sMock = {
      dispatchUserSync: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: S2SService, useValue: s2sMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOAuthCode & exchangeOAuthToken', () => {
    it('should issue authorization code for registered client', async () => {
      prismaMock.oAuthClient.findUnique.mockResolvedValue({
        id: '1',
        clientId: 'wonderlab',
        isActive: true,
        redirectUris: ['https://wonderlab.io.vn/auth/callback'],
      });
      prismaMock.authCode.create.mockResolvedValue({});

      const code = await service.generateOAuthCode(
        'wonderlab',
        'user-123',
        'https://wonderlab.io.vn/auth/callback',
        'test-challenge-s256',
      );

      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(16);
      expect(prismaMock.authCode.create).toHaveBeenCalled();
    });

    it('should successfully exchange code with valid PKCE verifier', async () => {
      const verifier = 'my-secret-pkce-verifier-12345';
      const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

      prismaMock.authCode.findUnique.mockResolvedValue({
        code: 'valid-code',
        clientId: 'wonderlab',
        codeChallenge: challenge,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: {
          id: 'user-1',
          username: 'thanhba',
          email: 'thanhba@example.com',
          role: 'ADMIN',
          avatarUrl: null,
          isEmailVerified: true,
          createdAt: new Date(),
        },
      });
      prismaMock.authCode.update.mockResolvedValue({});

      const result = await service.exchangeOAuthToken({
        grant_type: 'authorization_code',
        client_id: 'wonderlab',
        code: 'valid-code',
        code_verifier: verifier,
      });

      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.user.username).toBe('thanhba');
      expect(prismaMock.authCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ usedAt: expect.any(Date) }) }),
      );
    });
  });

  describe('googleLogin', () => {
    it('should link and return existing user if email matches', async () => {
      const mockUser = {
        id: 'user-google-1',
        username: 'existing_user',
        email: 'test@example.com',
        role: 'USER',
        googleId: null,
        avatarUrl: null,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        googleId: 'google_12345',
      });

      const result = await service.googleLogin({
        email: 'test@example.com',
        googleId: 'google_12345',
        name: 'Existing User',
      });

      expect(result.username).toBe('existing_user');
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-google-1' },
          data: expect.objectContaining({ googleId: 'google_12345' }),
        }),
      );
      expect(s2sMock.dispatchUserSync).toHaveBeenCalled();
    });

    it('should provision new user when email does not exist', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'new-user-1',
        username: 'new_google_user',
        email: 'newuser@example.com',
        role: 'USER',
        googleId: 'google_new_123',
        avatarUrl: null,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.googleLogin({
        email: 'newuser@example.com',
        name: 'New Google User',
        googleId: 'google_new_123',
      });

      expect(result.id).toBe('new-user-1');
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(s2sMock.dispatchUserSync).toHaveBeenCalled();
    });
  });
});
