import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { ResponderSolicitudDto } from './dto/responder-solicitud.dto';

@Injectable()
export class SolicitudesService {
  constructor(private prisma: PrismaService) {}

  // POST /api/solicitudes — vendedor crea solicitud de espacio
  async crear(dto: CreateSolicitudDto) {
    return this.prisma.solicitudes.create({
      data: {
        id_marca: dto.id_marca,
        id_espacio: dto.id_espacio,
        estado: 'pendiente',
      },
    });
  }

  // GET /api/solicitudes — admin ve todas las solicitudes
  async findAll() {
    return this.prisma.solicitudes.findMany({
      include: {
        marcas: { select: { id_marca: true, nombre_marca: true } },
        espacios: { select: { id_espacio: true, numero_espacio: true, precio: true } },
      },
      orderBy: { fecha_solicitud: 'desc' },
    });
  }

  // GET /api/solicitudes/mias — vendedor ve solo sus solicitudes (por id_marca de su usuario)
  async findMias(idUsuario: number) {
    return this.prisma.solicitudes.findMany({
      where: {
        marcas: { id_usuario: idUsuario },
      },
      include: {
        marcas: { select: { id_marca: true, nombre_marca: true } },
        espacios: { select: { id_espacio: true, numero_espacio: true, precio: true } },
      },
      orderBy: { fecha_solicitud: 'desc' },
    });
  }

  // GET /api/solicitudes/:id — detalle de una solicitud
  async findOne(id: number) {
    const solicitud = await this.prisma.solicitudes.findUnique({
      where: { id_solicitud: id },
      include: {
        marcas: true,
        espacios: true,
      },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    return solicitud;
  }

  // PATCH /api/solicitudes/:id/aceptar — admin acepta la solicitud
  async aceptar(id: number, idAdmin: number) {
    await this.findOne(id);
    return this.prisma.solicitudes.update({
      where: { id_solicitud: id },
      data: {
        estado: 'aceptada',
        id_admin_gestion: idAdmin,
      },
    });
  }

  // PATCH /api/solicitudes/:id/rechazar — admin rechaza la solicitud
  async rechazar(id: number, idAdmin: number, dto: ResponderSolicitudDto) {
    await this.findOne(id);
    return this.prisma.solicitudes.update({
      where: { id_solicitud: id },
      data: {
        estado: 'rechazada',
        id_admin_gestion: idAdmin,
        comentario_admin: dto.comentario_admin ?? null,
      },
    });
  }
}
