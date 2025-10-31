import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../logger/app-logger';

const MIN_SECRET_LENGTH = 32;
const DEFAULT_DEV_SECRET = 'local-development-jwt-secret-that-is-long-enough';
const logger = new AppLogger('AuthConfig');

function normalizeSecret(secret: string | undefined | null): string | null {
  if (!secret) {
    return null;
  }

  const trimmed = secret.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isProduction(configService: ConfigService): boolean {
  const nodeEnv = normalizeSecret(configService.get<string>('NODE_ENV'));
  return nodeEnv?.toLowerCase() === 'production';
}

function resolveForDevelopment(reason: string): string {
  logger.warn(
    `${reason} Falling back to a default development secret. ` +
      'Never use this fallback in production environments.',
  );

  return DEFAULT_DEV_SECRET;
}

export function resolveJwtSecret(configService: ConfigService): string {
  const secret = normalizeSecret(configService.get<string>('JWT_SECRET'));
  const production = isProduction(configService);

  if (!secret) {
    if (production) {
      const message = 'JWT_SECRET environment variable must be defined.';
      logger.error(message);
      throw new Error(message);
    }

    return resolveForDevelopment('JWT_SECRET environment variable is not defined.');
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    if (production) {
      const message = `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`;
      logger.error(message);
      throw new Error(message);
    }

    return resolveForDevelopment(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`,
    );
  }

  return secret;
}
