export type SpaceStatus = 'available' | 'occupied' | 'pending';

export interface Space {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    status: SpaceStatus;
    label?: string;
}
