import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtPayload } from './jwt.strategy';

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

export function isAuthenticatedSocket(value: unknown): value is AuthenticatedSocket {
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

function assertAuthenticatedSocket(client: unknown): asserts client is AuthenticatedSocket {
  if (!isAuthenticatedSocket(client)) {
    throw new WsException('Invalid WebSocket client');
  }
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<unknown>();

    assertAuthenticatedSocket(client);

    if (client.user) {
      return true;
    }

    throw new WsException('Unauthorized');
  }
}
