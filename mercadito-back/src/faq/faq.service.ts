import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFaqDto) {
    return this.prisma.preguntas_frecuentes.create({
      data: {
        pregunta: dto.pregunta,
        respuesta: dto.respuesta,
        activa: dto.activa ?? true,
      },
    });
  }

  async findAllActive() {
    return this.prisma.preguntas_frecuentes.findMany({
      where: { activa: true },
      orderBy: { id_pregunta: 'asc' },
    });
  }

  async update(id: number, dto: UpdateFaqDto) {
    const faq = await this.prisma.preguntas_frecuentes.findUnique({ where: { id_pregunta: id } });
    if (!faq) {
      throw new NotFoundException(`FAQ con id ${id} no encontrada`);
    }

    return this.prisma.preguntas_frecuentes.update({
      where: { id_pregunta: id },
      data: dto as any, // TypeScript Prisma workaround for optional fields
    });
  }

  async remove(id: number) {
    const faq = await this.prisma.preguntas_frecuentes.findUnique({ where: { id_pregunta: id } });
    if (!faq) {
      throw new NotFoundException(`FAQ con id ${id} no encontrada`);
    }

    // Soft delete (desactivar) en lugar de borrar físicamente
    return this.prisma.preguntas_frecuentes.update({
      where: { id_pregunta: id },
      data: { activa: false },
    });
  }
}
