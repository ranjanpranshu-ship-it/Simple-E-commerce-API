import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service.js';
import { UserService } from '../../users/user.service.js';
import { OAuthIdentity } from '../entities/oauth-identity.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    @InjectRepository(OAuthIdentity)
    private readonly identityRepo: Repository<OAuthIdentity>,
  ) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') || '',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: config.get('GOOGLE_CALLBACK_URL') || '',
      scope: ['profile', 'email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value || '';
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    const existing = await this.identityRepo.findOne({
      where: { provider: 'google', providerId: profile.id },
    });

    if (existing) {
      const user = await this.userService.findOne(existing.userId);
      if (!user) {
        throw new UnauthorizedException('Linked user no longer exists');
      }
      return user;
    }

    const user = await this.authService.findOrCreateByGoogle(email);
    await this.identityRepo.save({
      provider: 'google',
      providerId: profile.id,
      email,
      userId: user.id,
    });

    return user;
  }
}
