import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CursiveLetterData, PenTool, StrokePoint } from '../types/game';
import { samplePathPoints, getDistance } from '../utils/pathHelper';
import { audio } from '../utils/audio';

interface CursiveCanvasProps {
  letter: CursiveLetterData;
  tool: PenTool;
  strokeWidth: number;
  showGuidelines: boolean;
  onProgressUpdate: (progress: number, accuracy: number, stars: number, message: string) => void;
  onComplete: (stars: number, accuracy: number) => void;
  isDemonstrating: boolean;
  onStopDemonstrating: () => void;
  clearTrigger: number;
}

interface UserPathSegment {
  points: StrokePoint[];
  color: string;
  width: number;
  tool: PenTool;
}

export const CursiveCanvas: React.FC<CursiveCanvasProps> = ({
  letter,
  tool,
  strokeWidth,
  showGuidelines,
  onProgressUpdate,
  onComplete,
  isDemonstrating,
  onStopDemonstrating,
  clearTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // User drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [userSegments, setUserSegments] = useState<UserPathSegment[]>([]);
  const currentSegmentRef = useRef<StrokePoint[]>([]);

  // Stroke guide state
  const [currentStrokeIdx, setCurrentStrokeIdx] = useState(0);
  const [reachedCheckpointIdx, setReachedCheckpointIdx] = useState(0);
  const [processedStrokes, setProcessedStrokes] = useState<
    Array<{ points: StrokePoint[]; totalLength: number; arrows: Array<{ x: number; y: number; angle: number }> }>
  >([]);

  // Accuracy tracking
  const deviationsRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize and sample strokes for the letter
  useEffect(() => {
    const sampled = letter.strokes.map((st) => {
      const sampleCount = Math.max(30, Math.min(80, Math.floor(st.path.length / 4)));
      return samplePathPoints(st.path, sampleCount);
    });
    setProcessedStrokes(sampled);
    resetDrawingState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.id]);

  // Handle external clear trigger
  useEffect(() => {
    resetDrawingState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTrigger]);

  const resetDrawingState = () => {
    setUserSegments([]);
    currentSegmentRef.current = [];
    setCurrentStrokeIdx(0);
    setReachedCheckpointIdx(0);
    deviationsRef.current = [];
    onProgressUpdate(0, 100, 0, 'Toque no ponto 1 para começar o traço!');
    redrawCanvas();
  };

  // Demonstration animation: animate guided pencil moving along the letter path
  useEffect(() => {
    if (!isDemonstrating || processedStrokes.length === 0) return;

    let strokeIdx = 0;
    let ptIdx = 0;
    let demoSegments: UserPathSegment[] = [];
    let currentDemoPoints: StrokePoint[] = [];

    const interval = setInterval(() => {
      if (strokeIdx >= processedStrokes.length) {
        clearInterval(interval);
        onStopDemonstrating();
        audio.playStar(3);
        onProgressUpdate(100, 100, 3, 'Veja como fica lindo! Agora é a sua vez!');
        return;
      }

      const activeStroke = processedStrokes[strokeIdx];
      if (!activeStroke || activeStroke.points.length === 0) {
        strokeIdx++;
        ptIdx = 0;
        return;
      }

      const point = activeStroke.points[ptIdx];
      currentDemoPoints.push(point);

      if (ptIdx % 4 === 0) {
        audio.playCheckpoint(ptIdx, activeStroke.points.length);
      }

      ptIdx++;
      if (ptIdx >= activeStroke.points.length) {
        demoSegments = [
          ...demoSegments,
          {
            points: [...currentDemoPoints],
            color: '#10B981',
            width: strokeWidth + 2,
            tool: 'pencil',
          },
        ];
        currentDemoPoints = [];
        strokeIdx++;
        ptIdx = 0;
      }

      setUserSegments([...demoSegments, {
        points: [...currentDemoPoints],
        color: '#10B981',
        width: strokeWidth + 2,
        tool: 'pencil',
      }]);
    }, 40);

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemonstrating, processedStrokes]);

  // Convert client coordinate to Canvas viewBox coordinates
  const getCanvasPoint = useCallback((clientX: number, clientY: number): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = letter.viewBox.width / rect.width;
    const scaleY = letter.viewBox.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [letter.viewBox]);

  // Redraw canvas whenever user segments change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all finished and current user segments
    const allSegments = [...userSegments];
    if (currentSegmentRef.current.length > 0) {
      allSegments.push({
        points: currentSegmentRef.current,
        color: getToolColor(tool, 0),
        width: strokeWidth,
        tool: tool,
      });
    }

    allSegments.forEach((segment) => {
      if (segment.points.length < 2) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = segment.width;

      if (segment.tool === 'rainbow') {
        // Draw rainbow segments with varying hue
        for (let i = 1; i < segment.points.length; i++) {
          const p1 = segment.points[i - 1];
          const p2 = segment.points[i];
          const hue = (i * 9) % 360;
          ctx.strokeStyle = `hsl(${hue}, 85%, 50%)`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      } else if (segment.tool === 'gold') {
        ctx.strokeStyle = '#F59E0B';
        ctx.shadowColor = '#FDE68A';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(segment.points[0].x, segment.points[0].y);
        for (let i = 1; i < segment.points.length; i++) {
          ctx.lineTo(segment.points[i].x, segment.points[i].y);
        }
        ctx.stroke();
      } else if (segment.tool === 'glitter') {
        ctx.strokeStyle = '#8B5CF6';
        ctx.shadowColor = '#C4B5FD';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(segment.points[0].x, segment.points[0].y);
        for (let i = 1; i < segment.points.length; i++) {
          ctx.lineTo(segment.points[i].x, segment.points[i].y);
        }
        ctx.stroke();
      } else {
        // Soft charcoal pencil
        ctx.strokeStyle = '#1E293B';
        ctx.beginPath();
        ctx.moveTo(segment.points[0].x, segment.points[0].y);
        for (let i = 1; i < segment.points.length; i++) {
          ctx.lineTo(segment.points[i].x, segment.points[i].y);
        }
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [userSegments, tool, strokeWidth]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getToolColor = (t: PenTool, index: number): string => {
    switch (t) {
      case 'rainbow':
        return `hsl(${(index * 12) % 360}, 85%, 50%)`;
      case 'gold':
        return '#F59E0B';
      case 'glitter':
        return '#8B5CF6';
      case 'pencil':
      default:
        return '#1E293B';
    }
  };

  // Touch and Mouse Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (isDemonstrating) return;
    const pt = getCanvasPoint(clientX, clientY);
    if (!pt) return;

    setIsDrawing(true);
    currentSegmentRef.current = [pt];
    checkProgress(pt);
    redrawCanvas();
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDrawing || isDemonstrating) return;
    const pt = getCanvasPoint(clientX, clientY);
    if (!pt) return;

    currentSegmentRef.current.push(pt);
    checkProgress(pt);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      redrawCanvas();
    });
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentSegmentRef.current.length > 0) {
      setUserSegments((prev) => [
        ...prev,
        {
          points: [...currentSegmentRef.current],
          color: getToolColor(tool, prev.length),
          width: strokeWidth,
          tool,
        },
      ]);
      currentSegmentRef.current = [];
    }
    redrawCanvas();
  };

  // Evaluate progress against active stroke checkpoints
  const checkProgress = (pt: StrokePoint) => {
    if (processedStrokes.length === 0 || currentStrokeIdx >= processedStrokes.length) return;

    const activeStroke = processedStrokes[currentStrokeIdx];
    if (!activeStroke || activeStroke.points.length === 0) return;

    const nextCheckpoint = activeStroke.points[reachedCheckpointIdx];
    if (!nextCheckpoint) return;

    const dist = getDistance(pt, nextCheckpoint);
    deviationsRef.current.push(dist);

    // Tolerance radius (45px for friendly kids motor learning)
    const HIT_RADIUS = 45;

    if (dist <= HIT_RADIUS) {
      const newReached = reachedCheckpointIdx + 1;
      setReachedCheckpointIdx(newReached);

      // Play chime every 3 checkpoints
      if (newReached % 3 === 0 || newReached === activeStroke.points.length) {
        audio.playCheckpoint(newReached, activeStroke.points.length);
      }

      // Calculate total progress across all strokes
      const totalLetterCheckpoints = processedStrokes.reduce(
        (acc, s) => acc + s.points.length,
        0
      );
      const previouslyCompletedPoints = processedStrokes
        .slice(0, currentStrokeIdx)
        .reduce((acc, s) => acc + s.points.length, 0);
      const totalPointsReached = previouslyCompletedPoints + newReached;

      const progressPercent = Math.min(
        100,
        Math.round((totalPointsReached / totalLetterCheckpoints) * 100)
      );

      // Calculate accuracy
      const avgDeviation =
        deviationsRef.current.reduce((a, b) => a + b, 0) /
        Math.max(1, deviationsRef.current.length);
      const accuracyScore = Math.max(50, Math.min(100, Math.round(100 - avgDeviation * 1.2)));

      // Calculate active stars based on progress and accuracy
      let activeStars = 0;
      if (progressPercent >= 30) activeStars = 1;
      if (progressPercent >= 65 && accuracyScore >= 60) activeStars = 2;
      if (progressPercent >= 95 && accuracyScore >= 75) activeStars = 3;

      let feedbackMsg = 'Isso aí! Continue o traço...';
      if (progressPercent < 25) feedbackMsg = 'Bom começo! Siga as setinhas.';
      else if (progressPercent < 75) feedbackMsg = 'Muito bem! Que curva linda!';
      else if (progressPercent < 100) feedbackMsg = 'Quase lá! Termine a perninha!';
      else feedbackMsg = 'Incrível! Traçado concluído!';

      onProgressUpdate(progressPercent, accuracyScore, activeStars, feedbackMsg);

      // Check if current stroke is finished
      if (newReached >= activeStroke.points.length) {
        const nextStrokeIdx = currentStrokeIdx + 1;
        if (nextStrokeIdx < processedStrokes.length) {
          // Advance to next stroke (e.g., pingo no i, travessão no t)
          setCurrentStrokeIdx(nextStrokeIdx);
          setReachedCheckpointIdx(0);
          audio.playStar(1);
          const nextPrompt =
            nextStrokeIdx === 1 && letter.char === 'i'
              ? 'Agora coloque o pingo no i!'
              : nextStrokeIdx === 1 && letter.char === 't'
              ? 'Agora faça o corte no t!'
              : `Continue no próximo traço ${nextStrokeIdx + 1}!`;
          onProgressUpdate(progressPercent, accuracyScore, activeStars, nextPrompt);
        } else {
          // Whole letter completed!
          audio.playSuccessFanfare();
          const finalStars = accuracyScore >= 78 ? 3 : accuracyScore >= 60 ? 2 : 1;
          setTimeout(() => {
            onComplete(finalStars, accuracyScore);
          }, 350);
        }
      }
    }
  };

  const activeStrokeData = letter.strokes[currentStrokeIdx];
  const activeCheckpoint =
    processedStrokes[currentStrokeIdx]?.points[reachedCheckpointIdx];

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] max-w-xl mx-auto rounded-3xl overflow-hidden shadow-lg border-4 border-amber-200 bg-amber-50/60 touch-none select-none"
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length > 0) {
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={handlePointerUp}
    >
      {/* 1. Authentic Brazilian Calligraphy Notebook Guidelines (Caderno de Caligrafia) */}
      <svg
        viewBox={`0 0 ${letter.viewBox.width} ${letter.viewBox.height}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* Paper texture lines */}
        <defs>
          <pattern id="notebook-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(245, 158, 11, 0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#notebook-grid)" />

        {/* Notebook Left Margin Line */}
        <line
          x1="55"
          y1="0"
          x2="55"
          y2={letter.viewBox.height}
          stroke="#F87171"
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />

        {showGuidelines && (
          <g className="guidelines">
            {/* Top line (Azul claro - Laços e hastes altas: b, d, l, t, maiúsculas) */}
            <line
              x1="0"
              y1={letter.toplineY}
              x2={letter.viewBox.width}
              y2={letter.toplineY}
              stroke="#60A5FA"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x="62"
              y={letter.toplineY - 4}
              fill="#3B82F6"
              fontSize="9"
              fontWeight="600"
              className="font-kids select-none"
            >
              Céu (linha alta)
            </text>

            {/* Midline (Linha média tracejada - Teto das minúsculas) */}
            <line
              x1="0"
              y1={letter.midlineY}
              x2={letter.viewBox.width}
              y2={letter.midlineY}
              stroke="#F59E0B"
              strokeWidth="1.8"
              strokeDasharray="6 4"
            />
            <text
              x="62"
              y={letter.midlineY - 4}
              fill="#D97706"
              fontSize="9"
              fontWeight="600"
              className="font-kids select-none"
            >
              Meio (corpo da letra)
            </text>

            {/* Baseline (Linha de base vermelha contínua - O chão onde as letras pisam) */}
            <line
              x1="0"
              y1={letter.baselineY}
              x2={letter.viewBox.width}
              y2={letter.baselineY}
              stroke="#EF4444"
              strokeWidth="2"
            />
            <text
              x="62"
              y={letter.baselineY + 12}
              fill="#DC2626"
              fontSize="9"
              fontWeight="bold"
              className="font-kids select-none"
            >
              Chão (linha base)
            </text>

            {/* Bottomline (Verde claro - Letras que descem: g, j, p, q, y, z) */}
            <line
              x1="0"
              y1={letter.bottomlineY}
              x2={letter.viewBox.width}
              y2={letter.bottomlineY}
              stroke="#34D399"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x="62"
              y={letter.bottomlineY + 12}
              fill="#059669"
              fontSize="9"
              fontWeight="600"
              className="font-kids select-none"
            >
              Porão (linha que desce)
            </text>
          </g>
        )}

        {/* 2. Ghost / Dotted Reference Letter Path */}
        {letter.strokes.map((s, idx) => (
          <path
            key={s.id}
            d={s.path}
            fill="none"
            stroke={idx === currentStrokeIdx ? '#CBD5E1' : '#E2E8F0'}
            strokeWidth={strokeWidth + 6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 10"
          />
        ))}

        {/* Direction arrows along the active stroke to guide children */}
        {processedStrokes[currentStrokeIdx]?.arrows.map((arr, i) => (
          <g
            key={i}
            transform={`translate(${arr.x}, ${arr.y}) rotate(${arr.angle})`}
            className="animate-pulse opacity-60"
          >
            <path
              d="M -6 -4 L 3 0 L -6 4"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* 3. Starting Point Marker (Ponto 1) */}
        {activeStrokeData && (
          <g
            transform={`translate(${activeStrokeData.startPoint.x}, ${activeStrokeData.startPoint.y})`}
            className="animate-bounce"
          >
            <circle r="14" fill="#F59E0B" className="shadow-md" />
            <circle r="16" fill="none" stroke="#FEF3C7" strokeWidth="2.5" />
            <text
              y="4.5"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {activeStrokeData.startLabel}
            </text>
          </g>
        )}

        {/* 4. Active Target Checkpoint (Glowing helper magnet) */}
        {activeCheckpoint && (
          <g transform={`translate(${activeCheckpoint.x}, ${activeCheckpoint.y})`}>
            <circle
              r="20"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="4 3"
              className="animate-spin"
              style={{ animationDuration: '4s' }}
            />
            <circle r="6" fill="#10B981" fillOpacity="0.7" />
          </g>
        )}
      </svg>

      {/* 5. User drawing canvas (High-res pixel backing) */}
      <canvas
        ref={canvasRef}
        width={letter.viewBox.width}
        height={letter.viewBox.height}
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />

      {/* Interactive Helper Hint Badge */}
      <div className="absolute bottom-2 right-3 pointer-events-none bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-kids text-slate-500 border border-amber-200/80 shadow-xs flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>Arraste sobre as setinhas</span>
      </div>
    </div>
  );
};
