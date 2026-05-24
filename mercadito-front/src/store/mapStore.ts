import { create } from 'zustand';
import type { Space, SpaceStatus, SpaceTipo } from '../types';
import { PRECIO_POR_TIPO } from '../types';
import api from '../services/axios';

// 30% of spaces are premium — determined by index so it's consistent
const tipoFromIndex = (i: number): SpaceTipo => (i % 3 === 0 ? 'premium' : 'estandar');

let _id = 1;
const uid = () => `local-${_id++}`;

// ── Helper: place a stall centred at (cx,cy) with correct rotation offset ────
// Because Konva rotates Rect around its own top-left, we must adjust x/y.
type P = Omit<Space, 'id' | 'label' | 'name' | 'status' | 'tipo' | 'precio'>;
function at(cx: number, cy: number, sw: number, sh: number, rotDeg: number): P {
  const θ = (rotDeg * Math.PI) / 180;
  return {
    x: cx - (sw / 2) * Math.cos(θ) + (sh / 2) * Math.sin(θ),
    y: cy - (sw / 2) * Math.sin(θ) - (sh / 2) * Math.cos(θ),
    width: sw, height: sh, rotation: rotDeg,
  };
}

// ── Corridor slot pools (all centres in SVG 800×600 space) ──────────────────
// Centre circle ≈ (307,285) r≈70.  Six radial corridors:
//   E=right  NE=upper-right  N=upper  NW=upper-left  W=left  SE=lower-right

// E corridor  y≈285  x: 330→440    row above y=270, row below y=300
const E: P[] = [
  at(347,270,22,11,0), at(369,270,22,11,0), at(391,270,22,11,0), at(413,270,22,11,0), at(435,270,22,11,0),
  at(347,300,22,11,0), at(369,300,22,11,0), at(391,300,22,11,0), at(413,300,22,11,0), at(435,300,22,11,0),
];
// W corridor  y≈285  x: 192→280
const W: P[] = [
  at(205,271,22,11,0), at(223,271,22,11,0), at(241,271,22,11,0), at(259,271,22,11,0),
  at(205,299,22,11,0), at(223,299,22,11,0), at(241,299,22,11,0), at(259,299,22,11,0),
];
// NE corridor  dir=(0.756,-0.652)  perp=(0.652,0.756)  offset=14
// slots at d=18,36,54,72,90 from start (358,239)
const NE: P[] = (() => {
  const [sx,sy,dx,dy,px,py,rot] = [358,239, 0.756,-0.652, 0.652,0.756, -41];
  return [18,36,54,72,90].flatMap(d => [
    at(sx+dx*d-px*14, sy+dy*d-py*14, 22,11,rot),
    at(sx+dx*d+px*14, sy+dy*d+py*14, 22,11,rot),
  ]);
})();
// NW corridor  dir=(-0.745,-0.666)  perp=(0.666,-0.745)  offset=14
// start (254,239), d=18,36,54
const NW: P[] = (() => {
  const [sx,sy,dx,dy,px,py,rot] = [254,239, -0.745,-0.666, 0.666,-0.745, 42];
  return [18,36,54].flatMap(d => [
    at(sx+dx*d-px*14, sy+dy*d-py*14, 22,11,rot),
    at(sx+dx*d+px*14, sy+dy*d+py*14, 22,11,rot),
  ]);
})();
// N corridor  dir=(-0.073,-0.997)  perp=(0.997,-0.073)  offset=16
// start (302,215), d=16,36
const N: P[] = (() => {
  const [sx,sy,dx,dy,px,py] = [302,215, -0.073,-0.997, 0.997,-0.073];
  return [16,36].flatMap(d => [
    at(sx+dx*d-px*16, sy+dy*d-py*16, 22,11,0),
    at(sx+dx*d+px*16, sy+dy*d+py*16, 22,11,0),
  ]);
})();
// SE corridor  dir=(0.729,0.685)  perp=(-0.685,0.729)  offset=14
// start (358,333), d=18,36,54
const SE: P[] = (() => {
  const [sx,sy,dx,dy,px,py,rot] = [358,333, 0.729,0.685, -0.685,0.729, 43];
  return [18,36,54].flatMap(d => [
    at(sx+dx*d-px*14, sy+dy*d-py*14, 22,11,rot),
    at(sx+dx*d+px*14, sy+dy*d+py*14, 22,11,rot),
  ]);
})();

// ── 4 variant pools: different corridor priority order ───────────────────────
const POOLS: P[][] = [
  [...E, ...NE, ...W, ...NW, ...N, ...SE],           // V0 balanced
  [...NE, ...SE, ...E, ...N,  ...W, ...NW],           // V1 NE/SE focus
  [...W,  ...NW, ...N, ...SE, ...E, ...NE],           // V2 W/NW/N focus
  [...N,  ...NW, ...NE,...SE, ...W, ...E ],            // V3 top/diagonal focus
];

// Build initial layout: all 27 presets from V0
function buildLayout(): Space[] {
  return POOLS[0].slice(0, 27).map((p, i) => {
    const tipo = tipoFromIndex(i);
    return {
      ...p,
      id: `L${i + 1}`, label: `L${i + 1}`, name: `Local ${i + 1}`,
      tipo,
      precio: PRECIO_POR_TIPO[tipo],
      status: (['available','available','available','occupied','pending'] as SpaceStatus[])[i % 5],
    };
  });
}

// ── Store ────────────────────────────────────────────────────────────────────
interface MapStore {
  spaces:        Space[];
  selectedSpace: Space | null;
  popoverPos:    { x: number, y: number } | null;
  lastVariant:   number;

  addSpace:            (x: number, y: number) => void;
  updateSpace:         (id: string, patch: Partial<Space>) => void;
  deleteSpace:         (id: string) => void;
  updateSpacePosition: (id: string, x: number, y: number) => void;
  selectSpace:         (space: Space | null, pos?: { x: number, y: number }) => void;
  generateLayout:      (count: number) => void;
  saveLayout:          () => void;
  setSpaces:           (spaces: Space[]) => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
  spaces:      buildLayout(),
  selectedSpace: null,
  popoverPos:    null,
  lastVariant:   0,

  addSpace: (x, y) => {
    const sp: Space = {
      id: uid(), label: `N${_id-1}`, name: `Nuevo ${_id-1}`,
      x: x-30, y: y-20, width: 60, height: 40, rotation: 0, status: 'available',
      tipo: 'estandar', precio: 350,
    };
    set((s) => ({ spaces: [...s.spaces, sp], selectedSpace: sp }));
  },

  updateSpace: (id, patch) =>
    set((s) => ({
      spaces: s.spaces.map((sp) => sp.id === id ? { ...sp, ...patch } : sp),
      selectedSpace: s.selectedSpace?.id === id ? { ...s.selectedSpace, ...patch } : s.selectedSpace,
    })),

  deleteSpace: (id) =>
    set((s) => ({
      spaces: s.spaces.filter((sp) => sp.id !== id),
      selectedSpace: s.selectedSpace?.id === id ? null : s.selectedSpace,
    })),

  updateSpacePosition: (id, x, y) => get().updateSpace(id, { x, y }),
  selectSpace: (space, pos) => set({ selectedSpace: space, popoverPos: pos || null }),

  generateLayout: (count) => {
    const n = Math.max(10, Math.min(27, count));
    const last = get().lastVariant;
    const options = [0,1,2,3].filter(v => v !== last);
    const variant = options[Math.floor(Math.random() * options.length)];
    const pool = [...POOLS[variant]];
    for (let i = 0; i < pool.length - 1; i += 2) {
      if (Math.random() > 0.5) [pool[i], pool[i+1]] = [pool[i+1], pool[i]];
    }
    const spaces: Space[] = pool.slice(0, n).map((p, i) => {
      const tipo = tipoFromIndex(i);
      return {
        ...p, id: `G${i+1}`, label: `G${i+1}`, name: `Local ${i+1}`,
        tipo, precio: PRECIO_POR_TIPO[tipo],
        status: 'available' as SpaceStatus,
      };
    });
    set({ spaces, selectedSpace: null, lastVariant: variant });
  },

  saveLayout: async () => {
    try {
      await api.put('/espacios/layout/1', get().spaces);
      console.log('Layout guardado exitosamente en DB');
    } catch (e) {
      console.error('Error al guardar layout', e);
      alert('Error al guardar el layout. Es posible que intentaras borrar un espacio que ya tiene solicitudes o pagos.');
    }
  },

  setSpaces: (spaces) => set({ spaces }),
}));

export const STATUS_COLORS: Record<SpaceStatus, { fill: string; stroke: string; textColor: string }> = {
  available: { fill: '#4CAF50', stroke: '#2E7D32', textColor: '#fff' },
  occupied:  { fill: '#F44336', stroke: '#B71C1C', textColor: '#fff' },
  pending:   { fill: '#FFEB3B', stroke: '#F57F17', textColor: '#333' },
};

// Keep LAYOUT_PRESETS export so nothing else breaks
export const LAYOUT_PRESETS = POOLS[0];
