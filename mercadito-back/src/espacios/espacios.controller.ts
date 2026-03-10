import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { EspaciosService } from './espacios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('espacios')
export class EspaciosController {
  constructor(private readonly espaciosService: EspaciosService) { }

  // GET /api/espacios — todos los espacios (para el mapa del frontend)
  @Get()
  findAll() {
    return this.espaciosService.findAll();
  }

  // GET /api/espacios/:id — detalle de un espacio
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.espaciosService.findOne(id);
  }

  // PATCH /api/espacios/:id/asignar — admin marca espacio como ocupado
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/asignar')
  asignar(@Param('id', ParseIntPipe) id: number) {
    return this.espaciosService.asignar(id);
  }

  // PATCH /api/espacios/:id/liberar — admin libera espacio (disponible)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/liberar')
  liberar(@Param('id', ParseIntPipe) id: number) {
    return this.espaciosService.liberar(id);
  }
}