import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, RotateCcw, Download, Eye, Sparkles } from 'lucide-react';
import { audio } from '../utils/audio';

export const FreeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1E293B');
  const [lineWidth, setLineWidth] = useState(10);
  const [isRainbow, setIsRainbow] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [lineMode, setLineMode] = useState<'caligraphy' | 'simple' | 'blank'>('caligraphy');

  const strokeCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = '#FFFBEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    setIsDrawing(true);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;

    if (isEraser) {
      ctx.strokeStyle = '#FFFBEB';
    } else if (isRainbow) {
      ctx.strokeStyle = `hsl(${(strokeCountRef.current * 10) % 360}, 85%, 50%)`;
    } else {
      ctx.strokeStyle = color;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    strokeCountRef.current++;

    if (isRainbow && !isEraser) {
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${(strokeCountRef.current * 10) % 360}, 85%, 50%)`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFBEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    audio.playPop(1);
  };

  const downloadArtwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'minha-caligrafia-magica.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    audio.playStar(3);
  };

  const colors = [
    { label: 'Grafite', hex: '#1E293B' },
    { label: 'Azul Escolar', hex: '#2563EB' },
    { label: 'Rosa Mágico', hex: '#EC4899' },
    { label: 'Dourado', hex: '#D97706' },
    { label: 'Esmeralda', hex: '#059669' },
    { label: 'Roxo Estelar', hex: '#7C3AED' },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border border-amber-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-kids font-bold text-slate-800">
            Caderno Livre de Caligrafia
          </h2>
          <p className="text-xs text-slate-500">
            Escreva seu nome, invente palavras ou pratique o laço e as ondas livremente!
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Limpar papel"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
          <button
            onClick={downloadArtwork}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-kids font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
            title="Baixar imagem"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Salvar Desenho</span>
          </button>
        </div>
      </div>

      {/* Drawing Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 mb-4">
        {/* Colors */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => {
                setColor(c.hex);
                setIsRainbow(false);
                setIsEraser(false);
              }}
              className={`w-7 h-7 rounded-full transition-transform ${
                !isRainbow && !isEraser && color === c.hex
                  ? 'ring-2 ring-offset-2 ring-amber-500 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.label}
            />
          ))}

          {/* Rainbow button */}
          <button
            onClick={() => {
              setIsRainbow(true);
              setIsEraser(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold font-kids bg-gradient-to-r from-red-400 via-emerald-400 to-blue-400 text-white transition-all ${
              isRainbow ? 'ring-2 ring-offset-2 ring-amber-500 scale-105' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            Arco-íris
          </button>

          {/* Eraser */}
          <button
            onClick={() => {
              setIsEraser(!isEraser);
              setIsRainbow(false);
            }}
            className={`p-1.5 rounded-xl border transition-colors ${
              isEraser
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Borracha"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Guidelines toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 font-medium px-1">Pauta:</span>
          <button
            onClick={() => setLineMode('caligraphy')}
            className={`px-2 py-1 rounded-lg transition-colors ${
              lineMode === 'caligraphy' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            4 Linhas
          </button>
          <button
            onClick={() => setLineMode('simple')}
            className={`px-2 py-1 rounded-lg transition-colors ${
              lineMode === 'simple' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Simples
          </button>
          <button
            onClick={() => setLineMode('blank')}
            className={`px-2 py-1 rounded-lg transition-colors ${
              lineMode === 'blank' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sem Pauta
          </button>
        </div>

        {/* Stroke width */}
        <div className="flex items-center gap-1.5">
          {[6, 12, 18].map((w) => (
            <button
              key={w}
              onClick={() => setLineWidth(w)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                lineWidth === w
                  ? 'bg-amber-500 border-amber-600 text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div
                className="bg-current rounded-full"
                style={{ width: `${w / 2}px`, height: `${w / 2}px` }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Freehand Canvas with Overlay SVG Guides */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border-2 border-amber-300 shadow-inner bg-[#FFFBEB] touch-none select-none">
        {/* SVG Calligraphy Lined Paper Background Overlay */}
        {lineMode !== 'blank' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            {lineMode === 'caligraphy' ? (
              // Multi-row 4-line calligraphy lines
              [60, 160, 260].map((baseY) => (
                <g key={baseY}>
                  <line x1="0" y1={baseY - 70} x2="100%" y2={baseY - 70} stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1={baseY - 35} x2="100%" y2={baseY - 35} stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="6 3" />
                  <line x1="0" y1={baseY} x2="100%" y2={baseY} stroke="#EF4444" strokeWidth="1.5" />
                  <line x1="0" y1={baseY + 35} x2="100%" y2={baseY + 35} stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" />
                </g>
              ))
            ) : (
              // Simple lines
              [70, 140, 210, 280].map((y) => (
                <line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="#94A3B8" strokeWidth="1" />
              ))
            )}
          </svg>
        )}

        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
    </div>
  );
};
