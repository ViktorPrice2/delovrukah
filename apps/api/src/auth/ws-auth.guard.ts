import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from './jwt.strategy';

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    await this.validateClient(client);
    return true;
  }

  async validateClient(client: AuthenticatedSocket): Promise<JwtPayload> {
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized');
    }

    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new WsException('Server configuration error');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      client.user = payload;
      return payload;
    } catch {
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
