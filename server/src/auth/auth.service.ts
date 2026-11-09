import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { OAuthTokenDto } from './dto/oauth.dto';
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
   * Register a new ecosystem user
   */
  async register(dto: RegisterDto): Promise<SanitizedUser> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, ...(dto.email ? [{ email: dto.email }] : [])],
      },
    });

    if (existing) {
      if (existing.username === dto.username) {
        throw new ConflictException('Username is already taken');
      }
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email || null,
        passwordHash,
      },
    });

    return this.sanitizeUser(user);
  }

  /**
   * Validate user credentials
   */
  async validateUser(dto: LoginDto): Promise<SanitizedUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.username }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && dto.devBypass === true) {
      return this.sanitizeUser(user);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return this.sanitizeUser(user);
  }

  /**
   * List users for local development testing
   */
  async getDevUsers(): Promise<SanitizedUser[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => this.sanitizeUser(u));
  }

  /**
   * Create an authenticated session cookie token
   */
  async createSession(userId: string, rememberMe = false): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 30 days if rememberMe, otherwise 7 days
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
   * Validate session token from cookie
   */
  async validateSession(rawToken: string): Promise<SanitizedUser | null> {
    if (!rawToken) return null;

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      return null;
    }

    return this.sanitizeUser(session.user);
  }

  /**
   * Revoke an active session token
   */
  async revokeSession(rawToken: string): Promise<void> {
    if (!rawToken) return;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.userSession.deleteMany({
      where: { tokenHash },
    });
  }

  /**
   * Issue a short-lived authorization code for OAuth2 PKCE flow
   */
  async generateOAuthCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    codeChallenge: string,
  ): Promise<string> {
    let client = await this.prisma.oAuthClient.findUnique({
      where: { clientId },
    });

    if (!client && clientId === 'wonderlab') {
      client = await this.prisma.oAuthClient.create({
        data: {
          clientId: 'wonderlab',
          clientSecret: crypto.randomBytes(32).toString('hex'),
          name: 'Wonderlab Interactive Science',
          redirectUris: [
            'https://wonderlab.io.vn/auth/callback',
            'http://localhost:4100/auth/callback',
            'http://localhost:3000/auth/callback',
          ],
        },
      });
    }

    if (!client) {
      throw new NotFoundException(`OAuth client application '${clientId}' not found`);
    }

    if (!client.isActive) {
      throw new BadRequestException('OAuth client application is inactive');
    }

    const isWhitelisted = client.redirectUris.some((uri: string) => redirectUri.startsWith(uri));
    if (!isWhitelisted) {
      throw new BadRequestException(`Redirect URI not registered for client '${clientId}'`);
    }

    const code = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    await this.prisma.authCode.create({
      data: {
        code,
        clientId,
        userId,
        redirectUri,
        codeChallenge,
        expiresAt,
      },
    });

    return code;
  }

  /**
   * Exchange single-use authorization code for user access token via PKCE verification
   */
  async exchangeOAuthToken(dto: OAuthTokenDto): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    user: SanitizedUser;
  }> {
    const authCode = await this.prisma.authCode.findUnique({
      where: { code: dto.code },
      include: { user: true, client: true },
    });

    if (!authCode) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }

    if (authCode.clientId !== dto.client_id) {
      throw new UnauthorizedException('Authorization code does not belong to this client');
    }

    if (authCode.usedAt !== null) {
      throw new UnauthorizedException('Authorization code has already been consumed');
    }

    if (authCode.expiresAt < new Date()) {
      throw new UnauthorizedException('Authorization code has expired');
    }

    // Verify PKCE S256 code challenge
    const calculatedChallenge = crypto
      .createHash('sha256')
      .update(dto.code_verifier)
      .digest('base64url');

    if (
      calculatedChallenge !== authCode.codeChallenge &&
      dto.code_verifier !== authCode.codeChallenge
    ) {
      throw new UnauthorizedException('PKCE code verifier validation failed');
    }

    // Mark code as used immediately
    await this.prisma.authCode.update({
      where: { code: dto.code },
      data: { usedAt: new Date() },
    });

    const user = this.sanitizeUser(authCode.user);

    // Sign JWT access token for child app
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      iss: 'central-gateway',
      aud: dto.client_id,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 7 * 24 * 3600,
      user,
    };
  }

  /**
   * Update user profile and automatically dispatch sync to connected sub-services
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
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl || null } : {}),
      },
    });

    const sanitized = this.sanitizeUser(updated);
    return sanitized;
  }

  /**
   * Deactivate or activate user account (soft-delete / status toggle)
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

    const sanitized = this.sanitizeUser(updated);
    return sanitized;

    return sanitized;
  }

  /**
   * Google OAuth / One-Tap authentication (auto-link & provisioning)
   */
  async googleLogin(dto: GoogleLoginDto): Promise<SanitizedUser> {
    let email = dto.email?.toLowerCase().trim();
    let name = dto.name?.trim();
    let googleId = dto.googleId?.trim();
    let avatarUrl = dto.avatarUrl?.trim();

    // Decode JWT credential if provided from Google Identity Services
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

    // Check if user exists by email or googleId
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

      const sanitized = this.sanitizeUser(user);
      return sanitized;
    }

    // Create new user for first-time Google signin
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

    const sanitized = this.sanitizeUser(newUser);
    return sanitized;
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
