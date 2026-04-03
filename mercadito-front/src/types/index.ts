export type SpaceStatus = 'available' | 'occupied' | 'pending';

export interface Space {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    status: SpaceStatus;
    label?: string;   // short display label on the rect
    name?: string;    // longer name shown in sidebar
}
