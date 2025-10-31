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

  disconnect(_close?: boolean): void {
    this.server.detach(this);
    this.emit('disconnect');
  }

  leaveAll(): void {
    for (const room of Array.from(this.rooms)) {
      this.server.leaveRoom(this, room);
    }
  }

  async join(room: string): Promise<void> {
    this.rooms.add(room);
    this.server.joinRoom(this, room);
  }
}

export interface BroadcastOperator {
  emit(event: string, payload: unknown): void;
}

export class Server {
  private readonly sockets = new Set<Socket>();
  private readonly rooms = new Map<string, Set<Socket>>();

  createSocket(handshake?: Partial<HandshakeData>): Socket {
    const socket = new Socket(this, handshake);
    this.sockets.add(socket);
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
}
