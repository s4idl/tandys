import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { ResponderSolicitudDto } from './dto/responder-solicitud.dto';

@Injectable()
export class SolicitudesService {
  constructor(private prisma: PrismaService) {}

  // POST /api/solicitudes — vendedor crea solicitud de espacio
  async crear(dto: CreateSolicitudDto) {
    return this.prisma.$transaction(async (tx) => {

      // 1. Verificar que el espacio exista y esté disponible
      const espacio = await tx.espacios.findUnique({
        where: { id_espacio: dto.id_espacio },
      });

      if (!espacio) {
        throw new NotFoundException(
          `Espacio con id ${dto.id_espacio} no encontrado`,
        );
      }

      if (espacio.estado !== 'disponible') {
        throw new BadRequestException(
          `El espacio ${espacio.numero_espacio} ya no está disponible (estado: ${espacio.estado})`,
        );
      }

      // 2. Verificar que la misma marca no tenga ya una solicitud activa para este espacio
      const solicitudExistente = await tx.solicitudes.findFirst({
        where: {
          id_marca:   dto.id_marca,
          id_espacio: dto.id_espacio,
          estado:     { in: ['pendiente', 'aceptada'] },
        },
      });

      if (solicitudExistente) {
        throw new ConflictException(
          `Ya existe una solicitud activa de esta marca para el espacio ${espacio.numero_espacio}`,
        );
      }

      // 3. Crear la solicitud y marcar el espacio como solicitado (atómicamente)
      const [solicitud] = await Promise.all([
        tx.solicitudes.create({
          data: {
            id_marca:   dto.id_marca,
            id_espacio: dto.id_espacio,
            estado:     'pendiente',
          },
        }),
        tx.espacios.update({
          where: { id_espacio: dto.id_espacio },
          data:  { estado: 'solicitado' },
        }),
      ]);

      return solicitud;
    });
  }

  // GET /api/solicitudes — admin ve todas las solicitudes
  async findAll() {
    return this.prisma.solicitudes.findMany({
      include: {
        marcas: true, // Se trae todos los campos (descripcion, redes, etc) para el modal
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
        marcas: true,
        espacios: { select: { id_espacio: true, numero_espacio: true, precio: true } },
        pagos: {
          select: {
            id_pago: true,
            estado: true,
            comprobantes: { select: { id_comprobante: true } }
          }
        }
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
    const solicitud = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const [updated] = await Promise.all([
        tx.solicitudes.update({
          where: { id_solicitud: id },
          data: {
            estado:           'rechazada',
            id_admin_gestion: idAdmin,
            comentario_admin: dto.comentario_admin ?? null,
          },
        }),
        // Liberar el espacio para que pueda volver a solicitarse
        tx.espacios.update({
          where: { id_espacio: solicitud.id_espacio },
          data:  { estado: 'disponible' },
        }),
      ]);
      return updated;
    });
  }
}
