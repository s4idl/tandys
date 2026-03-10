import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EspaciosService {
  constructor(private prisma: PrismaService) { }

  // GET /api/espacios — todos los espacios con datos del mercadito (para el mapa)
  async findAll() {
    return this.prisma.espacios.findMany({
      include: {
        mercaditos: {
          select: {
            id_mercadito: true,
            nombre: true,
            fecha: true,
            lugar: true,
            estado: true,
          },
        },
      },
      orderBy: { numero_espacio: 'asc' },
    });
  }

  // GET /api/espacios/:id — detalle de un espacio
  async findOne(id: number) {
    const espacio = await this.prisma.espacios.findUnique({
      where: { id_espacio: id },
      include: { mercaditos: true },
    });

    if (!espacio) {
      throw new NotFoundException(`Espacio con id ${id} no encontrado`);
    }

    return espacio;
  }

  // PATCH /api/espacios/:id/asignar — admin marca espacio como ocupado
  async asignar(id: number) {
    await this.findOne(id);
    return this.prisma.espacios.update({
      where: { id_espacio: id },
      data: { estado: 'ocupado' },
    });
  }

  // PATCH /api/espacios/:id/liberar — admin libera espacio (disponible)
  async liberar(id: number) {
    await this.findOne(id);
    return this.prisma.espacios.update({
      where: { id_espacio: id },
      data: { estado: 'disponible' },
    });
  }
}
