import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsEnum,
    MaxLength,
    IsPositive,
} from 'class-validator';
import { estado_espacio } from '@prisma/client';

export class CreateEspacioDto {
    @IsNumber()
    @IsPositive()
    id_mercadito: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    numero_espacio: string;

    @IsNumber()
    @IsPositive()
    precio: number;

    @IsEnum(estado_espacio)
    @IsOptional()
    estado?: estado_espacio;

    @IsNumber()
    @IsOptional()
    coordenada_x?: number;

    @IsNumber()
    @IsOptional()
    coordenada_y?: number;
}
