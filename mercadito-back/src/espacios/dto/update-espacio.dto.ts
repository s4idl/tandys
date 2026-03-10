import { IsString, IsOptional, IsNumber, IsEnum, MaxLength, IsPositive } from 'class-validator';
import { estado_espacio } from '@prisma/client';

export class UpdateEspacioDto {
    @IsString()
    @IsOptional()
    @MaxLength(10)
    numero_espacio?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    precio?: number;

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
