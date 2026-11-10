import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: {
    user: { findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    userSession: { create: jest.Mock; findUnique: jest.Mock; deleteMany: jest.Mock };
  };
  let jwtMock: { sign: jest.Mock; decode: jest.Mock };

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
    };

    jwtMock = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      decode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
    });
  });

  describe('updateProfile', () => {
    it('should update user username and email successfully', async () => {
      const existingUser = {
        id: 'user-1',
        username: 'old_user',
        email: 'old@example.com',
        role: 'USER',
        avatarUrl: null,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
      };

      prismaMock.user.findUnique.mockImplementation(
        ({ where }: { where: { id?: string; username?: string; email?: string } }) => {
          if (where.id) return Promise.resolve(existingUser);
          return Promise.resolve(null);
        },
      );

      prismaMock.user.update.mockResolvedValue({
        ...existingUser,
        username: 'new_user',
        email: 'new@example.com',
      });

      const result = await service.updateProfile('user-1', {
        username: 'new_user',
        email: 'new@example.com',
      });

      expect(result.username).toBe('new_user');
      expect(result.email).toBe('new@example.com');
    });
  });
});
