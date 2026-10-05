import React from 'react';
import { Star, Trophy, Award, Lock, Sparkles } from 'lucide-react';

interface Sticker {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requiredStars: number;
}

const STICKERS: Sticker[] = [
  {
    id: 'first-stroke',
    title: 'Primeiro Traço',
    description: 'Completou a primeira letra cursiva!',
    emoji: '✏️',
    requiredStars: 1,
  },
  {
    id: 'wave-master',
    title: 'Navegador da Onda',
    description: 'Dominou as curvas da Onda do Mar!',
    emoji: '🌊',
    requiredStars: 3,
  },
  {
    id: 'loop-champ',
    title: 'Mestre dos Laços',
    description: 'Laços altos e perfeitos até o céu!',
    emoji: '🎀',
    requiredStars: 6,
  },
  {
    id: 'triple-star',
    title: 'Estrela de Ouro',
    description: 'Conseguiu 3 estrelas perfeitas com alta precisão!',
    emoji: '🌟',
    requiredStars: 9,
  },
  {
    id: 'mountain-runner',
    title: 'Saltador de Montanhas',
    description: 'Arrematou as três montanhas redondinhas do M e N!',
    emoji: '⛰️',
    requiredStars: 12,
  },
  {
    id: 'royal-cursive',
    title: 'Letra Real',
    description: 'Escreveu as maiúsculas elegantes com perfeição!',
    emoji: '👑',
    requiredStars: 15,
  },
  {
    id: 'word-connector',
    title: 'Mágico das Conexões',
    description: 'Ligou letras sem tirar o lápis do papel!',
    emoji: '✨',
    requiredStars: 18,
  },
  {
    id: 'caligraphy-legend',
    title: 'Grande Calígrafo',
    description: 'Mestre supremo da caligrafia cursiva infantil!',
    emoji: '🏆',
    requiredStars: 25,
  },
];

interface StickerAlbumProps {
  totalStars: number;
  completedLettersCount: number;
}

export const StickerAlbum: React.FC<StickerAlbumProps> = ({ totalStars, completedLettersCount }) => {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border border-amber-200 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-kids font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Álbum de Figurinhas da Caligrafia</span>
          </h2>
          <p className="text-xs text-slate-500">
            Ganhe estrelas no traçado das letras para desbloquear figurinhas colecionáveis!
          </p>
        </div>

        {/* Global counters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200 text-xs font-semibold text-amber-800">
            <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
            <span className="font-mono text-sm">{totalStars}</span>
            <span className="font-kids">Estrelas</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span className="font-mono text-sm">{completedLettersCount}</span>
            <span className="font-kids">Letras</span>
          </div>
        </div>
      </div>

      {/* Grid of stickers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STICKERS.map((st) => {
          const isUnlocked = totalStars >= st.requiredStars;

          return (
            <div
              key={st.id}
              className={`p-4 rounded-2xl flex flex-col items-center text-center transition-all ${
                isUnlocked
                  ? 'bg-amber-50/70 border-2 border-amber-300 shadow-xs hover:scale-105'
                  : 'bg-slate-50/80 border border-slate-200 opacity-60'
              }`}
            >
              {/* Emoji badge */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner ${
                  isUnlocked
                    ? 'bg-white border-2 border-amber-200 ring-2 ring-amber-100'
                    : 'bg-slate-200 grayscale text-slate-400'
                }`}
              >
                {isUnlocked ? st.emoji : <Lock className="w-6 h-6 text-slate-400" />}
              </div>

              <h4 className="font-kids font-bold text-sm text-slate-800 mb-1">
                {st.title}
              </h4>

              <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-tight">
                {st.description}
              </p>

              {/* Requirement pill */}
              <div
                className={`mt-auto text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isUnlocked
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Conquistada!</span>
                  </>
                ) : (
                  <>
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                    <span>{st.requiredStars} estrelas</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
