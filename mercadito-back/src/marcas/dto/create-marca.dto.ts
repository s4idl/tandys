import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateMarcaDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    nombre_marca: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    logo_url?: string;

    @IsString()
    @IsOptional()
    @MaxLength(150)
    instagram?: string;

    @IsString()
    @IsOptional()
    @MaxLength(150)
    facebook?: string;

    @IsString()
    @IsOptional()
    @MaxLength(150)
    tiktok?: string;
}
