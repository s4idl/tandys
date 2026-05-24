import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EspaciosService {
  constructor(private prisma: PrismaService) { }

  // GET /api/espacios — todos los espacios con datos del mercadito y marca ocupante (para el mapa)
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
        solicitudes: {
          where: { estado: 'aceptada' },
          include: {
            marcas: true,
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

  // PUT /api/espacios/layout/:mercaditoId — admin guarda el layout completo
  async updateLayout(mercaditoId: number, espaciosDto: any[]) {
    const validDbIds: number[] = [];

    for (const sp of espaciosDto) {
      if (sp.dbId) {
        // Actualizar espacio existente
        const updated = await this.prisma.espacios.update({
          where: { id_espacio: sp.dbId },
          data: {
            coordenada_x: Math.round(sp.x),
            coordenada_y: Math.round(sp.y),
            ancho: Math.round(sp.width),
            alto: Math.round(sp.height),
            rotacion: sp.rotation,
            nombre: sp.name || sp.label || sp.id,
          },
        });
        validDbIds.push(updated.id_espacio);
      } else {
        // Crear espacio nuevo añadido manualmente
        const created = await this.prisma.espacios.create({
          data: {
            id_mercadito: mercaditoId,
            numero_espacio: sp.name || sp.label || sp.id,
            precio: sp.precio || 0,
            estado: sp.status === 'occupied' ? 'ocupado' : 'disponible',
            coordenada_x: Math.round(sp.x),
            coordenada_y: Math.round(sp.y),
            ancho: Math.round(sp.width),
            alto: Math.round(sp.height),
            rotacion: sp.rotation,
            nombre: sp.name || sp.label || sp.id,
          },
        });
        validDbIds.push(created.id_espacio);
      }
    }

    // Borrar espacios que fueron eliminados de la pantalla por el admin
    try {
      await this.prisma.espacios.deleteMany({
        where: {
          id_mercadito: mercaditoId,
          id_espacio: { notIn: validDbIds },
        },
      });
    } catch (e) {
      throw new Error(
        'No se pueden borrar algunos espacios porque ya están pagados o tienen solicitudes activas.'
      );
    }

    return { success: true };
  }
}
