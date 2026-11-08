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
  let jwtMock: { sign: jest.Mock };
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
});
