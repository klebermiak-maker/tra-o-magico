import React from 'react';
import { CursiveLetterData, LetterCategory, PedagogicalFamily } from '../types/game';
import { Star, Sparkles } from 'lucide-react';
import { audio } from '../utils/audio';

interface LetterSelectorProps {
  letters: CursiveLetterData[];
  selectedLetterId: string;
  onSelectLetter: (letter: CursiveLetterData) => void;
  starsMap: Record<string, number>;
  activeCategory: LetterCategory;
  onSelectCategory: (category: LetterCategory) => void;
  selectedFamily: PedagogicalFamily | 'all';
  onSelectFamily: (family: PedagogicalFamily | 'all') => void;
}

export const LetterSelector: React.FC<LetterSelectorProps> = ({
  letters,
  selectedLetterId,
  onSelectLetter,
  starsMap,
  activeCategory,
  onSelectCategory,
  selectedFamily,
  onSelectFamily,
}) => {
  const families: { id: PedagogicalFamily | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'Todas as Letras', icon: '🌟' },
    { id: 'onda', label: 'Onda do Mar', icon: '🌊' },
    { id: 'laco', label: 'Laços Altos', icon: '🎀' },
    { id: 'montanha', label: 'Montanhas', icon: '⛰️' },
    { id: 'ioio', label: 'Ioiô & Cortes', icon: '🪀' },
  ];

  const filteredLetters = letters.filter((l) => {
    if (l.category !== activeCategory) return false;
    if (activeCategory === 'lower' && selectedFamily !== 'all') {
      return l.family === selectedFamily;
    }
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 px-4">
      {/* Category Segmented Controls */}
      <div className="flex items-center justify-center gap-1.5 p-1 bg-amber-100/70 rounded-2xl max-w-md mx-auto mb-4 border border-amber-200">
        <button
          onClick={() => {
            onSelectCategory('lower');
            audio.playPop(1);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-kids font-semibold transition-all ${
            activeCategory === 'lower'
              ? 'bg-white text-amber-900 shadow-xs'
              : 'text-amber-800/80 hover:text-amber-950'
          }`}
        >
          Minúsculas (a-z)
        </button>
        <button
          onClick={() => {
            onSelectCategory('upper');
            audio.playPop(1.1);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-kids font-semibold transition-all ${
            activeCategory === 'upper'
              ? 'bg-white text-amber-900 shadow-xs'
              : 'text-amber-800/80 hover:text-amber-950'
          }`}
        >
          Maiúsculas (A-Z)
        </button>
        <button
          onClick={() => {
            onSelectCategory('words');
            audio.playPop(1.2);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-kids font-semibold transition-all ${
            activeCategory === 'words'
              ? 'bg-white text-amber-900 shadow-xs'
              : 'text-amber-800/80 hover:text-amber-950'
          }`}
        >
          Palavras ✨
        </button>
      </div>

      {/* Pedagogical Families Filter (when in lowercase category) */}
      {activeCategory === 'lower' && (
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {families.map((f) => {
            const isActive = selectedFamily === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  onSelectFamily(f.id);
                  audio.playPop(1.05);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-kids whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs font-semibold'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-amber-200'
                }`}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Letter Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
        {filteredLetters.map((l) => {
          const isSelected = selectedLetterId === l.id;
          const stars = starsMap[l.id] || 0;

          return (
            <button
              key={l.id}
              onClick={() => {
                onSelectLetter(l);
                audio.playPop(1.1);
              }}
              className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                isSelected
                  ? 'bg-white border-3 border-amber-500 shadow-md scale-105 ring-2 ring-amber-300'
                  : 'bg-white/90 border border-amber-200 hover:border-amber-300 hover:bg-white shadow-2xs'
              }`}
            >
              {/* Star Badge */}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
                {stars > 0 ? (
                  <div className="flex items-center">
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500 drop-shadow-xs" />
                    {stars > 1 && (
                      <span className="text-[10px] font-bold font-mono text-amber-700 leading-none ml-0.5">
                        {stars}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                )}
              </div>

              {/* Big Cursive Character */}
              <span className="font-cursive text-3xl sm:text-4xl font-bold text-slate-800 leading-tight mt-1 select-none">
                {l.char}
              </span>

              {/* Print Block Sub-label */}
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                <span>{l.displayChar}</span>
                <span>·</span>
                <span>{l.wordImageEmoji}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
