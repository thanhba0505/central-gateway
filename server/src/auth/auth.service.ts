import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';

export interface SanitizedUser {
  id: string;
  username: string;
  email: string | null;
  role: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto): Promise<SanitizedUser> {
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email is already registered');
      }
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email || null,
        passwordHash,
        role: 'USER',
        isEmailVerified: false,
        isActive: true,
      },
    });

    return this.sanitizeUser(user);
  }

  /**
   * Validate user credentials for login
   */
  async validateUser(dto: LoginDto): Promise<SanitizedUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.username }],
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account has been deactivated. Please contact administrator.');
    }

    const isMatch = await argon2.verify(user.passwordHash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Create user session and issue token
   */
  async createSession(userId: string, rememberMe?: boolean): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const ttlDays = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.userSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<SanitizedUser | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    if (!session.user.isActive) {
      return null;
    }

    return this.sanitizeUser(session.user);
  }

  /**
   * Revoke session on logout
   */
  async revokeSession(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.prisma.userSession.deleteMany({
      where: { tokenHash },
    });
  }

  /**
   * List development accounts for quick testing
   */
  async getDevUsers(): Promise<SanitizedUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => this.sanitizeUser(u));
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SanitizedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.username && dto.username !== user.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existing) {
        throw new ConflictException('Username is already taken');
      }
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email is already registered');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username ? { username: dto.username } : {}),
        ...(dto.email !== undefined ? { email: dto.email || null } : {}),
      },
    });

    return this.sanitizeUser(updated);
  }

  /**
   * Deactivate or activate user account
   */
  async updateUserStatus(userId: string, dto: UpdateUserStatusDto): Promise<SanitizedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If deactivating, immediately revoke all active sessions
    if (!dto.isActive) {
      await this.prisma.userSession.deleteMany({
        where: { userId },
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: dto.isActive },
    });

    return this.sanitizeUser(updated);
  }

  /**
   * Google OAuth authentication
   */
  async googleLogin(dto: GoogleLoginDto): Promise<SanitizedUser> {
    let email = dto.email?.toLowerCase().trim();
    let name = dto.name?.trim();
    let googleId = dto.googleId?.trim();
    let avatarUrl = dto.avatarUrl?.trim();

    if (dto.credential && (!email || !googleId)) {
      try {
        const decoded = this.jwtService.decode(dto.credential) as Record<string, unknown> | null;
        if (decoded) {
          if (typeof decoded.email === 'string') email = decoded.email.toLowerCase().trim();
          if (typeof decoded.name === 'string') name = decoded.name.trim();
          if (typeof decoded.sub === 'string') googleId = decoded.sub.trim();
          if (typeof decoded.picture === 'string') avatarUrl = decoded.picture.trim();
        }
      } catch {
        // Fallback
      }
    }

    if (!email) {
      throw new BadRequestException('Could not extract email from Google account');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(googleId ? [{ googleId }] : [])],
      },
    });

    const adminEmails = (
      process.env.ADMIN_EMAILS || 'admin@wonderlab.local,thanhba@wonderlab.local'
    )
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const shouldBeAdmin = adminEmails.includes(email);

    if (user) {
      if (!user.isActive) {
        throw new ForbiddenException('Account has been deactivated. Please contact administrator.');
      }

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleId || `google_${Date.now()}`,
          isEmailVerified: true,
          ...(avatarUrl ? { avatarUrl: user.avatarUrl || avatarUrl } : {}),
          ...(shouldBeAdmin && user.role !== 'ADMIN' ? { role: 'ADMIN' } : {}),
        },
      });

      return this.sanitizeUser(user);
    }

    const baseUsername =
      (name ? name.replace(/\s+/g, '_').toLowerCase() : email.split('@')[0])
        .replace(/[^a-zA-Z0-9_]/g, '')
        .slice(0, 20) || 'user';

    let uniqueUsername = baseUsername;
    let counter = 1;
    while (await this.prisma.user.findUnique({ where: { username: uniqueUsername } })) {
      uniqueUsername = `${baseUsername}_${counter++}`;
    }

    const newUser = await this.prisma.user.create({
      data: {
        username: uniqueUsername,
        email,
        googleId: googleId || `google_${Date.now()}`,
        avatarUrl: avatarUrl || null,
        isEmailVerified: true,
        role: shouldBeAdmin ? 'ADMIN' : 'USER',
        isActive: true,
      },
    });

    return this.sanitizeUser(newUser);
  }

  private sanitizeUser(user: {
    id: string;
    username: string;
    email: string | null;
    role: string;
    avatarUrl: string | null;
    isEmailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
  }): SanitizedUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
