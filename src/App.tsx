/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CURSIVE_LETTERS } from './data/letters';
import {
  CursiveLetterData,
  LetterCategory,
  PedagogicalFamily,
  PenTool,
  GameTab,
} from './types/game';
import { Navbar } from './components/Navbar';
import { LetterSelector } from './components/LetterSelector';
import { CursiveCanvas } from './components/CursiveCanvas';
import { ProgressBar } from './components/ProgressBar';
import { Toolbox } from './components/Toolbox';
import { VictoryModal } from './components/VictoryModal';
import { RecognitionGame } from './components/RecognitionGame';
import { MemoryGame } from './components/MemoryGame';
import { FreeCanvas } from './components/FreeCanvas';
import { StickerAlbum } from './components/StickerAlbum';
import { audio } from './utils/audio';
import { ChevronLeft, ChevronRight, Volume2, Sparkles, BookOpen } from 'lucide-react';

const STORAGE_KEY_STARS = 'traco_magico_stars';
const STORAGE_KEY_SCORE = 'traco_magico_score';

export default function App() {
  // Navigation & Category states
  const [currentTab, setCurrentTab] = useState<GameTab>('tracing');
  const [activeCategory, setActiveCategory] = useState<LetterCategory>('lower');
  const [selectedFamily, setSelectedFamily] = useState<PedagogicalFamily | 'all'>('all');
  const [selectedLetter, setSelectedLetter] = useState<CursiveLetterData>(CURSIVE_LETTERS[0]);

  // Scoring & Stars persistence
  const [starsMap, setStarsMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STARS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [totalScore, setTotalScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCORE);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [isMuted, setIsMuted] = useState(false);

  // Drawing Tools
  const [currentTool, setCurrentTool] = useState<PenTool>('pencil');
  const [strokeWidth, setStrokeWidth] = useState(12);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [isDemonstrating, setIsDemonstrating] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);

  // Live Tracing Progress
  const [progress, setProgress] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [activeStars, setActiveStars] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('Toque no ponto 1 para começar o traço!');

  // Victory modal state
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [earnedStars, setEarnedStars] = useState(1);
  const [earnedAccuracy, setEarnedAccuracy] = useState(100);

  // Sync mute state with sound engine
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audio.isMuted = nextMute;
  };

  // Switch letter
  const handleSelectLetter = (letter: CursiveLetterData) => {
    setSelectedLetter(letter);
    setIsDemonstrating(false);
    setProgress(0);
    setActiveStars(0);
    setClearTrigger((c) => c + 1);
  };

  // Next and Previous letter navigation
  const currentIndex = CURSIVE_LETTERS.findIndex((l) => l.id === selectedLetter.id);
  const handleNextLetter = () => {
    const nextIdx = (currentIndex + 1) % CURSIVE_LETTERS.length;
    handleSelectLetter(CURSIVE_LETTERS[nextIdx]);
    setIsVictoryOpen(false);
  };

  const handlePrevLetter = () => {
    const prevIdx = (currentIndex - 1 + CURSIVE_LETTERS.length) % CURSIVE_LETTERS.length;
    handleSelectLetter(CURSIVE_LETTERS[prevIdx]);
  };

  // Live progress updates during stroke drawing
  const handleProgressUpdate = (
    prog: number,
    acc: number,
    stars: number,
    message: string
  ) => {
    setProgress(prog);
    setAccuracy(acc);
    setActiveStars(stars);
    setFeedbackMessage(message);
  };

  // Tracing completed
  const handleComplete = (finalStars: number, finalAccuracy: number) => {
    setEarnedStars(finalStars);
    setEarnedAccuracy(finalAccuracy);
    setIsVictoryOpen(true);

    // Save star rating (only upgrade or maintain)
    setStarsMap((prev) => {
      const prevStars = prev[selectedLetter.id] || 0;
      if (finalStars > prevStars) {
        const updated = { ...prev, [selectedLetter.id]: finalStars };
        try {
          localStorage.setItem(STORAGE_KEY_STARS, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      }
      return prev;
    });

    // Award score points
    const pointsAwarded = finalStars * 100;
    setTotalScore((prev) => {
      const nextScore = prev + pointsAwarded;
      try {
        localStorage.setItem(STORAGE_KEY_SCORE, nextScore.toString());
      } catch {
        // Ignore
      }
      return nextScore;
    });
  };

  const totalStarsCount = Object.values(starsMap).reduce((acc, s) => acc + s, 0);
  const completedLettersCount = Object.keys(starsMap).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/60 via-amber-50/30 to-orange-50/30 font-kids text-slate-800">
      {/* Top Bar adhering strictly to contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        totalStars={totalStarsCount}
        totalScore={totalScore}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {currentTab === 'tracing' && (
          <div className="space-y-4">
            {/* Letter Selector Grid */}
            <LetterSelector
              letters={CURSIVE_LETTERS}
              selectedLetterId={selectedLetter.id}
              onSelectLetter={handleSelectLetter}
              starsMap={starsMap}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              selectedFamily={selectedFamily}
              onSelectFamily={setSelectedFamily}
            />

            {/* Active Letter Pedagogical Tip Banner */}
            <div className="max-w-xl mx-auto bg-white/95 rounded-2xl p-3.5 border border-amber-200/90 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePrevLetter}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Letra anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-kids font-bold text-base text-slate-800">
                      {selectedLetter.title}
                    </span>
                    <span className="text-xs text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-medium">
                      {selectedLetter.familyName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    {selectedLetter.tip}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() =>
                    audio.speak(
                      `${selectedLetter.char}. ${selectedLetter.wordExample}. ${selectedLetter.tip}`
                    )
                  }
                  className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                  title="Ouvir instrução da letra"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleNextLetter}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Próxima letra"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real-time Progress Bar with Stars System (User Request) */}
            <ProgressBar
              progress={progress}
              accuracyScore={accuracy}
              activeStarCount={activeStars}
              feedbackMessage={feedbackMessage}
            />

            {/* Interactive Tracing Canvas */}
            <CursiveCanvas
              letter={selectedLetter}
              tool={currentTool}
              strokeWidth={strokeWidth}
              showGuidelines={showGuidelines}
              onProgressUpdate={handleProgressUpdate}
              onComplete={handleComplete}
              isDemonstrating={isDemonstrating}
              onStopDemonstrating={() => setIsDemonstrating(false)}
              clearTrigger={clearTrigger}
            />

            {/* Pen Toolbox & Interactive Controls */}
            <Toolbox
              currentTool={currentTool}
              onSelectTool={setCurrentTool}
              strokeWidth={strokeWidth}
              onSelectStrokeWidth={setStrokeWidth}
              onDemonstrate={() => {
                setIsDemonstrating(true);
                audio.speak(`Observe como traçamos a ${selectedLetter.title}`);
              }}
              isDemonstrating={isDemonstrating}
              onClear={() => {
                setClearTrigger((c) => c + 1);
                setProgress(0);
                setActiveStars(0);
                audio.playPop(0.9);
              }}
              onSpeak={() =>
                audio.speak(
                  `${selectedLetter.char}, de ${selectedLetter.wordExample}`
                )
              }
              showGuidelines={showGuidelines}
              onToggleGuidelines={() => setShowGuidelines((g) => !g)}
            />
          </div>
        )}

        {currentTab === 'recognition' && <RecognitionGame />}

        {currentTab === 'memory' && <MemoryGame />}

        {currentTab === 'freehand' && <FreeCanvas />}

        {currentTab === 'stickers' && (
          <StickerAlbum
            totalStars={totalStarsCount}
            completedLettersCount={completedLettersCount}
          />
        )}
      </main>

      {/* Victory / Reward Modal */}
      <VictoryModal
        isOpen={isVictoryOpen}
        letterTitle={selectedLetter.title}
        char={selectedLetter.char}
        wordExample={selectedLetter.wordExample}
        wordImageEmoji={selectedLetter.wordImageEmoji}
        stars={earnedStars}
        accuracy={earnedAccuracy}
        onRetry={() => {
          setIsVictoryOpen(false);
          setClearTrigger((c) => c + 1);
          setProgress(0);
          setActiveStars(0);
        }}
        onNext={handleNextLetter}
        onClose={() => setIsVictoryOpen(false)}
      />

      {/* Subtle footer */}
      <footer className="mt-auto py-4 text-center text-xs text-slate-400 border-t border-amber-200/50">
        <span>Traço Mágico · Caligrafia Infantil Cursiva Interativa</span>
      </footer>
    </div>
  );
}
