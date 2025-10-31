import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface HandshakeData {
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, unknown>;
  auth?: unknown;
}

export class Socket extends EventEmitter {
  readonly id: string = randomUUID();
  readonly handshake: HandshakeData;
  private readonly rooms = new Set<string>();
  private readonly server: Server;

  constructor(server: Server, handshake?: Partial<HandshakeData>) {
    super();
    this.server = server;
    this.handshake = {
      headers: handshake?.headers ?? {},
      query: handshake?.query,
      auth: handshake?.auth,
    };
  }

  disconnect(closeConnection = false): void {
    this.server.detach(this);

    if (closeConnection) {
      this.server.close();
    }

    this.emit('disconnect');
  }

  leaveAll(): void {
    for (const room of Array.from(this.rooms)) {
      this.server.leaveRoom(this, room);
    }
  }

  join(room: string): Promise<void> {
    this.rooms.add(room);
    this.server.joinRoom(this, room);
    return Promise.resolve();
  }
}

export interface BroadcastOperator {
  emit(event: string, payload: unknown): void;
}

export class Server extends EventEmitter {
  private readonly sockets = new Set<Socket>();
  private readonly rooms = new Map<string, Set<Socket>>();

  constructor() {
    super();
  }

  createSocket(handshake?: Partial<HandshakeData>): Socket {
    const socket = new Socket(this, handshake);
    this.sockets.add(socket);
    this.emit('connection', socket);
    return socket;
  }

  detach(socket: Socket): void {
    this.sockets.delete(socket);
    for (const room of Array.from(this.rooms.keys())) {
      this.leaveRoom(socket, room);
    }
  }

  joinRoom(socket: Socket, room: string): void {
    const members = this.rooms.get(room) ?? new Set<Socket>();
    members.add(socket);
    this.rooms.set(room, members);
  }

  leaveRoom(socket: Socket, room: string): void {
    const members = this.rooms.get(room);
    if (!members) {
      return;
    }

    members.delete(socket);

    if (members.size === 0) {
      this.rooms.delete(room);
    }
  }

  to(room: string): BroadcastOperator {
    return {
      emit: (event: string, payload: unknown) => {
        const members = this.rooms.get(room);
        if (!members) {
          return;
        }

        for (const member of members) {
          member.emit(event, payload);
        }
      },
    };
  }

  close(): void {
    for (const socket of Array.from(this.sockets)) {
      socket.removeAllListeners();
    }
    this.sockets.clear();
    this.rooms.clear();
    this.removeAllListeners();
  }
}
