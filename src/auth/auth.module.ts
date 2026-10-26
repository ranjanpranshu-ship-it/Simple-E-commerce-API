import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserModule } from '../users/user.module.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { RolesGuard } from './guards/roles.guard.js';
import { JwtAuthGuard } from './guards/jwt.guard.js';
import { PasswordReset } from './entities/password-reset.entity.js';
import { User } from '../users/user.entity.js';
import { EmailVerification } from './entities/email-verification.entity.js';
import { OAuthIdentity } from './entities/oauth-identity.entity.js';
import { LinkingIntent } from './entities/linking-intent.entity.js';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([
      RefreshToken,
      PasswordReset,
      User,
      EmailVerification,
      OAuthIdentity,
      LinkingIntent,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy, RolesGuard, JwtAuthGuard],
  exports: [RolesGuard, JwtAuthGuard],
})
export class AuthModule {}
