import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CURSIVE_LETTERS } from '../data/letters';
import { CursiveLetterData } from '../types/game';
import { audio } from '../utils/audio';
import { samplePathPoints, getDistance } from '../utils/pathHelper';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  RotateCcw,
  Volume2,
  Star,
  Timer,
  Flame,
  Zap,
  ArrowRight,
  Heart,
  Pencil,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type GameMode = 'classic' | 'timed';
type TimedChallengeType = 'recognition' | 'family' | 'quick-trace';

interface TimedQuestion {
  id: string;
  type: TimedChallengeType;
  prompt: string;
  targetChar: string;
  targetEmoji?: string;
  letterData?: CursiveLetterData;
  options: {
    char: string;
    isCorrect: boolean;
    familyDesc?: string;
  }[];
  explanation: string;
}

interface LevelConfig {
  level: number;
  name: string;
  badge: string;
  timePerQuestion: number; // in seconds
  questionsToAdvance: number;
  allowQuickTrace: boolean;
  choicesCount: number;
}

const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    name: 'Aprendiz Curioso',
    badge: '🐣',
    timePerQuestion: 15,
    questionsToAdvance: 4,
    allowQuickTrace: false,
    choicesCount: 3,
  },
  {
    level: 2,
    name: 'Calígrafo Júnior',
    badge: '🚀',
    timePerQuestion: 12,
    questionsToAdvance: 5,
    allowQuickTrace: true,
    choicesCount: 3,
  },
  {
    level: 3,
    name: 'Detetive das Curvas',
    badge: '🔍',
    timePerQuestion: 10,
    questionsToAdvance: 5,
    allowQuickTrace: true,
    choicesCount: 4,
  },
  {
    level: 4,
    name: 'Mestre da Caneta',
    badge: '⚡',
    timePerQuestion: 8,
    questionsToAdvance: 6,
    allowQuickTrace: true,
    choicesCount: 4,
  },
  {
    level: 5,
    name: 'Relâmpago Dourado',
    badge: '👑',
    timePerQuestion: 6,
    questionsToAdvance: 6,
    allowQuickTrace: true,
    choicesCount: 4,
  },
];

const CLASSIC_QUESTIONS = [
  {
    id: 1,
    prompt: 'Encontre a LETRA CURSIVA que corresponde à letra bastão:',
    targetChar: 'A',
    targetEmoji: '🐝',
    options: [
      { char: 'a', isCorrect: true },
      { char: 'o', isCorrect: false },
      { char: 'c', isCorrect: false },
    ],
    explanation: 'Muito bem! A letra "a" cursiva tem a redondinha e a perninha!',
  },
  {
    id: 2,
    prompt: 'Qual destas letras faz parte da FAMÍLIA DA ONDA DO MAR (sobe, volta e fecha)?',
    targetChar: '🌊',
    options: [
      { char: 'e', isCorrect: false, familyDesc: 'Família do Laço' },
      { char: 'c', isCorrect: true, familyDesc: 'Família da Onda' },
      { char: 'm', isCorrect: false, familyDesc: 'Família das Montanhas' },
    ],
    explanation: 'A letra "c" começa com a crista da onda e volta na mesma linha!',
  },
  {
    id: 3,
    prompt: 'Qual letra cursiva tem um LAÇO ALTO que sobe até o céu azul?',
    targetChar: '🎀',
    options: [
      { char: 'l', isCorrect: true },
      { char: 'e', isCorrect: false },
      { char: 'u', isCorrect: false },
    ],
    explanation: 'A letra "l" tem um laço longo e elegante que vai até o alto!',
  },
  {
    id: 4,
    prompt: 'Qual letra cursiva tem a cauda que DESCE LÁ NO PORÃO (linha verde)?',
    targetChar: '🐱',
    options: [
      { char: 'a', isCorrect: false },
      { char: 'g', isCorrect: true },
      { char: 'd', isCorrect: false },
    ],
    explanation: 'O gato tem rabo longo! A letra "g" desce abaixo da linha vermelha e cruza!',
  },
  {
    id: 5,
    prompt: 'Qual destas letras tem TRÊS MONTANHAS ou pulinhos redondos?',
    targetChar: '⛰️',
    options: [
      { char: 'n', isCorrect: false, familyDesc: 'Duas montanhas' },
      { char: 'm', isCorrect: true, familyDesc: 'Três montanhas' },
      { char: 'u', isCorrect: false, familyDesc: 'Canoa invertida' },
    ],
    explanation: 'A letra "m" pula três montanhas: 1, 2 e 3!',
  },
  {
    id: 6,
    prompt: 'Encontre a LETRA CURSIVA que corresponde à letra bastão:',
    targetChar: 'O',
    targetEmoji: '🐑',
    options: [
      { char: 'a', isCorrect: false },
      { char: 'o', isCorrect: true },
      { char: 'u', isCorrect: false },
    ],
    explanation: 'A letra "o" tem a bolinha fechada e o charmoso chapeuzinho!',
  },
  {
    id: 7,
    prompt: 'Qual letra cursiva tem um PINHO ou PONTO no alto?',
    targetChar: '🪀',
    options: [
      { char: 't', isCorrect: false },
      { char: 'i', isCorrect: true },
      { char: 'l', isCorrect: false },
    ],
    explanation: 'O "i" sobe reto, desce no mesmo lugar e ganha um pinguinho!',
  },
  {
    id: 8,
    prompt: 'Encontre a palavra conectada escrita em cursiva:',
    targetChar: 'SOL ☀️',
    options: [
      { char: 'sol', isCorrect: true },
      { char: 'lua', isCorrect: false },
      { char: 'paz', isCorrect: false },
    ],
    explanation: 'Olha que lindo o s, o o e o l conectados sem tirar a mão!',
  },
];

export const RecognitionGame: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('timed');

  // Classic Mode States
  const [classicIdx, setClassicIdx] = useState(0);
  const [classicScore, setClassicScore] = useState(0);
  const [classicSelected, setClassicSelected] = useState<number | null>(null);
  const [classicAnswered, setClassicAnswered] = useState(false);
  const [classicFinished, setClassicFinished] = useState(false);

  // Timed Challenge States
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const currentConfig = LEVEL_CONFIGS[currentLevelIdx];
  const [timedScore, setTimedScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctInLevel, setCorrectInLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(currentConfig.timePerQuestion);
  const [isTimeBonusActive, setIsTimeBonusActive] = useState(false);
  const [isTimedActive, setIsTimedActive] = useState(false);
  const [isLevelCleared, setIsLevelCleared] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentTimedQuestion, setCurrentTimedQuestion] = useState<TimedQuestion | null>(null);
  const [timedSelectedOption, setTimedSelectedOption] = useState<number | null>(null);
  const [isTimedAnswered, setIsTimedAnswered] = useState(false);

  // Quick Trace Canvas state for timed mode
  const quickCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [quickTraceProgress, setQuickTraceProgress] = useState(0);
  const isTracingRef = useRef(false);
  const traceCheckpointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const reachedCheckpointRef = useRef(0);

  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generator for dynamic timed questions based on current level
  const generateTimedQuestion = useCallback((levelCfg: LevelConfig): TimedQuestion => {
    // 25% chance of quick trace if level allows it and not level 1
    const shouldDoQuickTrace = levelCfg.allowQuickTrace && Math.random() < 0.35;

    if (shouldDoQuickTrace) {
      // Pick a friendly letter for quick tracing
      const simpleLetters = CURSIVE_LETTERS.filter((l) => l.category === 'lower' && l.strokes.length === 1);
      const chosen = simpleLetters[Math.floor(Math.random() * simpleLetters.length)] || CURSIVE_LETTERS[0];

      return {
        id: `trace-${Date.now()}`,
        type: 'quick-trace',
        prompt: `⚡ Desafio Relâmpago: Trace a letra cursiva antes do tempo acabar!`,
        targetChar: chosen.char,
        targetEmoji: chosen.wordImageEmoji,
        letterData: chosen,
        options: [],
        explanation: `Excelente! Você traçou a letra ${chosen.char} no ritmo relâmpago!`,
      };
    }

    // Otherwise, generate recognition question
    const allLetterPool = [...CURSIVE_LETTERS];
    const correctLetter = allLetterPool[Math.floor(Math.random() * allLetterPool.length)];

    // Family question or Print-to-Cursive question
    const isFamilyQuestion = Math.random() > 0.6;

    if (isFamilyQuestion && correctLetter.family !== 'palavras') {
      const familyPrompts: Record<string, string> = {
        onda: 'Qual destas letras faz parte da FAMÍLIA DA ONDA DO MAR (sobe, volta e fecha)? 🌊',
        laco: 'Qual destas letras tem um LAÇO ALTO que sobe até o céu? 🎀',
        montanha: 'Qual destas letras pula MONTANHAS redondinhas? ⛰️',
        ioio: 'Qual destas letras é da família do IOIÔ / VAI-E-VEM? 🪀',
        maiuscula: 'Qual destas letras é uma MAIÚSCULA elegante? 👑',
      };

      const promptText = familyPrompts[correctLetter.family] || 'Encontre a forma correta da letra:';

      // Pick distractor letters from DIFFERENT families
      const otherLetters = allLetterPool.filter((l) => l.family !== correctLetter.family && l.id !== correctLetter.id);
      const shuffledOthers = otherLetters.sort(() => Math.random() - 0.5).slice(0, levelCfg.choicesCount - 1);

      const options = [
        { char: correctLetter.char, isCorrect: true, familyDesc: correctLetter.familyName },
        ...shuffledOthers.map((o) => ({ char: o.char, isCorrect: false, familyDesc: o.familyName })),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `family-${Date.now()}`,
        type: 'family',
        prompt: promptText,
        targetChar: correctLetter.displayChar,
        targetEmoji: correctLetter.wordImageEmoji,
        options,
        explanation: `Muito bem! A letra "${correctLetter.char}" pertence à ${correctLetter.familyName}!`,
      };
    } else {
      // Print letter to cursive match
      const otherLetters = allLetterPool.filter((l) => l.id !== correctLetter.id);
      const shuffledOthers = otherLetters.sort(() => Math.random() - 0.5).slice(0, levelCfg.choicesCount - 1);

      const options = [
        { char: correctLetter.char, isCorrect: true },
        ...shuffledOthers.map((o) => ({ char: o.char, isCorrect: false })),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `print-${Date.now()}`,
        type: 'recognition',
        prompt: `Encontre a LETRA CURSIVA que corresponde a:`,
        targetChar: correctLetter.displayChar,
        targetEmoji: correctLetter.wordImageEmoji,
        options,
        explanation: `Parabéns! "${correctLetter.char}" é a forma cursiva de "${correctLetter.displayChar}"!`,
      };
    }
  }, []);

  // Prepare quick-trace canvas checkpoints whenever a quick trace question loads
  const initQuickTrace = useCallback((letter: CursiveLetterData) => {
    if (!letter.strokes[0]) return;
    const sampled = samplePathPoints(letter.strokes[0].path, 30);
    traceCheckpointsRef.current = sampled.points;
    reachedCheckpointRef.current = 0;
    setQuickTraceProgress(0);

    const canvas = quickCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Start timed challenge game
  const startTimedGame = () => {
    setCurrentLevelIdx(0);
    setTimedScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setCorrectInLevel(0);
    setIsLevelCleared(false);
    setIsGameOver(false);
    setIsTimedAnswered(false);
    setTimedSelectedOption(null);

    const q = generateTimedQuestion(LEVEL_CONFIGS[0]);
    setCurrentTimedQuestion(q);
    setTimeLeft(LEVEL_CONFIGS[0].timePerQuestion);
    setIsTimedActive(true);

    if (q.type === 'quick-trace' && q.letterData) {
      setTimeout(() => initQuickTrace(q.letterData!), 50);
    }
  };

  // Next timed question within current level or level advance
  const nextTimedQuestion = useCallback(() => {
    setIsTimedAnswered(false);
    setTimedSelectedOption(null);
    setIsTimeBonusActive(false);

    const nextCorrect = correctInLevel + 1;
    setCorrectInLevel(nextCorrect);

    if (nextCorrect >= currentConfig.questionsToAdvance) {
      // Level cleared!
      if (currentLevelIdx + 1 < LEVEL_CONFIGS.length) {
        setIsLevelCleared(true);
        audio.playSuccessFanfare();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        audio.speak(`Parabéns! Nível ${currentLevelIdx + 1} completado!`);
      } else {
        // Beat all 5 levels!
        setIsGameOver(true);
        audio.playSuccessFanfare();
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
        audio.speak('Incrível! Você conquistou o troféu do Relâmpago Dourado!');
      }
      return;
    }

    const q = generateTimedQuestion(currentConfig);
    setCurrentTimedQuestion(q);
    setTimeLeft(currentConfig.timePerQuestion);

    if (q.type === 'quick-trace' && q.letterData) {
      setTimeout(() => initQuickTrace(q.letterData!), 50);
    }
  }, [correctInLevel, currentConfig, currentLevelIdx, generateTimedQuestion, initQuickTrace]);

  // Advance to next level after level cleared modal
  const advanceToNextLevel = () => {
    const nextLevelIdx = currentLevelIdx + 1;
    setCurrentLevelIdx(nextLevelIdx);
    setCorrectInLevel(0);
    setIsLevelCleared(false);
    setIsTimedAnswered(false);
    setTimedSelectedOption(null);

    const newCfg = LEVEL_CONFIGS[nextLevelIdx];
    const q = generateTimedQuestion(newCfg);
    setCurrentTimedQuestion(q);
    setTimeLeft(newCfg.timePerQuestion);

    if (q.type === 'quick-trace' && q.letterData) {
      setTimeout(() => initQuickTrace(q.letterData!), 50);
    }

    audio.speak(`Nível ${nextLevelIdx + 1}: ${newCfg.name}!`);
  };

  // Handle wrong answer or timeout
  const handleMistakeOrTimeout = useCallback(
    (reason: 'timeout' | 'wrong') => {
      audio.playError();
      setCombo(0);

      const nextLives = lives - 1;
      setLives(nextLives);

      if (reason === 'timeout') {
        audio.speak('O tempo acabou! Fique atento!');
      } else {
        audio.speak('Ops, tente observar com mais calma!');
      }

      if (nextLives <= 0) {
        setIsGameOver(true);
        setIsTimedActive(false);
      } else {
        // Load next question with new time
        setTimeout(() => {
          setIsTimedAnswered(false);
          setTimedSelectedOption(null);
          const q = generateTimedQuestion(currentConfig);
          setCurrentTimedQuestion(q);
          setTimeLeft(currentConfig.timePerQuestion);
          if (q.type === 'quick-trace' && q.letterData) {
            setTimeout(() => initQuickTrace(q.letterData!), 50);
          }
        }, 1000);
      }
    },
    [currentConfig, generateTimedQuestion, initQuickTrace, lives]
  );

  // Timer loop for timed mode
  useEffect(() => {
    if (!isTimedActive || isLevelCleared || isGameOver || isTimedAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleMistakeOrTimeout('timeout');
          return 0;
        }

        // Warning tick on last 3 seconds
        if (prev <= 4) {
          audio.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimedActive, isLevelCleared, isGameOver, isTimedAnswered, handleMistakeOrTimeout]);

  // Timed option click
  const handleTimedSelect = (optionIdx: number) => {
    if (isTimedAnswered || !currentTimedQuestion) return;

    setTimedSelectedOption(optionIdx);
    setIsTimedAnswered(true);

    const isCorrect = currentTimedQuestion.options[optionIdx].isCorrect;

    if (isCorrect) {
      // Calculate score with combo multiplier
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const basePoints = 120 + currentConfig.level * 30;
      const comboMultiplier = Math.min(3, 1 + (nextCombo - 1) * 0.25);
      const earned = Math.round(basePoints * comboMultiplier);

      setTimedScore((s) => s + earned);

      // Add time bonus (+3s)
      setTimeLeft((t) => Math.min(currentConfig.timePerQuestion + 4, t + 3));
      setIsTimeBonusActive(true);

      audio.playBonus();
      audio.speak('Certo! Muito rápido!');

      // Auto advance smoothly after 750ms
      setTimeout(() => {
        nextTimedQuestion();
      }, 750);
    } else {
      handleMistakeOrTimeout('wrong');
    }
  };

  // Quick-trace interactive touch/drag handler
  const handleQuickTraceMove = (clientX: number, clientY: number) => {
    if (!isTracingRef.current || isTimedAnswered || !currentTimedQuestion?.letterData) return;

    const canvas = quickCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 400;
    const y = ((clientY - rect.top) / rect.height) * 300;

    const pts = traceCheckpointsRef.current;
    const currentTarget = pts[reachedCheckpointRef.current];

    if (currentTarget) {
      const dist = getDistance({ x, y }, currentTarget);
      if (dist < 45) {
        reachedCheckpointRef.current++;
        const prog = Math.round((reachedCheckpointRef.current / pts.length) * 100);
        setQuickTraceProgress(prog);

        if (reachedCheckpointRef.current % 4 === 0) {
          audio.playCheckpoint(reachedCheckpointRef.current, pts.length);
        }

        // Draw active user line on canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }

        // Check if finished quick trace
        if (reachedCheckpointRef.current >= pts.length) {
          isTracingRef.current = false;
          setIsTimedAnswered(true);

          const nextCombo = combo + 1;
          setCombo(nextCombo);
          if (nextCombo > maxCombo) setMaxCombo(nextCombo);

          const earned = 200 + currentConfig.level * 40;
          setTimedScore((s) => s + earned);

          setTimeLeft((t) => Math.min(currentConfig.timePerQuestion + 4, t + 4));
          setIsTimeBonusActive(true);

          audio.playSuccessFanfare();
          audio.speak('Traçado relâmpago perfeito!');

          setTimeout(() => {
            nextTimedQuestion();
          }, 850);
        }
      }
    }
  };

  // CLASSIC MODE HANDLERS
  const currentClassicQ = CLASSIC_QUESTIONS[classicIdx];
  const classicProgress = Math.round(((classicIdx + 1) / CLASSIC_QUESTIONS.length) * 100);

  const handleClassicSelect = (optionIdx: number) => {
    if (classicAnswered) return;
    setClassicSelected(optionIdx);
    setClassicAnswered(true);

    const isCorrect = currentClassicQ.options[optionIdx].isCorrect;
    if (isCorrect) {
      setClassicScore((prev) => prev + 100);
      audio.playStar(2);
      audio.speak('Muito bem! Resposta certa!');
    } else {
      audio.playError();
      audio.speak('Ops, tente observar os detalhes das curvas!');
    }
  };

  const handleClassicNext = () => {
    if (classicIdx + 1 < CLASSIC_QUESTIONS.length) {
      setClassicIdx((prev) => prev + 1);
      setClassicSelected(null);
      setClassicAnswered(false);
    } else {
      setClassicFinished(true);
      audio.playSuccessFanfare();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleClassicRestart = () => {
    setClassicIdx(0);
    setClassicScore(0);
    setClassicSelected(null);
    setClassicAnswered(false);
    setClassicFinished(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border border-amber-200 shadow-sm">
      {/* Mode Switcher Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 pb-4 border-b border-amber-100">
        <div>
          <h2 className="text-xl font-kids font-bold text-slate-800 flex items-center gap-2">
            <span>Reconhecimento & Desafio</span>
            {gameMode === 'timed' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full animate-pulse">
                <Timer className="w-3.5 h-3.5" />
                Cronometrado
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            {gameMode === 'timed'
              ? 'Identifique a letra ou complete o traçado relâmpago antes do tempo acabar!'
              : 'Descubra as formas, famílias e laços das letras cursivas no seu próprio tempo.'}
          </p>
        </div>

        {/* Mode Selector Segmented Controls */}
        <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-2xl border border-amber-200">
          <button
            onClick={() => {
              setGameMode('timed');
              audio.playPop(1.1);
              if (!isTimedActive) startTimedGame();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-kids font-semibold transition-all cursor-pointer ${
              gameMode === 'timed'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Desafio Cronometrado</span>
          </button>
          <button
            onClick={() => {
              setGameMode('classic');
              audio.playPop(1);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-kids font-semibold transition-all cursor-pointer ${
              gameMode === 'classic'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Modo Relaxado</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TIMED CHALLENGE MODE INTERFACE */}
      {/* ========================================================= */}
      {gameMode === 'timed' && (
        <div>
          {!isTimedActive && !isGameOver && !isLevelCleared && (
            <div className="text-center py-8 px-4 bg-gradient-to-b from-amber-50/80 to-orange-50/50 rounded-3xl border-2 border-amber-200">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-amber-400 text-white flex items-center justify-center shadow-lg transform -rotate-3 animate-pulse">
                <Zap className="w-10 h-10 fill-current" />
              </div>

              <h3 className="text-2xl font-kids font-bold text-slate-800 mb-2">
                Desafio Cronometrado de Caligrafia!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                Mostre sua rapidez! Identifique as formas cursivas e complete mini-traçados relâmpagos antes do cronômetro zerar. Conquiste 5 níveis de dificuldade crescente!
              </p>

              {/* Levels preview */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {LEVEL_CONFIGS.map((cfg, idx) => (
                  <div
                    key={cfg.level}
                    className="p-2.5 rounded-2xl bg-white border border-amber-200 text-xs font-kids flex items-center gap-2 shadow-2xs"
                  >
                    <span className="text-lg">{cfg.badge}</span>
                    <div className="text-left">
                      <div className="font-bold text-slate-800">Nível {cfg.level}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{cfg.timePerQuestion}s por rodada</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={startTimedGame}
                className="inline-flex items-center gap-2 py-3.5 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-kids font-bold text-base shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <PlayIcon className="w-5 h-5 fill-current" />
                Começar Desafio Agora!
              </button>
            </div>
          )}

          {isTimedActive && !isGameOver && !isLevelCleared && currentTimedQuestion && (
            <div>
              {/* Timed HUD Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-amber-50/80 rounded-2xl border border-amber-200">
                {/* Level badge */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentConfig.badge}</span>
                  <div>
                    <div className="text-xs font-kids font-bold text-slate-800">
                      Nível {currentConfig.level}: {currentConfig.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Acertos: {correctInLevel} / {currentConfig.questionsToAdvance}
                    </div>
                  </div>
                </div>

                {/* Lives ❤️ */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((heartIdx) => (
                    <Heart
                      key={heartIdx}
                      className={`w-5 h-5 transition-transform ${
                        heartIdx <= lives
                          ? 'fill-red-500 text-red-500 scale-100'
                          : 'fill-slate-200 text-slate-300 scale-90'
                      }`}
                    />
                  ))}
                </div>

                {/* Score & Combo */}
                <div className="flex items-center gap-3">
                  {combo > 1 && (
                    <div className="flex items-center gap-1 font-kids font-bold text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full animate-bounce">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>Combo x{combo}!</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 font-kids font-bold text-amber-700 bg-white px-3 py-1 rounded-xl border border-amber-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-mono">{timedScore}</span>
                    <span className="text-xs font-normal">pts</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Countdown Timer Bar */}
              <div className="relative mb-6">
                <div className="flex items-center justify-between text-xs font-kids font-semibold mb-1 text-slate-600">
                  <span className="flex items-center gap-1">
                    <Timer className={`w-3.5 h-3.5 ${timeLeft <= 3 ? 'text-red-500 animate-spin' : 'text-amber-500'}`} />
                    Tempo Restante:
                  </span>
                  <div className="flex items-center gap-2">
                    {isTimeBonusActive && (
                      <span className="text-emerald-600 font-bold animate-bounce text-xs">
                        +3s Bônus! ⏱️
                      </span>
                    )}
                    <span
                      className={`font-mono text-sm px-2 py-0.5 rounded-lg ${
                        timeLeft <= 3
                          ? 'bg-red-500 text-white animate-pulse font-bold'
                          : timeLeft <= 6
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                {/* Fluid countdown bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      timeLeft <= 3
                        ? 'bg-red-500'
                        : timeLeft <= 6
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    }`}
                    style={{
                      width: `${Math.min(100, (timeLeft / currentConfig.timePerQuestion) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* CHALLENGE DISPLAY: Quick Trace OR Multiple Choice */}
              {currentTimedQuestion.type === 'quick-trace' && currentTimedQuestion.letterData ? (
                /* QUICK TRACE CHALLENGE */
                <div className="bg-amber-50/70 rounded-3xl p-4 border-2 border-amber-300 text-center">
                  <div className="inline-flex items-center gap-1.5 bg-amber-200/80 text-amber-900 px-3 py-1 rounded-full text-xs font-kids font-bold mb-3">
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Traçado Relâmpago: Letra {currentTimedQuestion.targetChar}</span>
                  </div>

                  <p className="text-xs text-slate-600 mb-3">
                    Deslize rápido sobre as setinhas e complete a letra antes que o relógio pare!
                  </p>

                  {/* Quick Trace Canvas */}
                  <div
                    className="relative w-full aspect-[4/3] max-w-sm mx-auto rounded-2xl overflow-hidden shadow-inner border-2 border-amber-300 bg-[#FFFBEB] touch-none select-none cursor-crosshair"
                    onMouseDown={(e) => {
                      isTracingRef.current = true;
                      const canvas = quickCanvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 400;
                      const y = ((e.clientY - rect.top) / rect.height) * 300;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                      }
                      handleQuickTraceMove(e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => handleQuickTraceMove(e.clientX, e.clientY)}
                    onMouseUp={() => {
                      isTracingRef.current = false;
                    }}
                    onMouseLeave={() => {
                      isTracingRef.current = false;
                    }}
                    onTouchStart={(e) => {
                      if (e.touches.length > 0) {
                        isTracingRef.current = true;
                        const canvas = quickCanvasRef.current;
                        if (!canvas) return;
                        const rect = canvas.getBoundingClientRect();
                        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 400;
                        const y = ((e.touches[0].clientY - rect.top) / rect.height) * 300;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.beginPath();
                          ctx.moveTo(x, y);
                        }
                        handleQuickTraceMove(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (e.touches.length > 0) {
                        handleQuickTraceMove(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={() => {
                      isTracingRef.current = false;
                    }}
                  >
                    {/* SVG Guidelines and Ghost Letter */}
                    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Notebook lines */}
                      <line x1="0" y1="70" x2="400" y2="70" stroke="#60A5FA" strokeWidth="1.2" strokeDasharray="4 4" />
                      <line x1="0" y1="140" x2="400" y2="140" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6 4" />
                      <line x1="0" y1="210" x2="400" y2="210" stroke="#EF4444" strokeWidth="1.8" />
                      <line x1="0" y1="280" x2="400" y2="280" stroke="#34D399" strokeWidth="1.2" strokeDasharray="4 4" />

                      {/* Reference letter stroke */}
                      <path
                        d={currentTimedQuestion.letterData.strokes[0]?.path || ''}
                        fill="none"
                        stroke="#CBD5E1"
                        strokeWidth="18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="2 10"
                      />

                      {/* Start dot marker */}
                      <circle
                        cx={currentTimedQuestion.letterData.strokes[0]?.startPoint.x || 140}
                        cy={currentTimedQuestion.letterData.strokes[0]?.startPoint.y || 210}
                        r="12"
                        fill="#F59E0B"
                        className="animate-ping"
                      />
                      <circle
                        cx={currentTimedQuestion.letterData.strokes[0]?.startPoint.x || 140}
                        cy={currentTimedQuestion.letterData.strokes[0]?.startPoint.y || 210}
                        r="12"
                        fill="#F59E0B"
                      />
                    </svg>

                    <canvas
                      ref={quickCanvasRef}
                      width={400}
                      height={300}
                      className="absolute inset-0 w-full h-full"
                    />

                    {/* Progress indicator */}
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                      {quickTraceProgress}%
                    </div>
                  </div>
                </div>
              ) : (
                /* RECOGNITION CHALLENGE */
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-kids font-bold text-slate-800 mb-2 text-balance">
                      {currentTimedQuestion.prompt}
                    </h3>

                    {/* Target character showcase */}
                    <div className="inline-flex items-center justify-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl py-3 px-6 shadow-inner">
                      <span className="text-4xl font-kids font-bold text-slate-800">
                        {currentTimedQuestion.targetChar}
                      </span>
                      {currentTimedQuestion.targetEmoji && (
                        <span className="text-3xl">{currentTimedQuestion.targetEmoji}</span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic choices grid */}
                  <div
                    className={`grid gap-3 mb-6 ${
                      currentTimedQuestion.options.length === 4
                        ? 'grid-cols-2 sm:grid-cols-4'
                        : 'grid-cols-1 sm:grid-cols-3'
                    }`}
                  >
                    {currentTimedQuestion.options.map((opt, i) => {
                      const isSelected = timedSelectedOption === i;
                      let cardStyle =
                        'bg-white border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer';

                      if (isTimedAnswered) {
                        if (opt.isCorrect) {
                          cardStyle = 'bg-emerald-50 border-2 border-emerald-500 shadow-md text-emerald-800';
                        } else if (isSelected) {
                          cardStyle = 'bg-red-50 border-2 border-red-400 text-red-700';
                        } else {
                          cardStyle = 'bg-slate-50 border border-slate-200 opacity-40';
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleTimedSelect(i)}
                          disabled={isTimedAnswered}
                          className={`p-5 rounded-2xl flex flex-col items-center justify-center transition-all transform active:scale-95 ${cardStyle}`}
                        >
                          <span className="font-cursive text-5xl font-bold mb-1 select-none">
                            {opt.char}
                          </span>
                          {opt.familyDesc && (
                            <span className="text-[10px] text-slate-400 truncate max-w-full">
                              {opt.familyDesc}
                            </span>
                          )}
                          {isTimedAnswered && opt.isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 animate-bounce" />
                          )}
                          {isTimedAnswered && isSelected && !opt.isCorrect && (
                            <XCircle className="w-5 h-5 text-red-500 mt-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LEVEL CLEARED VICTORY SCREEN */}
          {isLevelCleared && (
            <div className="p-6 bg-amber-50/90 rounded-3xl border-3 border-amber-300 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center shadow-inner">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-kids font-bold text-slate-800 mb-1">
                Nível {currentConfig.level} Concluído! 🎉
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Excelente velocidade e precisão! Você dominou o nível <strong>{currentConfig.name}</strong>.
              </p>

              <div className="flex justify-center gap-4 mb-6">
                <div className="bg-white px-4 py-2 rounded-xl border border-amber-200">
                  <div className="text-xs text-slate-400 uppercase font-bold">Pontuação</div>
                  <div className="text-2xl font-kids font-bold text-amber-600">{timedScore} pts</div>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-amber-200">
                  <div className="text-xs text-slate-400 uppercase font-bold">Maior Combo</div>
                  <div className="text-2xl font-kids font-bold text-orange-500">🔥 x{maxCombo || 1}</div>
                </div>
              </div>

              <button
                onClick={advanceToNextLevel}
                className="inline-flex items-center gap-2 py-3 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-kids font-bold shadow-md transition-all cursor-pointer"
              >
                Próximo Nível: {LEVEL_CONFIGS[currentLevelIdx + 1]?.name}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* GAME OVER SCREEN */}
          {isGameOver && (
            <div className="p-6 bg-white rounded-3xl border-3 border-amber-300 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-kids font-bold text-slate-800 mb-1">
                {lives <= 0 ? 'Fim do Desafio!' : 'Mestre Supremo da Velocidade! 👑'}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {lives <= 0
                  ? 'Você foi muito longe! Treine mais um pouco para ser ainda mais rápido!'
                  : 'Parabéns! Você venceu todos os 5 níveis do Desafio Cronometrado!'}
              </p>

              <div className="flex justify-center gap-4 mb-6">
                <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-200">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Pontuação Final</div>
                  <div className="text-3xl font-kids font-bold text-amber-700">{timedScore} pts</div>
                </div>
                <div className="bg-orange-50 px-5 py-3 rounded-2xl border border-orange-200">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Nível Alcançado</div>
                  <div className="text-3xl font-kids font-bold text-orange-600">
                    {currentConfig.badge} {currentConfig.level}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={startTimedGame}
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-kids font-bold shadow-md transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Jogar Novamente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* CLASSIC RELAXED MODE INTERFACE */}
      {/* ========================================================= */}
      {gameMode === 'classic' && (
        <div>
          {classicFinished ? (
            <div className="p-6 bg-white rounded-3xl border-3 border-amber-300 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-kids font-bold text-slate-800 mb-2">
                Mestre do Reconhecimento!
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Você identificou as formas das letras cursivas com grande habilidade!
              </p>

              {/* Stars */}
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-10 h-10 ${
                      s <= (classicScore >= 700 ? 3 : classicScore >= 400 ? 2 : 1)
                        ? 'fill-amber-400 stroke-amber-500 animate-bounce'
                        : 'stroke-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl mb-6">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Pontuação
                </div>
                <div className="text-3xl font-kids font-bold text-amber-600">
                  {classicScore} Pontos
                </div>
              </div>

              <button
                onClick={handleClassicRestart}
                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-kids font-bold shadow-md transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Jogar Novamente
              </button>
            </div>
          ) : (
            <div>
              {/* Header bar with progress */}
              <div className="flex items-center justify-between mb-3 text-xs font-medium text-slate-500">
                <span>Pergunta {classicIdx + 1} de {CLASSIC_QUESTIONS.length}</span>
                <div className="flex items-center gap-1.5 font-kids font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{classicScore} pts</span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${classicProgress}%` }}
                />
              </div>

              {/* Prompt Card */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-kids font-bold text-slate-800 mb-3 text-balance">
                  {currentClassicQ.prompt}
                </h3>

                <div className="inline-flex items-center justify-center gap-3 bg-amber-50/80 border-2 border-amber-200 rounded-2xl py-4 px-8 shadow-inner">
                  <span className="text-5xl font-kids font-bold text-slate-800">
                    {currentClassicQ.targetChar}
                  </span>
                  {currentClassicQ.targetEmoji && (
                    <span className="text-4xl">{currentClassicQ.targetEmoji}</span>
                  )}
                </div>
              </div>

              {/* 3 Interactive Cards to Choose From */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {currentClassicQ.options.map((opt, i) => {
                  const isSelected = classicSelected === i;
                  let cardStyle =
                    'bg-white border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 cursor-pointer';

                  if (classicAnswered) {
                    if (opt.isCorrect) {
                      cardStyle = 'bg-emerald-50 border-2 border-emerald-500 shadow-md text-emerald-800';
                    } else if (isSelected) {
                      cardStyle = 'bg-red-50 border-2 border-red-400 text-red-700';
                    } else {
                      cardStyle = 'bg-slate-50 border border-slate-200 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleClassicSelect(i)}
                      disabled={classicAnswered}
                      className={`p-6 rounded-2xl flex flex-col items-center justify-center transition-all transform active:scale-95 ${cardStyle}`}
                    >
                      <span className="font-cursive text-6xl font-bold mb-2 select-none">
                        {opt.char}
                      </span>
                      <span className="text-xs font-kids font-semibold text-slate-500">
                        Opção {i + 1}
                      </span>
                      {classicAnswered && opt.isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-2 animate-bounce" />
                      )}
                      {classicAnswered && isSelected && !opt.isCorrect && (
                        <XCircle className="w-5 h-5 text-red-500 mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next Button */}
              {classicAnswered && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-sm font-kids text-slate-700">
                    <button
                      onClick={() => audio.speak(currentClassicQ.explanation)}
                      className="p-1.5 rounded-full hover:bg-amber-200 text-amber-700 cursor-pointer"
                      title="Ouvir explicação"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <span>{currentClassicQ.explanation}</span>
                  </div>
                  <button
                    onClick={handleClassicNext}
                    className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-kids font-semibold shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {classicIdx + 1 < CLASSIC_QUESTIONS.length ? 'Próxima ➔' : 'Ver Resultado 🏆'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
