import { IsNumber, IsPositive } from 'class-validator';

export class CreateSolicitudDto {
  @IsNumber()
  @IsPositive()
  id_marca: number;

  @IsNumber()
  @IsPositive()
  id_espacio: number;
}
