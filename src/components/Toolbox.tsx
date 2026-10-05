import React from 'react';
import { PenTool } from '../types/game';
import { Pencil, Sparkles, Play, RotateCcw, Volume2, Palette, Eye } from 'lucide-react';

interface ToolboxProps {
  currentTool: PenTool;
  onSelectTool: (tool: PenTool) => void;
  strokeWidth: number;
  onSelectStrokeWidth: (width: number) => void;
  onDemonstrate: () => void;
  isDemonstrating: boolean;
  onClear: () => void;
  onSpeak: () => void;
  showGuidelines: boolean;
  onToggleGuidelines: () => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({
  currentTool,
  onSelectTool,
  strokeWidth,
  onSelectStrokeWidth,
  onDemonstrate,
  isDemonstrating,
  onClear,
  onSpeak,
  showGuidelines,
  onToggleGuidelines,
}) => {
  const tools: { id: PenTool; label: string; icon: React.ReactNode; colorPreview: string }[] = [
    {
      id: 'pencil',
      label: 'Lápis Escolar',
      icon: <Pencil className="w-4 h-4" />,
      colorPreview: 'bg-slate-700',
    },
    {
      id: 'rainbow',
      label: 'Caneta Arco-íris',
      icon: <Palette className="w-4 h-4" />,
      colorPreview: 'bg-gradient-to-r from-red-400 via-emerald-400 to-blue-400',
    },
    {
      id: 'gold',
      label: 'Pincel Dourado',
      icon: <Sparkles className="w-4 h-4" />,
      colorPreview: 'bg-amber-400',
    },
    {
      id: 'glitter',
      label: 'Glitter Estelar',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      colorPreview: 'bg-purple-500',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/95 rounded-2xl border border-amber-200 shadow-sm max-w-4xl mx-auto backdrop-blur-xs">
      {/* Pen selection */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
          Traço:
        </span>
        {tools.map((t) => {
          const isActive = currentTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-kids transition-all ${
                isActive
                  ? 'bg-amber-500 text-white shadow-xs scale-105'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${t.colorPreview} ring-1 ring-white/60`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Thickness & Secondary Controls */}
      <div className="flex items-center gap-2">
        {/* Thickness pills */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          {[8, 12, 16].map((w) => (
            <button
              key={w}
              onClick={() => onSelectStrokeWidth(w)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                strokeWidth === w ? 'bg-white shadow-xs text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={`Espessura ${w}px`}
            >
              <div
                className="bg-current rounded-full"
                style={{ width: `${w / 2}px`, height: `${w / 2}px` }}
              />
            </button>
          ))}
        </div>

        {/* Toggle Guidelines */}
        <button
          onClick={onToggleGuidelines}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
            showGuidelines
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
          title="Alternar pautas caligráficas"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Pautas</span>
        </button>

        {/* Listen pronunciation */}
        <button
          onClick={onSpeak}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          title="Ouvir a letra e o som"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Ouvir</span>
        </button>

        {/* Demonstration */}
        <button
          onClick={onDemonstrate}
          disabled={isDemonstrating}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-kids font-semibold transition-all shadow-xs ${
            isDemonstrating
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
          title="Ver o lápis mágico desenhar a letra"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isDemonstrating ? 'Desenhando...' : 'Ver Traço'}</span>
        </button>

        {/* Clear */}
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 transition-colors"
          title="Limpar caligrafia"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Limpar</span>
        </button>
      </div>
    </div>
  );
};
