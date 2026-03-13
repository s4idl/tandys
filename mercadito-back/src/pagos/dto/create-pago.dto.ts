import {
    IsInt,
    IsPositive,
    IsNotEmpty,
    IsEnum,
    IsString,
    IsOptional,
    IsNumber,
} from 'class-validator';

export enum MetodoPago {
    TRANSFERENCIA = 'transferencia',
    DEPOSITO = 'deposito',
}

export class CreatePagoDto {
    @IsInt()
    @IsPositive()
    @IsNotEmpty()
    id_solicitud: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @IsNotEmpty()
    monto: number;

    @IsEnum(MetodoPago)
    @IsNotEmpty()
    metodo_pago: MetodoPago;

    @IsString()
    @IsOptional()
    referencia?: string;
}
