import { create } from 'zustand';
import type { Space } from '../types';

// ─── Layout generator ─────────────────────────────────────────────────────────
// Generates a mall layout: two rows of stalls flanking a central corridor.
// Called once at init; positions are relative to the canvas size at runtime.
function buildMallLayout(): Space[] {
    const stalls: Space[] = [];
    const cols = 6;
    const stallW = 110;
    const stallH = 80;
    const gap = 14;
    const corridorH = 80;
    const topRowY = 60;
    const bottomRowY = topRowY + stallH + corridorH + gap;
    const startX = 40;

    const topStatuses: Space['status'][] = ['available', 'occupied', 'available', 'pending', 'occupied', 'available'];
    const bottomStatuses: Space['status'][] = ['pending', 'available', 'occupied', 'available', 'available', 'pending'];

    for (let i = 0; i < cols; i++) {
        const x = startX + i * (stallW + gap);

        stalls.push({
            id: `T${i + 1}`,
            label: `T${i + 1}`,
            x,
            y: topRowY,
            width: stallW,
            height: stallH,
            status: topStatuses[i],
        });

        stalls.push({
            id: `B${i + 1}`,
            label: `B${i + 1}`,
            x,
            y: bottomRowY,
            width: stallW,
            height: stallH,
            status: bottomStatuses[i],
        });
    }

    return stalls;
}

// ─── Store interface ──────────────────────────────────────────────────────────
interface MapStore {
    spaces: Space[];
    selectedSpace: Space | null;

    updateSpacePosition: (id: string, x: number, y: number) => void;
    selectSpace: (space: Space | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
    spaces: buildMallLayout(),
    selectedSpace: null,

    updateSpacePosition: (id, x, y) =>
        set((state) => ({
            spaces: state.spaces.map((s) => (s.id === id ? { ...s, x, y } : s)),
        })),

    selectSpace: (space) => set({ selectedSpace: space }),
}));
