import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../users/user.entity.js';
import { EmailVerification } from '../auth/entities/email-verification.entity.js';
import { OAuthIdentity } from '../auth/entities/oauth-identity.entity.js';
import { PasswordReset } from '../auth/entities/password-reset.entity.js';
import { RefreshToken } from '../auth/entities/refresh-token.entity.js';
import { LinkingIntent } from '../auth/entities/linking-intent.entity.js';

@Injectable()
export class PostOrmClassService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      entities: [
        User,
        EmailVerification,
        OAuthIdentity,
        PasswordReset,
        RefreshToken,
        LinkingIntent,
      ],
      // Never auto-sync the schema in production.
      synchronize: process.env.NODE_ENV !== 'production',
    };
  }
}
