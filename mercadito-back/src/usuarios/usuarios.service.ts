import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  private selectSafeFields = {
    id_usuario: true,
    nombre: true,
    correo: true,
    telefono: true,
    rol: true,
    activo: true,
    fecha_registro: true,
  };

  async findAll() {
    return this.prisma.usuarios.findMany({
      select: this.selectSafeFields,
      orderBy: { fecha_registro: 'desc' },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: id },
      select: this.selectSafeFields,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return usuario;
  }

  // Perfil propio — sin restricción de admin
  async findMe(id: number) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: id },
      select: {
        ...this.selectSafeFields,
        marcas: {
          orderBy: { fecha_creacion: 'desc' },
          select: {
            id_marca: true,
            nombre_marca: true,
            descripcion: true,
            logo_url: true,
            instagram: true,
            facebook: true,
            tiktok: true,
            fecha_creacion: true,
            solicitudes: {
              orderBy: { fecha_solicitud: 'desc' },
              select: {
                id_solicitud: true,
                estado: true,
                fecha_solicitud: true,
                comentario_admin: true,
                espacios: {
                  select: {
                    id_espacio: true,
                    numero_espacio: true,
                    precio: true,
                    estado: true,
                    mercaditos: {
                      select: {
                        id_mercadito: true,
                        nombre: true,
                        fecha: true,
                        lugar: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario no encontrado`);
    }

    return usuario;
  }

  async desactivar(id: number) {
    await this.findOne(id); // valida existencia
    return this.prisma.usuarios.update({
      where: { id_usuario: id },
      data: { activo: false },
      select: this.selectSafeFields,
    });
  }

  async activar(id: number) {
    await this.findOne(id); // valida existencia
    return this.prisma.usuarios.update({
      where: { id_usuario: id },
      data: { activo: true },
      select: this.selectSafeFields,
    });
  }
}
