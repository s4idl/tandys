import { IsOptional, IsString } from 'class-validator';

export class ResponderSolicitudDto {
  @IsString()
  @IsOptional()
  comentario_admin?: string;
}
