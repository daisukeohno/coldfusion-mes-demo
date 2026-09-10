import { Module } from '@nestjs/common';
import { ShijiController } from './shiji.controller';

@Module({ controllers: [ShijiController] })
export class ShijiModule {}
