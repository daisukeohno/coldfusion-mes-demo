import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProgressController } from './progress.controller';
import { ProgressQuantityService } from './progress-quantity.service';
import { ProgressService } from './progress.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProgressController],
  providers: [ProgressService, ProgressQuantityService],
  exports: [ProgressService, ProgressQuantityService],
})
export class ProgressModule {}
