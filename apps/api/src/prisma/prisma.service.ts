import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async connect() {
    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('MongoDB connected');
    } catch (error) {
      this.connected = false;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`MongoDB connection failed: ${msg}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('MongoDB disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }
}
