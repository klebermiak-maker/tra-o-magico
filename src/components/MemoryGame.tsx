import React, { useState, useEffect } from 'react';
import { audio } from '../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Star, Sparkles } from 'lucide-react';

interface Card {
  id: string;
  pairKey: string;
  display: string;
  type: 'print' | 'cursive';
  isFlipped: boolean;
  isMatched: boolean;
}

const PAIRS = [
  { key: 'A', print: 'A', cursive: 'a', word: 'Abelha' },
  { key: 'B', print: 'B', cursive: 'b', word: 'Bola' },
  { key: 'C', print: 'C', cursive: 'c', word: 'Casa' },
  { key: 'D', print: 'D', cursive: 'd', word: 'Dado' },
  { key: 'E', print: 'E', cursive: 'e', word: 'Estrela' },
  { key: 'L', print: 'L', cursive: 'l', word: 'Lua' },
];

export const MemoryGame: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initGame = () => {
    const deck: Card[] = [];
    PAIRS.forEach((p) => {
      deck.push({
        id: `${p.key}-print`,
        pairKey: p.key,
        display: p.print,
        type: 'print',
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: `${p.key}-cursive`,
        pairKey: p.key,
        display: p.cursive,
        type: 'cursive',
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck
    deck.sort(() => Math.random() - 0.5);

    setCards(deck);
    setFlippedCards([]);
    setMatchedCount(0);
    setMoves(0);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (card: Card) => {
    if (card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    audio.playPop(1.2);

    const newCards = cards.map((c) =>
      c.id === card.id ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;

      if (first.pairKey === second.pairKey && first.type !== second.type) {
        // Match!
        setTimeout(() => {
          audio.playStar(2);
          audio.speak(`Par encontrado! Letra ${first.pairKey}!`);

          setCards((prev) =>
            prev.map((c) =>
              c.pairKey === first.pairKey ? { ...c, isMatched: true } : c
            )
          );
          setFlippedCards([]);
          const newMatched = matchedCount + 1;
          setMatchedCount(newMatched);

          if (newMatched === PAIRS.length) {
            setIsWon(true);
            audio.playSuccessFanfare();
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
          }
        }, 400);
      } else {
        // No match
        setTimeout(() => {
          audio.playError();
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border border-amber-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-kids font-bold text-slate-800">
            Jogo da Memória: Bastão & Cursiva
          </h2>
          <p className="text-xs text-slate-500">
            Vire as cartas e encontre a letra bastão com sua forma cursiva!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-slate-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            Jogadas: <span className="font-mono text-amber-700">{moves}</span>
          </div>
          <button
            onClick={initGame}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Reiniciar jogo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {cards.map((card) => {
          const isRevealed = card.isFlipped || card.isMatched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={isRevealed}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 transform ${
                isRevealed
                  ? card.isMatched
                    ? 'bg-emerald-50 border-2 border-emerald-400 shadow-xs scale-95'
                    : 'bg-amber-50 border-2 border-amber-400 shadow-md rotate-0'
                  : 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              {isRevealed ? (
                <div className="flex flex-col items-center justify-center select-none">
                  {card.type === 'cursive' ? (
                    <span className="font-cursive text-5xl font-bold text-slate-800 leading-none">
                      {card.display}
                    </span>
                  ) : (
                    <span className="font-kids text-4xl font-bold text-slate-800 leading-none">
                      {card.display}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase">
                    {card.type === 'cursive' ? 'Cursiva' : 'Bastão'}
                  </span>
                </div>
              ) : (
                <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {isWon && (
        <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-300 text-center animate-in zoom-in-95">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-2" />
          <h3 className="text-xl font-kids font-bold text-slate-800 mb-1">
            Parabéns! Você encontrou todos os pares!
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Completado em {moves} jogadas!
          </p>
          <div className="flex justify-center gap-2 mb-4">
            <Star className="w-7 h-7 fill-amber-400 stroke-amber-500" />
            <Star className="w-7 h-7 fill-amber-400 stroke-amber-500" />
            <Star className="w-7 h-7 fill-amber-400 stroke-amber-500" />
          </div>
          <button
            onClick={initGame}
            className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-kids font-bold shadow-md transition-colors"
          >
            Jogar Novamente
          </button>
        </div>
      )}
    </div>
  );
};
