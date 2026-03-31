import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load .env from multiple locations before PrismaClient reads DATABASE_URL
config({ path: resolve(__dirname, '../../prisma/.env') });
config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.logger.error('DATABASE_URL is not set. Check apps/api/.env or apps/api/prisma/.env');
      return;
    }

    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('MongoDB connected successfully');
    } catch (error) {
      this.connected = false;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`MongoDB connection failed: ${message}`);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from MongoDB...');
    await this.$disconnect();
    this.logger.log('MongoDB disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }
}
