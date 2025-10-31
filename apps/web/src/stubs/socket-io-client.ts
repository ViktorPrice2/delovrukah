type Listener = (...args: unknown[]) => void;

type EventMap = Record<string, Listener>;

type ListenerRegistry = Map<string, Set<Listener>>;

class MockSocket<ServerToClient extends EventMap, ClientToServer extends EventMap> {
  private readonly listeners: ListenerRegistry = new Map();

  constructor(
    _url: string,
    private readonly options?: unknown
  ) {
    queueMicrotask(() => {
      this.dispatch("connect_error", this.createError());
    });
  }

  on<Event extends keyof ServerToClient | "connect" | "disconnect" | "connect_error">(
    event: Event,
    listener: Listener
  ): this {
    this.register(event as string, listener);
    return this;
  }

  emit<Event extends keyof ClientToServer>(event: Event, ..._args: Parameters<ClientToServer[Event]>): this {
    void _args;
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `socket.io-client stub: attempted to emit "${String(event)}" with options`,
        this.options
      );
    }
    return this;
  }

  disconnect(): this {
    this.dispatch("disconnect");
    return this;
  }

  private register(event: string, listener: Listener): void {
    const listeners = this.listeners.get(event) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
  }

  private dispatch(event: string, ...args: unknown[]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) {
      return;
    }

    for (const listener of Array.from(listeners)) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`socket.io-client stub listener for "${event}" failed`, error);
      }
    }
  }

  private createError(): Error {
    return new Error(
      "Realtime chat is unavailable because the socket.io-client package is not installed in this environment."
    );
  }
}

export type Socket<ServerToClient extends EventMap, ClientToServer extends EventMap> = MockSocket<
  ServerToClient,
  ClientToServer
>;

export interface ManagerOptions {
  transports?: string[];
  auth?: unknown;
}

export function io<ServerToClient extends EventMap, ClientToServer extends EventMap>(
  url: string,
  options?: ManagerOptions
): Socket<ServerToClient, ClientToServer> {
  return new MockSocket<ServerToClient, ClientToServer>(url, options);
}

export default io;
