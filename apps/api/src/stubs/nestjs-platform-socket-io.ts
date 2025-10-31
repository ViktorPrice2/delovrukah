import type { WebSocketAdapter } from '@nestjs/common/interfaces/websockets/web-socket-adapter.interface';
import type { Observable } from 'rxjs';
import { isObservable, from, of } from 'rxjs';
import { Server, Socket } from './socket.io';

type MessageHandler = {
  message: unknown;
  callback: (...args: unknown[]) => unknown;
  isAckHandledManually: boolean;
};

type AckCallback = (...args: unknown[]) => void;

function toObservable<T>(value: T | Promise<T> | Observable<T>): Observable<T> {
  if (isObservable(value)) {
    return value;
  }

  if (value instanceof Promise) {
    return from(value);
  }

  return of(value);
}

export class IoAdapter implements WebSocketAdapter<Server, Socket> {
  // Accept optional arguments to stay compatible with older NestJS versions
  constructor(...args: unknown[]) {
    void args.length;
  }

  create(port: number, options?: unknown): Server {
    void port;
    void options;
    return new Server();
  }

  createIOServer(port: number, options?: unknown): Server {
    void port;
    void options;
    return new Server();
  }

  bindClientConnect(server: Server, callback: (client: Socket) => void): void {
    server.on('connection', callback);
  }

  bindClientDisconnect(client: Socket, callback: () => void): void {
    client.on('disconnect', callback);
  }

  bindMessageHandlers(
    client: Socket,
    handlers: MessageHandler[],
    transform: (data: unknown) => Observable<unknown>,
  ): void {
    for (const handler of handlers) {
      client.on(String(handler.message), (...args: unknown[]) => {
        const maybeAck = args[args.length - 1];
        const ack =
          typeof maybeAck === 'function'
            ? (args.pop() as AckCallback)
            : undefined;
        const result = handler.callback(...args);
        const response$ = toObservable(transform(result));

        if (handler.isAckHandledManually || !ack) {
          response$.subscribe({
            next: () => undefined,
            error: () => undefined,
          });
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
