import React from 'react';
import { GameTab } from '../types/game';
import { Star, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { audio } from '../utils/audio';

interface NavbarProps {
  currentTab: GameTab;
  onSelectTab: (tab: GameTab) => void;
  totalStars: number;
  totalScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  totalStars,
  isMuted,
  onToggleMute,
}) => {
  const tabs: { id: GameTab; label: string }[] = [
    { id: 'tracing', label: 'Traçado Guiado' },
    { id: 'recognition', label: 'Reconhecimento' },
    { id: 'memory', label: 'Jogo da Memória' },
    { id: 'freehand', label: 'Caderno Livre' },
    { id: 'stickers', label: 'Figurinhas' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('tracing')}
          className="text-xl sm:text-2xl font-kids font-bold tracking-tight text-amber-600 flex items-center gap-1.5 focus:outline-hidden"
        >
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-300" />
          <span>Traço Mágico</span>
        </button>

        {/* Zone 2: Navigation tabs with clean active styling */}
        <nav className="hidden md:flex items-center gap-1 bg-amber-50/60 p-1 rounded-2xl border border-amber-200/70">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onSelectTab(tab.id);
                  audio.playPop(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-kids font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-amber-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary actions (Stars count & Mute audio button) */}
        <div className="flex items-center gap-2">
          {/* Star counter */}
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
            <span className="font-mono font-bold text-xs sm:text-sm text-amber-800">
              {totalStars}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-slate-100 text-slate-400 border-slate-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title={isMuted ? 'Ativar som' : 'Desativar som'}
            aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation tab scroll bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-amber-100 bg-amber-50/50 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTab(tab.id);
                audio.playPop(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-kids font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
