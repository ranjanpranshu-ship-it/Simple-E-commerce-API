import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../users/user.service.js';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { User } from '../users/user.entity.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordReset } from './entities/password-reset.entity.js';
import { EmailVerification } from './entities/email-verification.entity.js';
import { OAuthIdentity } from './entities/oauth-identity.entity.js';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { LinkingIntent } from './entities/linking-intent.entity.js';

const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private tokensRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordReset) private resetRepo: Repository<PasswordReset>,
    @InjectRepository(EmailVerification)
    private verificationRepo: Repository<EmailVerification>,
    @InjectRepository(OAuthIdentity)
    private identityRepo: Repository<OAuthIdentity>,
    @InjectRepository(LinkingIntent)
    private linkingRepo: Repository<LinkingIntent>,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_LINKING_CALLBACK_URL'),
    );
  }

  async validateUser(email: string, password: string) {
    return this.userService.ValidateUser(email, password);
  }

  async register(email: string, password: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const saved = await this.userService.CreateUser(email, password);
    await this.sendVerificationEmail(saved.id, saved.email);

    // Never return the password hash to the client.
    return this.userService.toSafeUser(saved);
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      tokenVersion: user.tokenVersion,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.tokensRepo.save({
      userId: user.id,
      token: hash,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      email: user.email,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.tokensRepo.findOne({ where: { token: hash } });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findOne(stored.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate the refresh token: delete the old one, issue a new one.
    await this.tokensRepo.delete(stored.id);
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    await this.tokensRepo.save({
      userId: stored.userId,
      token: newHash,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    });

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        tokenVersion: user.tokenVersion,
      },
      { expiresIn: '15m' },
    );

    return { access_token: accessToken, refresh_token: newRefreshToken };
  }

  async logout(user: { id: number }) {
    await this.tokensRepo.delete({ userId: user.id });
    return { message: 'Logout success' };
  }

  async findOrCreateByGoogle(email: string) {
    const existing = await this.userService.GetUserByEmail(email);
    if (existing) {
      return existing;
    }
    // Google accounts are created without a local password.
    return this.userService.CreateUser(email);
  }

  async forgetPassword(email: string) {
    const user = await this.userService.GetUserByEmail(email);

    // Always respond the same way to avoid leaking which emails are registered.
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.resetRepo.save({
      userId: user.id,
      tokenhash: tokenHash,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
      used: false,
    });

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const reset = await this.resetRepo.findOneBy({ tokenhash: tokenHash });

    if (!reset || reset.used || reset.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepo.findOneBy({ id: reset.userId });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    user.password = hashedPassword;
    user.tokenVersion += 1;
    await this.userRepo.save(user);

    // Revoke all existing sessions after a password reset.
    await this.tokensRepo.delete({ userId: user.id });

    reset.used = true;
    await this.resetRepo.save(reset);

    return { message: 'Password reset successfully' };
  }

  async sendVerificationEmail(userId: number, _email: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.verificationRepo.save({
      userId,
      tokenhash: tokenHash,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
      used: false,
    });

    // Email delivery is intentionally not handled here (no SMTP).
  }

  async verifyEmail(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const verification = await this.verificationRepo.findOneBy({
      tokenhash: tokenHash,
    });

    if (!verification || verification.used || verification.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    const user = await this.userRepo.findOneBy({ id: verification.userId });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    user.verified = true;
    await this.userRepo.save(user);

    verification.used = true;
    await this.verificationRepo.save(verification);

    return { message: 'Email verified successfully' };
  }

  async completeGoogleLink(code: string, state: string) {
    let parsed: { purpose?: string; linkingToken?: string };
    try {
      parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      throw new BadRequestException('Invalid linking state');
    }

    if (parsed.purpose !== 'linking' || !parsed.linkingToken) {
      throw new BadRequestException('Invalid linking state');
    }

    const intent = await this.verifyLinkingIntent(parsed.linkingToken);
    const userId = intent.userId;

    const googleUser = await this.exchangeGoogleCode(code);

    if (!googleUser.email_verified) {
      throw new UnauthorizedException('Google email not verified');
    }

    const existing = await this.identityRepo.findOne({
      where: { provider: 'google', providerId: googleUser.sub },
    });
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Invalid linking intent');
    }
    if (existing && existing.userId !== userId) {
      throw new UnauthorizedException('Google account already linked to another user');
    }
    if (existing) {
      existing.email = googleUser.email;
      await this.identityRepo.save(existing);
    } else {
      const identity = this.identityRepo.create({
        provider: 'google',
        providerId: googleUser.sub,
        email: googleUser.email,
        userId,
      });
      await this.identityRepo.save(identity);
    }

    await this.consumeLinkingIntent(parsed.linkingToken);
    return { success: true, message: 'Google account linked successfully' };
  }

  async unlinkGoogle(userId: number) {
    const identity = await this.identityRepo.findOne({
      where: { provider: 'google', userId },
    });
    if (!identity) {
      throw new BadRequestException('Google account not linked');
    }

    const identityCount = await this.identityRepo.count({ where: { userId } });
    const hasPassword = await this.userService.hasPassword(userId);

    if (identityCount === 1 && !hasPassword) {
      throw new BadRequestException(
        'Set a password before unlinking your only Google account',
      );
    }

    await this.identityRepo.remove(identity);
    return { success: true, message: 'Google account unlinked successfully' };
  }

  private async consumeLinkingIntent(linkingToken: string): Promise<void> {
    await this.linkingRepo.delete({ token: linkingToken });
  }

  private async verifyLinkingIntent(
    linkingToken: string,
  ): Promise<{ userId: number }> {
    const intent = await this.linkingRepo.findOneBy({ token: linkingToken });
    if (!intent || intent.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired linking intent');
    }
    return { userId: intent.userId };
  }

  async createLinkingIntent(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.linkingRepo.save({
      token,
      userId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    return token;
  }

  private async exchangeGoogleCode(
    code: string,
  ): Promise<{ sub: string; email: string; email_verified: boolean }> {
    const { tokens } = await this.googleClient.getToken(code);

    if (!tokens.id_token) {
      throw new UnauthorizedException('Invalid Google code');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.configService.get('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Invalid Google code');
    }

    return {
      sub: payload.sub,
      email: payload.email as string,
      email_verified: payload.email_verified as boolean,
    };
  }

  async me(user: User) {
    const foundUser = await this.userService.findOne(user.id);
    if (!foundUser) {
      throw new UnauthorizedException('Invalid user');
    }
    return this.userService.toSafeUser(foundUser);
  }
}
