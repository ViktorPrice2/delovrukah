import { Server } from './socket.io';

export interface GatewayLifecycle {
  handleConnection?(client: unknown): void | Promise<void>;
  handleDisconnect?(client: unknown): void | Promise<void>;
}

export interface OnGatewayConnection extends GatewayLifecycle {}
export interface OnGatewayDisconnect extends GatewayLifecycle {}

export class WsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WsException';
  }
}

type ClassDecoratorFactory<T extends unknown[]> = (...args: T) => ClassDecorator;
type MethodDecoratorFactory<T extends unknown[]> = (...args: T) => MethodDecorator;
type ParameterDecoratorFactory<T extends unknown[]> = (...args: T) => ParameterDecorator;
type PropertyDecoratorFactory<T extends unknown[]> = (...args: T) => PropertyDecorator;

export const WebSocketGateway: ClassDecoratorFactory<[unknown?]> = () => () => undefined;

export const SubscribeMessage: MethodDecoratorFactory<[string?]> = () => () => undefined;

export const ConnectedSocket: ParameterDecoratorFactory<[]> = () => () => undefined;

export const MessageBody: ParameterDecoratorFactory<[]> = () => () => undefined;

const serverPropertyKey = Symbol('websocketServer');

export const WebSocketServer: PropertyDecoratorFactory<[]> = () => (target, propertyKey) => {
  Object.defineProperty(target, propertyKey, {
    configurable: true,
    get() {
      if (!(serverPropertyKey in this)) {
        Object.defineProperty(this, serverPropertyKey, {
          value: new Server(),
          writable: true,
          configurable: false,
        });
      }

      const storage = this as Record<PropertyKey, unknown>;
      return storage[serverPropertyKey];
    },
    set(value: unknown) {
      Object.defineProperty(this, serverPropertyKey, {
        value,
        writable: true,
        configurable: false,
      });
    },
  });
};

export type WebSocketServerType = InstanceType<typeof Server>;
