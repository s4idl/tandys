import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  pregunta: string;

  @IsString()
  @IsNotEmpty()
  respuesta: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}
