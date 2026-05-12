export type SpaceStatus = 'available' | 'occupied' | 'pending';
export type SpaceTipo = 'estandar' | 'premium';

export const PRECIO_POR_TIPO: Record<SpaceTipo, number> = {
  estandar: 350,
  premium:  600,
};

export interface Space {
    id: string;
    dbId?: number;       // real id_espacio from the backend DB
    tipo: SpaceTipo;     // estandar | premium
    precio: number;      // derived from tipo
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    status: SpaceStatus;
    label?: string;      // short display label on the rect
    name?: string;       // longer name shown in sidebar
}
