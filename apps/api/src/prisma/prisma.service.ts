import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';

type PrismaClientSubset = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  user: {
    findMany: () => Promise<User[]>;
  };
};

type PrismaClientConstructor = new () => PrismaClientSubset;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClientSubset;

  constructor() {
    const PrismaClientFactory =
      PrismaClient as unknown as PrismaClientConstructor;
    this.client = new PrismaClientFactory();
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  findAllUsers(): Promise<User[]> {
    return this.client.user.findMany();
  }
}
