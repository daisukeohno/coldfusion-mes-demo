import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { InspectionsModule } from './inspections/inspections.module';
import { ShijiModule } from './shiji/shiji.module';

@Module({
  imports: [DbModule, InspectionsModule, ShijiModule],
})
export class AppModule {}
