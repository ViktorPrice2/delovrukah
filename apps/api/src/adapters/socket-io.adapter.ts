import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';

export class SocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIoAdapter.name);

  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: Record<string, unknown>) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const cors = {
      origin: [frontendUrl],
      credentials: true,
    } as const;

    const server = super.createIOServer(port, {
      ...options,
      cors,
    });

    if (typeof server?.on === 'function') {
      server.on('connection', (socket: { id?: string }) => {
        this.logger.debug(`New client connected: ${socket?.id ?? 'unknown'}`);
      });
    }

    return server;
  }
}
