import { IsEnum, IsNotEmpty } from 'class-validator';

export enum EstadoPago {
    VERIFICADO = 'verificado',
    RECHAZADO = 'rechazado',
}

export class VerificarPagoDto {
    @IsEnum(EstadoPago)
    @IsNotEmpty()
    estado: EstadoPago;
}
