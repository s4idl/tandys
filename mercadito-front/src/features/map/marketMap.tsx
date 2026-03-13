import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import { useMapStore } from '../../store/mapStore';
import type { Space, SpaceStatus } from '../../types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const FLOOR_BG = '#f0f2f5';
const GRID_COLOR = '#dde1e7';
const CORRIDOR_BG = '#e2e6ea';

const STATUS: Record<SpaceStatus, { fill: string; stroke: string; textColor: string }> = {
    available: { fill: '#4CAF50', stroke: '#2E7D32', textColor: '#fff' },
    occupied: { fill: '#F44336', stroke: '#B71C1C', textColor: '#fff' },
    pending: { fill: '#FFEB3B', stroke: '#F57F17', textColor: '#333' },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface MarketMapProps {
    isAdmin?: boolean;
}

// ─── SpaceNode ────────────────────────────────────────────────────────────────
interface SpaceNodeProps {
    space: Space;
    isAdmin: boolean;
    isSelected: boolean;
    onSelect: (space: Space) => void;
    onDragFinish: (id: string, x: number, y: number) => void;
    setCursor: (c: string) => void;
}

const SpaceNode: React.FC<SpaceNodeProps> = ({
    space, isAdmin, isSelected, onSelect, onDragFinish, setCursor,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const { fill, stroke, textColor } = STATUS[space.status];

    return (
        <Group
            x={space.x}
            y={space.y}
            draggable={isAdmin}
            onDragStart={() => { setIsDragging(true); setCursor('grabbing'); }}
            onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                setIsDragging(false);
                setCursor('grab');
                onDragFinish(space.id, e.target.x(), e.target.y());
            }}
            onClick={() => onSelect(space)}
            onTap={() => onSelect(space)}
            onMouseEnter={() => setCursor(isAdmin ? 'grab' : 'pointer')}
            onMouseLeave={() => { if (!isDragging) setCursor('default'); }}
        >
            {/* Static drop shadow */}
            <Rect
                x={3} y={4}
                width={space.width} height={space.height}
                fill="rgba(0,0,0,0.10)"
                cornerRadius={6}
                listening={false}
            />

            {/* Main rect */}
            <Rect
                width={space.width}
                height={space.height}
                fill={fill}
                stroke={isSelected ? '#1565C0' : stroke}
                strokeWidth={isSelected ? 3 : (isDragging ? 2.5 : 1.5)}
                cornerRadius={6}
                shadowEnabled={isDragging || isSelected}
                shadowBlur={isDragging ? 20 : (isSelected ? 12 : 0)}
                shadowColor={isSelected ? 'rgba(21,101,192,0.5)' : 'rgba(0,0,0,0.3)'}
                shadowOffsetY={isDragging ? 8 : 0}
                opacity={isDragging ? 0.9 : 1}
            />

            {/* Label */}
            {space.label && (
                <Text
                    text={space.label}
                    width={space.width}
                    height={space.height}
                    align="center"
                    verticalAlign="middle"
                    fontSize={12}
                    fontStyle="bold"
                    fontFamily="Inter, Arial, sans-serif"
                    fill={textColor}
                    listening={false}
                />
            )}
        </Group>
    );
};

// ─── MarketMap ────────────────────────────────────────────────────────────────
const MarketMap: React.FC<MarketMapProps> = ({ isAdmin = false }) => {
    const spaces = useMapStore((s) => s.spaces);
    const selectedSpace = useMapStore((s) => s.selectedSpace);
    const updateSpacePosition = useMapStore((s) => s.updateSpacePosition);
    const selectSpace = useMapStore((s) => s.selectSpace);

    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Resize the stage when the window changes
    useEffect(() => {
        const onResize = () => {
            if (containerRef.current) {
                setSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const setCursor = (cursor: string) => {
        const container = stageRef.current?.container();
        if (container) container.style.cursor = cursor;
    };

    // ── Corridor band ──────────────────────────────────────────────────────────
    // Find the Y-range between the two rows from the store layout
    const topRow = spaces.filter((s) => s.id.startsWith('T'));
    const bottomRow = spaces.filter((s) => s.id.startsWith('B'));
    const corridorY = topRow.length
        ? Math.max(...topRow.map((s) => s.y + s.height)) + 10
        : 150;
    const corridorH = bottomRow.length
        ? (Math.min(...bottomRow.map((s) => s.y)) - corridorY) - 10
        : 60;

    // ── Grid ──────────────────────────────────────────────────────────────────
    const gridStep = 40;
    const gridEls: React.ReactNode[] = [];
    for (let x = gridStep; x < size.width; x += gridStep) {
        gridEls.push(<Rect key={`v${x}`} x={x} y={0} width={1} height={size.height} fill={GRID_COLOR} listening={false} />);
    }
    for (let y = gridStep; y < size.height; y += gridStep) {
        gridEls.push(<Rect key={`h${y}`} x={0} y={y} width={size.width} height={1} fill={GRID_COLOR} listening={false} />);
    }

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <Stage ref={stageRef} width={size.width} height={size.height}>
                {/* ── Background layer ── */}
                <Layer listening={false}>
                    <Rect x={0} y={0} width={size.width} height={size.height} fill={FLOOR_BG} />
                    {gridEls}
                    {/* Corridor band */}
                    {corridorH > 0 && (
                        <Rect
                            x={0} y={corridorY}
                            width={size.width} height={corridorH + 14}
                            fill={CORRIDOR_BG}
                            listening={false}
                        />
                    )}
                </Layer>

                {/* ── Spaces layer ── */}
                <Layer>
                    {spaces.map((space) => (
                        <SpaceNode
                            key={space.id}
                            space={space}
                            isAdmin={isAdmin}
                            isSelected={selectedSpace?.id === space.id}
                            onSelect={selectSpace}
                            onDragFinish={updateSpacePosition}
                            setCursor={setCursor}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

export default MarketMap;
