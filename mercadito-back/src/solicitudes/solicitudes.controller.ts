import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { ResponderSolicitudDto } from './dto/responder-solicitud.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  // POST /api/solicitudes — vendedor crea solicitud de espacio
  @UseGuards(RolesGuard)
  @Roles(Role.VENDEDOR)
  @Post()
  crear(@Body() dto: CreateSolicitudDto) {
    return this.solicitudesService.crear(dto);
  }

  // GET /api/solicitudes — admin ve todas las solicitudes
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.solicitudesService.findAll();
  }

  // GET /api/solicitudes/mias — vendedor ve solo sus propias solicitudes
  @UseGuards(RolesGuard)
  @Roles(Role.VENDEDOR)
  @Get('mias')
  findMias(@Req() req) {
    return this.solicitudesService.findMias(req.user.id);
  }

  // GET /api/solicitudes/:id — detalle de una solicitud
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.solicitudesService.findOne(id);
  }

  // PATCH /api/solicitudes/:id/aceptar — admin acepta solicitud
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/aceptar')
  aceptar(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.solicitudesService.aceptar(id, req.user.id);
  }

  // PATCH /api/solicitudes/:id/rechazar — admin rechaza solicitud
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/rechazar')
  rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body() dto: ResponderSolicitudDto,
  ) {
    return this.solicitudesService.rechazar(id, req.user.id, dto);
  }
}
