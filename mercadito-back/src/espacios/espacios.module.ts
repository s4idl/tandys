import { Module } from '@nestjs/common';
import { EspaciosController } from './espacios.controller';
import { EspaciosService } from './espacios.service';

@Module({
  controllers: [EspaciosController],
  providers: [EspaciosService]
})
export class EspaciosModule {}
