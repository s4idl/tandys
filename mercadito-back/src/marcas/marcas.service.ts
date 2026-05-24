import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';

@Injectable()
export class MarcasService {
    constructor(private prisma: PrismaService) { }

    // Vendedor o admin crean una marca
    async create(idUsuario: number, dto: CreateMarcaDto) {
        return this.prisma.marcas.create({
            data: {
                ...dto,
                id_usuario: idUsuario,
            },
        });
    }

    // Admin: ver todas las marcas (incluye solicitudes, espacios y mercaditos para vista detallada)
    async findAll() {
        return this.prisma.marcas.findMany({
            include: {
                usuarios: {
                    select: { id_usuario: true, nombre: true, correo: true },
                },
                solicitudes: {
                    include: {
                        espacios: {
                            include: {
                                mercaditos: true,
                            },
                        },
                    },
                },
            },
            orderBy: { fecha_creacion: 'desc' },
        });
    }

    // Vendedor: ver solo sus propias marcas
    async findMias(idUsuario: number) {
        return this.prisma.marcas.findMany({
            where: { id_usuario: idUsuario },
            orderBy: { fecha_creacion: 'desc' },
        });
    }

    // Editar marca — solo el dueño o un admin
    async update(
        idMarca: number,
        idUsuario: number,
        rol: string,
        dto: UpdateMarcaDto,
    ) {
        const marca = await this.prisma.marcas.findUnique({
            where: { id_marca: idMarca },
        });

        if (!marca) {
            throw new NotFoundException(`Marca con id ${idMarca} no encontrada`);
        }

        if (rol !== 'admin' && marca.id_usuario !== idUsuario) {
            throw new ForbiddenException('No tienes permiso para editar esta marca');
        }

        return this.prisma.marcas.update({
            where: { id_marca: idMarca },
            data: dto,
        });
    }

    // Eliminar marca — solo el dueño o un admin
    async remove(idMarca: number, idUsuario: number, rol: string) {
        const marca = await this.prisma.marcas.findUnique({
            where: { id_marca: idMarca },
        });

        if (!marca) {
            throw new NotFoundException(`Marca con id ${idMarca} no encontrada`);
        }

        if (rol !== 'admin' && marca.id_usuario !== idUsuario) {
            throw new ForbiddenException(
                'No tienes permiso para eliminar esta marca',
            );
        }

        await this.prisma.marcas.delete({ where: { id_marca: idMarca } });

        return { message: 'Marca eliminada correctamente' };
    }
}
