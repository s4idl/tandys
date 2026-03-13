import { Module } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SolicitudesController],
  providers: [SolicitudesService, PrismaService],
})
export class SolicitudesModule {}
