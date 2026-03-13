import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreatePagoDto } from './dto/create-pago.dto';
import { VerificarPagoDto } from './dto/verificar-pago.dto';

@Injectable()
export class PagosService {
    private supabase: SupabaseClient;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.supabase = createClient(
            this.configService.get<string>('SUPABASE_URL')!,
            this.configService.get<string>('SUPABASE_KEY')!,
        );
    }

    // Vendedor registra un pago para su solicitud
    async create(dto: CreatePagoDto) {
        // Verificar que la solicitud existe
        const solicitud = await this.prisma.solicitudes.findUnique({
            where: { id_solicitud: dto.id_solicitud },
        });

        if (!solicitud) {
            throw new NotFoundException(
                `Solicitud con id ${dto.id_solicitud} no encontrada`,
            );
        }

        // Verificar que no exista ya un pago para esa solicitud
        const pagoExistente = await this.prisma.pagos.findUnique({
            where: { id_solicitud: dto.id_solicitud },
        });

        if (pagoExistente) {
            throw new BadRequestException(
                `Ya existe un pago registrado para la solicitud ${dto.id_solicitud}`,
            );
        }

        return this.prisma.pagos.create({
            data: {
                id_solicitud: dto.id_solicitud,
                monto: dto.monto,
                metodo_pago: dto.metodo_pago,
                referencia: dto.referencia,
                estado: 'pendiente',
            },
        });
    }

    // Admin: ver todos los pagos
    async findAll() {
        return this.prisma.pagos.findMany({
            include: {
                solicitudes: {
                    include: {
                        marcas: { select: { nombre_marca: true } },
                        espacios: { select: { numero_espacio: true } },
                    },
                },
                comprobantes: true,
            },
            orderBy: { fecha_pago: 'desc' },
        });
    }

    // Ver detalle de un pago específico
    async findOne(id: number) {
        const pago = await this.prisma.pagos.findUnique({
            where: { id_pago: id },
            include: {
                solicitudes: {
                    include: {
                        marcas: { select: { nombre_marca: true, id_usuario: true } },
                        espacios: { select: { numero_espacio: true } },
                    },
                },
                comprobantes: true,
                usuarios: { select: { id_usuario: true, nombre: true } },
            },
        });

        if (!pago) {
            throw new NotFoundException(`Pago con id ${id} no encontrado`);
        }

        return pago;
    }

    // Admin: verificar o rechazar un pago
    async verificar(id: number, idAdmin: number, dto: VerificarPagoDto) {
        const pago = await this.prisma.pagos.findUnique({
            where: { id_pago: id },
        });

        if (!pago) {
            throw new NotFoundException(`Pago con id ${id} no encontrado`);
        }

        if (pago.estado !== 'pendiente') {
            throw new BadRequestException(
                `El pago ya fue procesado con estado: ${pago.estado}`,
            );
        }

        return this.prisma.pagos.update({
            where: { id_pago: id },
            data: {
                estado: dto.estado,
                id_admin_verifico: idAdmin,
            },
        });
    }

    // Vendedor/Admin: subir comprobante a Supabase Storage
    async subirComprobante(idPago: number, file: Express.Multer.File) {
        const pago = await this.prisma.pagos.findUnique({
            where: { id_pago: idPago },
        });

        if (!pago) {
            throw new NotFoundException(`Pago con id ${idPago} no encontrado`);
        }

        // 1. Crear nombre de archivo en Supabase
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${idPago}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 2. Subir buffer
        const { error } = await this.supabase.storage
            .from('comprobants')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (error) {
            throw new BadRequestException('Error al subir comprobante: ' + error.message);
        }

        // 3. Obtener URL pública
        const { data: { publicUrl } } = this.supabase.storage
            .from('comprobants')
            .getPublicUrl(filePath);

        // Verificar que no exista ya un comprobante
        const comprobanteExistente = await this.prisma.comprobantes.findUnique({
            where: { id_pago: idPago },
        });

        if (comprobanteExistente) {
            // Si ya existe, lo actualizamos
            return this.prisma.comprobantes.update({
                where: { id_pago: idPago },
                data: { archivo_url: publicUrl },
            });
        }

        return this.prisma.comprobantes.create({
            data: {
                id_pago: idPago,
                archivo_url: publicUrl,
            },
        });
    }
}
