import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Settings } from 'lucide-react';
import { Stage, Layer, Rect, Image as KonvaImage, Text, Group, Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import { useMapStore, STATUS_COLORS } from '../../store/mapStore';
import type { Space } from '../../types';
import svgUrl from '../../assets/mapa-maestro.svg';

// ── SVG canvas dimensions & content crop ─────────────────────────────────────
// The SVG canvas is 800×600 but actual drawing content sits within:
//   x: 2 – 591  (outer frame at x=0 & x=593 is clipped out)
//   y: 18 – 588 (outer frame at y=16 & y=590 is clipped out)
const SVG_W = 800;
const SVG_H = 600;
// Clip rect that hides the CAD border paths
const CLIP = { x: 2, y: 18, w: 589, h: 570 };

const ZOOM_STEP = 1.12;
const MIN_SCALE = 1.55;
const MAX_SCALE = 8;

interface MarketMapProps { isAdmin?: boolean; }

// ── StallNode ─────────────────────────────────────────────────────────────────
interface StallNodeProps {
  space: Space;
  isAdmin: boolean;
  isSelected: boolean;
  shapeRef: (el: Konva.Rect | null) => void;
  onSelect: (s: Space) => void;
  onGroupDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onTransformEnd: () => void;
  setCursor: (c: string) => void;
}

const StallNode: React.FC<StallNodeProps> = ({
  space, isAdmin, isSelected, shapeRef, onSelect, onGroupDragEnd, onTransformEnd, setCursor,
}) => {
  const { fill, stroke, textColor } = STATUS_COLORS[space.status];
  return (
    <Group
      x={space.x} y={space.y}
      draggable={isAdmin}
      onDragStart={() => setCursor('grabbing')}
      onDragEnd={onGroupDragEnd}
      onClick={() => onSelect(space)}
      onTap={() => onSelect(space)}
      onMouseEnter={() => setCursor(isAdmin ? 'grab' : 'pointer')}
      onMouseLeave={() => setCursor('default')}
    >
      <Rect
        ref={shapeRef}
        width={space.width} height={space.height}
        rotation={space.rotation}
        fill={fill}
        stroke={isSelected ? '#1565C0' : stroke}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={3}
        onTransformEnd={onTransformEnd}
        shadowEnabled={isSelected}
        shadowBlur={10}
        shadowColor="rgba(21,101,192,0.4)"
      />
      <Text
        text={space.label ?? space.id}
        rotation={space.rotation}
        width={space.width} height={space.height}
        align="center" verticalAlign="middle"
        fontSize={Math.max(6, Math.min(space.width, space.height) * 0.28)}
        fontStyle="bold"
        fontFamily="Inter, Arial, sans-serif"
        fill={textColor}
        listening={false}
      />
    </Group>
  );
};

// ── MarketMap ─────────────────────────────────────────────────────────────────
const MarketMap: React.FC<MarketMapProps> = ({ isAdmin = false }) => {
  const spaces = useMapStore((s) => s.spaces);
  const selectedSpace = useMapStore((s) => s.selectedSpace);
  const addSpace = useMapStore((s) => s.addSpace);
  const updateSpace = useMapStore((s) => s.updateSpace);
  const selectSpace = useMapStore((s) => s.selectSpace);
  const generateLayout = useMapStore((s) => s.generateLayout);
  const saveLayout = useMapStore((s) => s.saveLayout);

  const [stallCount, setStallCount] = useState(27);

  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shapeRefs = useRef<Map<string, Konva.Rect>>(new Map());
  const initialized = useRef(false);
  const isPanning = useRef(false);
  const panLast = useRef({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [zoomVisible, setZoomVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showZoom = () => {
    setZoomVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setZoomVisible(false), 2500);
  };

  // ── Container size ──────────────────────────────────────────────────────────
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const measure = () => {
      if (containerRef.current)
        setSize({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Prevent native scroll on wheel over the map
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const noop = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', noop, { passive: false });
    return () => el.removeEventListener('wheel', noop);
  }, []);

  // ── SVG background ─────────────────────────────────────────────────────────
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.src = svgUrl;
    img.onload = () => setBgImage(img);
  }, []);

  // ── Initial stage transform: fit + centre SVG (runs once after size known) ──
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || initialized.current || size.w === 0) return;
    initialized.current = true;
    const s = Math.min(size.w / SVG_W, size.h / SVG_H) * 0.95; // slight padding
    stage.scale({ x: s, y: s });
    stage.position({
      x: (size.w - SVG_W * s) / 2,
      y: (size.h - SVG_H * s) / 2,
    });
    stage.batchDraw();
  }, [size]);



  // ── Transformer wiring ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!trRef.current) return;
    if (!isAdmin || !selectedSpace) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
      return;
    }
    const node = shapeRefs.current.get(selectedSpace.id);
    if (node) {
      trRef.current.nodes([node]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedSpace, isAdmin]);

  const setCursor = useCallback((c: string) => {
    const el = stageRef.current?.container();
    if (el) el.style.cursor = c;
  }, []);

  // ── Wheel zoom (zoom towards cursor) ────────────────────────────────────────
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current!;
    const old = stage.scaleX();
    const ptr = stage.getPointerPosition()!;
    const origin = { x: (ptr.x - stage.x()) / old, y: (ptr.y - stage.y()) / old };
    const dir = e.evt.deltaY > 0 ? -1 : 1;
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, old * Math.pow(ZOOM_STEP, dir)));
    stage.scale({ x: next, y: next });
    stage.position({ x: ptr.x - origin.x * next, y: ptr.y - origin.y * next });
    setZoomLevel(Math.round(next * 100));
    showZoom();
  };

  // ── Pan (drag on empty stage) ───────────────────────────────────────────────
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (e.target !== e.target.getStage()) return;
    isPanning.current = true;
    panLast.current = stageRef.current!.getPointerPosition()!;
    setCursor('grabbing');
  };

  const handleMouseMove = () => {
    if (!isPanning.current) return;
    const stage = stageRef.current!;
    const p = stage.getPointerPosition()!;
    stage.position({
      x: stage.x() + (p.x - panLast.current.x),
      y: stage.y() + (p.y - panLast.current.y),
    });
    panLast.current = p;
  };

  const stopPan = () => { isPanning.current = false; setCursor('default'); };

  // ── Click on empty stage: deselect ─────────────────────────────────────────
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) selectSpace(null);
  };

  // ── Double-click: create stall (admin only) ─────────────────────────────────
  const handleDblClick = (e: KonvaEventObject<MouseEvent>) => {
    if (!isAdmin || e.target !== e.target.getStage()) return;
    const stage = stageRef.current!;
    const p = stage.getPointerPosition()!;
    // Convert DOM → SVG coordinate space
    const svgX = (p.x - stage.x()) / stage.scaleX();
    const svgY = (p.y - stage.y()) / stage.scaleY();
    addSpace(svgX, svgY);
  };

  // ── Drag end on group: position is already in SVG space ────────────────────
  const handleDragEnd = (e: KonvaEventObject<DragEvent>, space: Space) => {
    updateSpace(space.id, { x: e.target.x(), y: e.target.y() });
    setCursor('grab');
  };

  // ── Transform end: normalise rect scale → store width/height ───────────────
  const handleTransformEnd = (space: Space) => {
    const rect = shapeRefs.current.get(space.id);
    if (!rect) return;
    const grp = rect.getParent() as Konva.Group;
    const newX = grp.x() + rect.x();
    const newY = grp.y() + rect.y();
    const newW = Math.max(20, rect.width() * Math.abs(rect.scaleX()));
    const newH = Math.max(12, rect.height() * Math.abs(rect.scaleY()));
    const newR = rect.rotation() + grp.rotation();
    rect.setAttrs({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
    grp.setAttrs({ x: newX, y: newY, rotation: 0 });
    updateSpace(space.id, { x: newX, y: newY, width: newW, height: newH, rotation: newR });
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        onClick={handleClick}
        onDblClick={handleDblClick}
      >
        {/* ── Layer 1: static background ── */}
        <Layer listening={false}>
          {/* Cream fill covers the whole stage DOM canvas */}
          <Rect x={-5000} y={-5000} width={10000} height={10000} fill="#f5f1ea" />

          {/* SVG floor plan, clipped to hide the outer CAD border paths */}
          {bgImage && (
            <Group clipX={CLIP.x} clipY={CLIP.y} clipWidth={CLIP.w} clipHeight={CLIP.h}>
              <KonvaImage
                image={bgImage}
                x={0} y={0}
                width={SVG_W} height={SVG_H}
                opacity={0.92}
              />
            </Group>
          )}
        </Layer>

        {/* ── Layer 2: stalls + transformer (all in SVG coordinate space) ── */}
        <Layer>
          {spaces.map((space) => (
            <StallNode
              key={space.id}
              space={space}
              isAdmin={isAdmin}
              isSelected={selectedSpace?.id === space.id}
              shapeRef={(el) => {
                if (el) shapeRefs.current.set(space.id, el);
                else shapeRefs.current.delete(space.id);
              }}
              onSelect={selectSpace}
              onGroupDragEnd={(e) => handleDragEnd(e, space)}
              onTransformEnd={() => handleTransformEnd(space)}
              setCursor={setCursor}
            />
          ))}

          {isAdmin && (
            <Transformer
              ref={trRef}
              rotateEnabled={true}
              enabledAnchors={[
                'top-left', 'top-right', 'bottom-left', 'bottom-right',
                'middle-left', 'middle-right', 'top-center', 'bottom-center',
              ]}
              boundBoxFunc={(old, n) => (n.width < 20 || n.height < 12 ? old : n)}
            />
          )}
        </Layer>
      </Stage>

      {/* ── Zoom toolbar ── */}
      {(() => {
        const pct = Math.round(
          ((zoomLevel / 100 - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100,
        );
        const clamp = (v: number) => Math.max(0, Math.min(100, v));

        const zoomBy = (dir: 1 | -1) => {
          const stage = stageRef.current;
          if (!stage) return;
          const old = stage.scaleX();
          const cx = size.w / 2;
          const cy = size.h / 2;
          const origin = { x: (cx - stage.x()) / old, y: (cy - stage.y()) / old };
          const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, old * Math.pow(ZOOM_STEP, dir)));
          stage.scale({ x: next, y: next });
          stage.position({ x: cx - origin.x * next, y: cy - origin.y * next });
          setZoomLevel(Math.round(next * 100));
          showZoom();
        };

        const resetZoom = () => {
          const stage = stageRef.current;
          if (!stage) return;
          const s = Math.min(size.w / SVG_W, size.h / SVG_H) * 0.95;
          stage.scale({ x: s, y: s });
          stage.position({ x: (size.w - SVG_W * s) / 2, y: (size.h - SVG_H * s) / 2 });
          stage.batchDraw();
          setZoomLevel(Math.round(s * 100));
          showZoom();
        };

        const btnStyle: React.CSSProperties = {
          background: 'none',
          border: 'none',
          color: '#374151',
          fontSize: 18,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '0 8px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 8,
          transition: 'background 0.15s',
        };

        return (
          <div style={{
            position: 'absolute', bottom: 130, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            padding: '6px 12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            zIndex: 15,
            userSelect: 'none',
            fontFamily: 'Inter, Arial, sans-serif',
            opacity: zoomVisible ? 1 : 0,
            pointerEvents: zoomVisible ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
          }}>
            {/* Zoom out */}
            <button style={btnStyle} title="Alejar" onClick={() => zoomBy(-1)}>−</button>

            {/* Divider */}
            <div style={{ width: 1, height: 16, background: '#e5e7eb', margin: '0 2px' }} />

            {/* Progress bar + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
              <div style={{
                width: 80, height: 3, borderRadius: 999,
                background: '#e5e7eb', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${clamp(pct)}%`, height: '100%',
                  background: 'linear-gradient(90deg, #7b1430, #c8748a)',
                  borderRadius: 999,
                  transition: 'width 0.15s',
                }} />
              </div>
              <span style={{ color: '#374151', fontSize: 11, fontWeight: 700, minWidth: 30, textAlign: 'right' }}>
                {clamp(pct)}%
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 16, background: '#e5e7eb', margin: '0 2px' }} />

            {/* Zoom in */}
            <button style={btnStyle} title="Acercar" onClick={() => zoomBy(1)}>+</button>

            {/* Divider */}
            <div style={{ width: 1, height: 16, background: '#e5e7eb', margin: '0 2px' }} />

            {/* Reset */}
            <button
              style={{ ...btnStyle, color: '#6b7280', padding: '0 6px' }}
              title="Restablecer vista"
              onClick={resetZoom}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        );
      })()}

      {/* ── Admin Layout Panel (bottom-right, admin only) ── */}
      {isAdmin && (
        <div style={{
          position: 'absolute', bottom: 20, right: 20,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 20,
          padding: '16px 18px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', gap: 14,
          zIndex: 10, minWidth: 210,
          fontFamily: 'Inter, Arial, sans-serif',
          color: '#111827',
        }}>
          {/* Header */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: '#9ca3af',
            borderBottom: '1px solid #f3f4f6',
            paddingBottom: 10,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Settings size={12} color="#9ca3af" />
            Auto Layout
          </div>

          {/* Count selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Locales</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setStallCount((c) => Math.max(10, c - 1))}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb', color: '#374151', fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f9fafb')}
              >−</button>
              <span style={{ fontSize: 20, fontWeight: 700, minWidth: 28, textAlign: 'center', color: '#111827' }}>
                {stallCount}
              </span>
              <button
                onClick={() => setStallCount((c) => Math.min(27, c + 1))}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb', color: '#374151', fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f9fafb')}
              >+</button>
            </div>
          </div>

          {/* Range bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>10</span>
            <div style={{ flex: 1, height: 3, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
              <div style={{
                width: `${((stallCount - 10) / 17) * 100}%`, height: '100%',
                background: 'linear-gradient(90deg, #7b1430, #c8748a)',
                borderRadius: 999, transition: 'width 0.15s',
              }} />
            </div>
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>27</span>
          </div>

          {/* Generar Layout button */}
          <button
            onClick={() => generateLayout(stallCount)}
            style={{
              padding: '10px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #7b1430, #c8748a)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.02em', transition: 'opacity 0.15s',
              boxShadow: '0 2px 10px rgba(123,20,48,0.25)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Generar Layout
          </button>

          {/* Guardar Layout button */}
          <button
            onClick={() => { saveLayout(); alert('Layout guardado ✓ (ver consola)'); }}
            style={{
              padding: '9px 0', borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#f9fafb', color: '#374151', fontSize: 12,
              fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f9fafb')}
          >
            💾 &nbsp;Guardar Layout
          </button>

          <p style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
            Arrastra los locales para ajustar
          </p>
        </div>
      )}

    </div>
  );
};

export default MarketMap;
