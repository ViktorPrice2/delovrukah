import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { JwtPayload } from './jwt.strategy';
import { resolveJwtSecret } from './jwt-secret.util';

export interface HandshakeData {
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, unknown>;
  auth?: unknown;
}

export interface AuthenticatedSocket {
  readonly id: string;
  readonly handshake: HandshakeData;
  disconnect(close?: boolean): void;
  leaveAll(): void;
  join(room: string): Promise<void> | void;
  user?: JwtPayload;
}

function isHandshakeData(value: unknown): value is HandshakeData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as HandshakeData;
  return (
    typeof candidate.headers === 'object' &&
    candidate.headers !== null &&
    (candidate.query === undefined || typeof candidate.query === 'object')
  );
}

export function isAuthenticatedSocket(
  value: unknown,
): value is AuthenticatedSocket {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AuthenticatedSocket>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.disconnect === 'function' &&
    typeof candidate.leaveAll === 'function' &&
    typeof candidate.join === 'function' &&
    isHandshakeData(candidate.handshake)
  );
}

function assertAuthenticatedSocket(
  client: unknown,
): asserts client is AuthenticatedSocket {
  if (!isAuthenticatedSocket(client)) {
    throw new WsException('Invalid WebSocket client');
  }
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<unknown>();

    assertAuthenticatedSocket(client);

    if (client.user) {
      return true;
    }

    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized');
    }

    const secret = resolveJwtSecret(this.configService);

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      client.user = payload;
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown verification error';
      this.logger.debug(
        `Failed to authenticate websocket client ${client.id}: ${message}`,
      );
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    const authHeader = client.handshake.headers.authorization;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    const tokenFromQuery = client.handshake.query?.token;

    if (typeof tokenFromQuery === 'string') {
      return tokenFromQuery;
    }

    const handshakeAuth = client.handshake.auth as
      | { token?: unknown }
      | undefined;

    if (handshakeAuth && typeof handshakeAuth.token === 'string') {
      return handshakeAuth.token;
    }

    return null;
  }
}
