import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.warn('Database connection failed — API will start but DB operations will fail.');
      console.warn('Set DATABASE_URL in .env to connect to MongoDB Atlas.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
