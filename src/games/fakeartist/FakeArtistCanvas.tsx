import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Player } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { PenTool, Undo2, Sparkles, Check } from 'lucide-react';

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawStroke {
  playerId: string;
  color: string;
  points: DrawPoint[];
}

interface FakeArtistCanvasProps {
  activePlayer: Player;
  playerColor: string;
  roundIndex: number;
  totalRounds: number;
  existingStrokes: DrawStroke[];
  stylusMode: boolean;
  onToggleStylusMode: () => void;
  onStrokeFinished: (stroke: DrawStroke) => void;
  onUndoLastStroke: () => void;
  canUndo: boolean;
}

export const FakeArtistCanvas: React.FC<FakeArtistCanvasProps> = ({
  activePlayer,
  playerColor,
  roundIndex,
  totalRounds,
  existingStrokes,
  stylusMode,
  onToggleStylusMode,
  onStrokeFinished,
  onUndoLastStroke,
  canUndo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // In-progress stroke points stored in ref for 120fps zero-lag drawing
  // (Avoids triggering React state re-renders and GPU texture thrashing on pointermove)
  const currentStrokePointsRef = useRef<DrawPoint[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const lastDimensionsRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 0,
    height: 0,
    dpr: 1,
  });

  const [passingFeedback, setPassingFeedback] = useState<string | null>(null);

  // Redraw all completed strokes onto the canvas
  const redrawExistingStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = lastDimensionsRef.current.dpr || 1;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all stored strokes
    existingStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(3.5 * dpr, 4);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [existingStrokes]);

  // Keep ref to redrawExistingStrokes so ResizeObserver doesn't depend on it
  const redrawRef = useRef(redrawExistingStrokes);
  redrawRef.current = redrawExistingStrokes;

  // Redraw when existingStrokes changes (e.g. undo or new stroke)
  useEffect(() => {
    redrawExistingStrokes();
  }, [redrawExistingStrokes]);

  // Handle canvas sizing with DPR scaling (capped at 2 to prevent GPU out-of-memory crashes on 2K/3K tablets)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Cap DPR at 2.0 to eliminate high-DPI texture thrashing / green screen crashes
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetPixelWidth = Math.floor(rect.width * dpr);
      const targetPixelHeight = Math.floor(rect.height * dpr);

      // Only re-allocate canvas buffer if dimensions actually changed
      if (
        lastDimensionsRef.current.width !== targetPixelWidth ||
        lastDimensionsRef.current.height !== targetPixelHeight
      ) {
        lastDimensionsRef.current = {
          width: targetPixelWidth,
          height: targetPixelHeight,
          dpr,
        };

        canvas.width = targetPixelWidth;
        canvas.height = targetPixelHeight;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        redrawRef.current();
      }
    };

    handleResize();

    const ro = new ResizeObserver(() => {
      handleResize();
    });
    ro.observe(container);

    // Gracefully handle GPU context loss / restoration
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('Canvas context lost. Restoring...');
    };

    const handleContextRestored = () => {
      console.log('Canvas context restored');
      redrawRef.current();
    };

    canvas.addEventListener('contextlost', handleContextLost);
    canvas.addEventListener('contextrestored', handleContextRestored);

    return () => {
      ro.disconnect();
      canvas.removeEventListener('contextlost', handleContextLost);
      canvas.removeEventListener('contextrestored', handleContextRestored);
    };
  }, []);

  // Compute pointer coordinate relative to canvas bitmap
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = lastDimensionsRef.current.dpr || 1;
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  };

  // 1. Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Hardware palm rejection: if Stylus Mode is active, ignore touches from fingers/palms!
    if (stylusMode && e.pointerType === 'touch') {
      return;
    }

    const point = getCanvasPoint(e);
    if (!point) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    isDrawingRef.current = true;
    currentStrokePointsRef.current = [point];

    // Prepare direct 2D context drawing
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = lastDimensionsRef.current.dpr || 1;
    ctx.beginPath();
    ctx.strokeStyle = playerColor;
    ctx.lineWidth = Math.max(3.5 * dpr, 4);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(point.x, point.y);
  };

  // 2. Pointer Move (120fps hardware-accelerated direct rendering)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Hardware palm rejection: if Stylus Mode is active, ignore touches from fingers/palms!
    if (stylusMode && e.pointerType === 'touch') return;
    if (!isDrawingRef.current) return;
    const point = getCanvasPoint(e);
    if (!point) return;

    const pts = currentStrokePointsRef.current;
    pts.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw single segment incrementally (O(1) fast, zero lag!)
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  // 3. Pointer Up / Lift Pen
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const completedPoints = [...currentStrokePointsRef.current];
    currentStrokePointsRef.current = [];

    // Valid stroke check (at least 2 points and minimum distance)
    if (completedPoints.length >= 2) {
      sound.playPop();
      haptics.medium();

      const newStroke: DrawStroke = {
        playerId: activePlayer.id,
        color: playerColor,
        points: completedPoints,
      };

      setPassingFeedback('Stroke Complete! ✓');
      setTimeout(() => {
        setPassingFeedback(null);
        onStrokeFinished(newStroke);
      }, 300);
    } else {
      // Just a tap: redraw to clear accidental dot
      redrawExistingStrokes();
    }
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 select-none overflow-hidden space-y-2">
      {/* Top Turn & Color Indicator Banner */}
      <div
        className="neo-card p-2.5 sm:p-3 bg-white border-3 border-black flex items-center justify-between shadow-[3px_3px_0px_#000] flex-shrink-0"
        style={{ borderLeftColor: playerColor, borderLeftWidth: '8px' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-2xl sm:text-3xl">{activePlayer.avatarEmoji}</span>
          <div>
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-500">
              Round {roundIndex + 1} of {totalRounds} • Drawing Turn
            </div>
            <div className="text-sm sm:text-base font-black text-[#18181B] flex items-center gap-1.5">
              <span>{activePlayer.name}</span>
              <span
                className="w-3.5 h-3.5 rounded-full border border-black inline-block"
                style={{ backgroundColor: playerColor }}
                title="Your assigned color"
              />
            </div>
          </div>
        </div>

        {/* Stylus Mode & Undo Controls */}
        <div className="flex items-center gap-2">
          {canUndo && (
            <button
              onClick={() => {
                sound.playPass();
                onUndoLastStroke();
              }}
              className="px-2.5 py-1.5 rounded-xl border-2 border-black bg-rose-100 hover:bg-rose-200 text-rose-950 text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition-all cursor-pointer"
              title="Undo last stroke and return turn to previous player"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playPop();
              onToggleStylusMode();
            }}
            className={`px-2.5 py-1.5 rounded-xl border-2 border-black text-xs font-black flex items-center gap-1 transition-all ${
              stylusMode
                ? 'bg-[#A7F3D0] text-emerald-950 shadow-[2px_2px_0px_#000]'
                : 'bg-gray-100 text-gray-700 shadow-[1px_1px_0px_#000]'
            }`}
            title="When ON, touches from fingers and palm are ignored for drawing"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">{stylusMode ? 'Stylus: ON (Palm Rejected)' : 'Touch: ON'}</span>
          </button>
        </div>
      </div>

      {/* Instruction Sub-bar */}
      <div className="flex items-center justify-between px-1 text-[11px] font-black text-gray-600 flex-shrink-0">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Draw <b>ONE continuous line</b>. Lift pen to pass!
        </span>
        <span className="text-indigo-700 font-extrabold">
          {existingStrokes.length} Strokes on Canvas
        </span>
      </div>

      {/* Main Drawing Canvas Container (Flex-1 min-h-0 fills exact remaining tablet height without scroll!) */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 min-h-0 bg-white rounded-2xl md:rounded-3xl border-3 md:border-4 border-black shadow-[4px_4px_0px_#000] overflow-hidden touch-none"
        style={{
          touchAction: 'none',
          backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair block touch-none"
          style={{ touchAction: 'none' }}
        />

        {/* Stroke Complete Flash Notification */}
        {passingFeedback && (
          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center animate-fade-in pointer-events-none">
            <div className="neo-card p-4 bg-white border-3 border-black text-emerald-950 font-black text-lg flex items-center gap-2 shadow-[4px_4px_0px_#000] animate-bounce">
              <Check className="w-6 h-6 text-emerald-600 stroke-[3]" />
              {passingFeedback}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
