import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from './jwt.strategy';

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    if (client.user) {
      return true;
    }

    throw new WsException('Unauthorized');
  }
}
