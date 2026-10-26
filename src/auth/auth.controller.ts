import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt.guard.js';
import { LocalAuthGuard } from './guards/local.guard.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ForgetPasswordDto } from './dto/forget-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(201)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ schema: { example: { email: 'test@example.com', password: 'password123' } } })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Login a user with email and password' })
  @ApiBody({ schema: { example: { email: 'test@example.com', password: 'password123' } } })
  @ApiResponse({ status: 200, description: 'refresh_token and access_token' })
  async login(@Req() req: any, @Body() _dto: LoginDto) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('logout')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (revoke refresh tokens)' })
  async logout(@Req() req: any) {
    return this.authService.logout(req.user);
  }

  @HttpCode(200)
  @Post('refresh')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Rotate refresh token' })
  @ApiBody({ schema: { example: { refresh_token: '123456' } } })
  @ApiResponse({ status: 200, description: 'access_token and a new refresh_token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User information' })
  async me(@Req() req: any) {
    return this.authService.me(req.user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleAuth() {
    // The passport strategy handles the redirect; this handler is never reached.
  }

  @Get('google/callback')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const { access_token, refresh_token } = await this.authService.login(req.user);
    const frontendUrl = this.configService.get('FRONTEND_URL');
    res.redirect(
      `${frontendUrl}/auth/callback?access_token=${access_token}&refresh_token=${refresh_token}`,
    );
  }

  @Post('forget-password')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ schema: { example: { email: 'user@gmail.com' } } })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgetPassword(@Body() dto: ForgetPasswordDto) {
    return this.authService.forgetPassword(dto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Reset password with a token' })
  @ApiBody({ schema: { example: { token: 'reset-token-abc', password: 'newpass123' } } })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('verify-email')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Verify email with a token' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('link/google')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a Google account linking URL' })
  async linkGoogle(@Req() req: any) {
    const linkingToken = await this.authService.createLinkingIntent(req.user.id);
    const state = Buffer.from(
      JSON.stringify({ purpose: 'linking', linkingToken }),
    ).toString('base64url');

    const params = new URLSearchParams({
      client_id: this.configService.get('GOOGLE_CLIENT_ID') ?? '',
      redirect_uri: this.configService.get('GOOGLE_LINKING_CALLBACK_URL') ?? '',
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  }

  @Get('link/google/callback')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Complete Google account linking' })
  async linkGoogleCallback(@Query('code') code: string, @Query('state') state: string) {
    return this.authService.completeGoogleLink(code, state);
  }

  @Post('unlink/google')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink the Google account from the current user' })
  async unlinkGoogle(@Req() req: any) {
    return this.authService.unlinkGoogle(req.user.id);
  }
}
