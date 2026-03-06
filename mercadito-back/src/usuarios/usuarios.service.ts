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
