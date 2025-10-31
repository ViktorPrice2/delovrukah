import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_JWT_SECRET = 'insecure-development-secret';
const logger = new Logger('AuthConfig');

function normalizeSecret(secret: string | undefined | null): string | null {
  if (!secret) {
    return null;
  }

  const trimmed = secret.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveJwtSecret(configService: ConfigService): string {
  const secret = normalizeSecret(configService.get<string>('JWT_SECRET'));
  if (secret) {
    return secret;
  }

  const fallback = normalizeSecret(
    configService.get<string>('JWT_SECRET_FALLBACK'),
  );
  if (fallback) {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn(
        'JWT_SECRET is not set. Using JWT_SECRET_FALLBACK value.',
      );
    }
    return fallback;
  }

  if (process.env.NODE_ENV !== 'production') {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn(
        'JWT_SECRET is not set. Falling back to insecure development secret.',
      );
    }
    return DEFAULT_JWT_SECRET;
  }

  throw new Error('JWT secret is not configured');
}
