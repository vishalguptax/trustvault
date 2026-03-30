import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { BitstringStatusListService } from './bitstring-status-list.service';

@Module({
  providers: [StatusService, BitstringStatusListService],
  controllers: [StatusController],
  exports: [StatusService, BitstringStatusListService],
})
export class StatusModule {}
