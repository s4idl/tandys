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

export interface Marca {
  id_marca: number;
  nombre_marca: string;
  descripcion: string | null;
  logo_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  fecha_creacion: string | null;
}

export interface Solicitud {
  id_solicitud: number;
  id_marca: number;
  id_espacio: number;
  estado: string; // 'pendiente' | 'aceptada' | 'rechazada'
  fecha_solicitud: string;
}

export interface Pago {
  id_pago: number;
  id_solicitud: number;
  monto: string | number;
  estado: string; // 'pendiente' | 'verificado' | 'rechazado'
  metodo_pago: string;
  fecha_pago: string;
}
