import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIoAdapter.name);

  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const cors = {
      origin: [frontendUrl],
      credentials: true,
    } satisfies ServerOptions['cors'];

    const server = super.createIOServer(port, {
      ...options,
      cors,
    });

    server.on('connection', (socket) => {
      this.logger.debug(`New client connected: ${socket.id}`);
    });

    return server;
  }
}
