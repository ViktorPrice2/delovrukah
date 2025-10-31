import type { WebSocketAdapter } from '@nestjs/common/interfaces/websockets/web-socket-adapter.interface';
import type { Observable } from 'rxjs';
import { isObservable, from, of } from 'rxjs';
import { Server, Socket } from './socket.io';

type MessageHandler = {
  message: unknown;
  callback: (...args: any[]) => any;
  isAckHandledManually: boolean;
};

function toObservable<T>(value: T | Promise<T> | Observable<T>): Observable<T> {
  if (isObservable(value)) {
    return value;
  }

  if (value instanceof Promise) {
    return from(value);
  }

  return of(value as T);
}

export class IoAdapter implements WebSocketAdapter<Server, Socket> {
  // Accept optional arguments to stay compatible with older NestJS versions
  constructor(..._args: unknown[]) {}

  create(_port: number, _options?: unknown): Server {
    return new Server();
  }

  createIOServer(_port: number, _options?: unknown): Server {
    return new Server();
  }

  bindClientConnect(server: Server, callback: Function): void {
    server.on('connection', callback as (client: Socket) => void);
  }

  bindClientDisconnect(client: Socket, callback: Function): void {
    client.on('disconnect', callback as () => void);
  }

  bindMessageHandlers(
    client: Socket,
    handlers: MessageHandler[],
    transform: (data: any) => Observable<any>,
  ): void {
    for (const handler of handlers) {
      client.on(handler.message as string, (...args: any[]) => {
        const maybeAck = args[args.length - 1];
        const ack = typeof maybeAck === 'function' ? (args.pop() as Function) : undefined;
        const result = handler.callback(...args);
        const response$ = toObservable(transform(result));

        if (handler.isAckHandledManually || !ack) {
          response$.subscribe();
          return;
        }

        response$.subscribe({
          next: (data) => ack(data),
          error: (error) => ack({ error }),
        });
      });
    }
  }

  close(server: Server): void {
    server.close();
  }
}
