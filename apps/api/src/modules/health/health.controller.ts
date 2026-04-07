import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { DatabaseService } from '../../database/database.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check — use to wake up the server and verify status' })
  @ApiResponse({ status: 200, description: 'Server is healthy' })
  @ApiResponse({ status: 503, description: 'Server is unhealthy' })
  async check() {
    const uptime = process.uptime();
    let database = false;

    try {
      database = await this.db.ping();
    } catch {
      database = false;
    }

    return {
      data: {
        status: database ? 'healthy' : 'degraded',
        version: '0.1.0',
        uptime: Math.floor(uptime),
        database: database ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
