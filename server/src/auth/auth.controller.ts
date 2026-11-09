import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Res,
  Headers,
  UnauthorizedException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService, SanitizedUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { OAuthAuthorizeDto, OAuthTokenDto } from './dto/oauth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';
import { ApiKeyGuard } from './api-key.guard';

@ApiTags('Authentication & SSO IAM')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new ecosystem account' })
  async register(@Body() dto: RegisterDto): Promise<SanitizedUser> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user & issue HttpOnly session cookie' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: SanitizedUser }> {
    const user = await this.authService.validateUser(dto);
    const token = await this.authService.createSession(user.id, dto.rememberMe);

    const isProduction = process.env.NODE_ENV === 'production';
    const maxAgeMs = (dto.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;

    res.cookie('gateway_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });

    return { user };
  }

  @Get('dev/users')
  @ApiOperation({ summary: 'List development accounts from database for quick testing' })
  async getDevUsers(): Promise<SanitizedUser[]> {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return this.authService.getDevUsers();
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user via Google ID token or Google SSO payload' })
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: SanitizedUser }> {
    const user = await this.authService.googleLogin(dto);
    const token = await this.authService.createSession(user.id, true);

    const isProduction = process.env.NODE_ENV === 'production';
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000;

    res.cookie('gateway_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });

    return { user };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile from active session cookie' })
  async getProfile(@Req() req: Request): Promise<{ user: SanitizedUser | null }> {
    const sessionToken = req.cookies?.['gateway_session'];
    if (!sessionToken) {
      return { user: null };
    }
    const user = await this.authService.validateSession(sessionToken);
    return { user };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile and sync to connected services' })
  async updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ user: SanitizedUser }> {
    const sessionToken = req.cookies?.['gateway_session'];
    if (!sessionToken) {
      throw new UnauthorizedException('Not authenticated');
    }
    const current = await this.authService.validateSession(sessionToken);
    if (!current) {
      throw new UnauthorizedException('Session expired');
    }
    const user = await this.authService.updateProfile(current.id, dto);
    return { user };
  }

  @Patch('users/:id/status')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Activate or deactivate user account (Admin / API Key only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<{ user: SanitizedUser }> {
    const user = await this.authService.updateUserStatus(id, dto);
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active session & clear cookie' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const sessionToken = req.cookies?.['gateway_session'];
    if (sessionToken) {
      await this.authService.revokeSession(sessionToken);
    }

    res.clearCookie('gateway_session', {
      path: '/',
    });

    return { success: true };
  }

  @Get('oauth/authorize')
  @ApiOperation({ summary: 'OAuth2 PKCE authorization endpoint (SSO redirect broker)' })
  async authorize(
    @Query() query: OAuthAuthorizeDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const sessionToken = req.cookies?.['gateway_session'];
    const user = sessionToken ? await this.authService.validateSession(sessionToken) : null;

    if (!user) {
      // Redirect to Cosmic Violet Login view with OAuth query preserved
      const loginUrl = new URL('/login', `${req.protocol}://${req.get('host')}`);
      loginUrl.searchParams.set('client_id', query.client_id);
      loginUrl.searchParams.set('redirect_uri', query.redirect_uri);
      loginUrl.searchParams.set('code_challenge', query.code_challenge);
      if (query.state) loginUrl.searchParams.set('state', query.state);

      res.redirect(loginUrl.toString());
      return;
    }

    // Active session confirmed: Generate single-use authorization code immediately
    const code = await this.authService.generateOAuthCode(
      query.client_id,
      user.id,
      query.redirect_uri,
      query.code_challenge,
    );

    const redirectUrl = new URL(query.redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (query.state) {
      redirectUrl.searchParams.set('state', query.state);
    }

    res.redirect(redirectUrl.toString());
  }

  @Post('oauth/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Server-to-server authorization code exchange with PKCE' })
  async exchangeToken(@Body() dto: OAuthTokenDto): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    user: SanitizedUser;
  }> {
    return this.authService.exchangeOAuthToken(dto);
  }

  @Get('oauth/userinfo')
  @ApiOperation({ summary: 'OIDC compatible UserInfo endpoint' })
  async getUserInfo(@Headers('authorization') authHeader: string): Promise<SanitizedUser> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = this.jwtService.verify(token);
      return {
        id: decoded.sub,
        username: decoded.username,
        email: decoded.email ?? null,
        role: decoded.role ?? 'USER',
        avatarUrl: decoded.avatarUrl ?? null,
        isEmailVerified: decoded.isEmailVerified ?? false,
        isActive: decoded.isActive ?? true,
        createdAt: new Date(),
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
