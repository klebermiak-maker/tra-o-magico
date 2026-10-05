import React, { useEffect, useRef } from 'react';
import { Star, RotateCcw, ArrowRight, Volume2, Trophy, Award, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  letterTitle: string;
  char: string;
  wordExample: string;
  wordImageEmoji: string;
  stars: number; // 1 to 3
  accuracy: number;
  onRetry: () => void;
  onNext: () => void;
  onClose: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'star';
  wobble: number;
  wobbleSpeed: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  letterTitle,
  char,
  wordExample,
  wordImageEmoji,
  stars,
  accuracy,
  onRetry,
  onNext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Initial fanfare side-cannon bursts
    const fireCannons = () => {
      const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#FBBF24'];

      // Left blast
      confetti({
        particleCount: stars === 3 ? 50 : 30,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });

      // Right blast
      confetti({
        particleCount: stars === 3 ? 50 : 30,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      // Center star burst if 3 stars
      if (stars === 3) {
        setTimeout(() => {
          confetti({
            particleCount: 45,
            spread: 80,
            origin: { y: 0.4 },
            shapes: ['star'],
            colors: ['#F59E0B', '#FBBF24', '#FEF08A'],
          });
        }, 250);
      }
    };

    fireCannons();

    // Voice praise
    const praise =
      stars === 3
        ? `Perfeito! Você ganhou 3 estrelas na letra ${char}!`
        : `Muito bem! Letra ${char} completada com sucesso!`;
    audio.speak(praise);

    // 2. Continuous celebratory canvas particle overlay
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const palette = [
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#3B82F6', // Blue
      '#EC4899', // Pink
      '#8B5CF6', // Purple
      '#FBBF24', // Warm Gold
      '#06B6D4', // Cyan
    ];

    const particleCount = stars === 3 ? 65 : 45;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * -height, // start above screen
        vx: (Math.random() - 0.5) * 2.2,
        vy: 2.2 + Math.random() * 3.5,
        size: 7 + Math.random() * 8,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.12,
        shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'circle' : 'star',
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.06,
      });
    }

    const drawStar = (context: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
      const spikes = 5;
      const step = Math.PI / spikes;
      context.beginPath();
      for (let i = 0; i < 2 * spikes; i++) {
        const radius = i % 2 === 0 ? r : r / 2;
        const angle = i * step - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.2;
        p.y += p.vy;
        p.rotation += p.vRot;

        // Reset to top when passing bottom
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Flutter/3D perspective tilt
        ctx.scale(Math.cos(p.wobble), 1);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.size / 1.8);
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, stars, char]);

  if (!isOpen) return null;

  const titles = [
    '',
    'Bom Trabalho! ✨',
    'Muito Bem! ⭐',
    'Sensacional! 🌟 Perfeito!',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
      {/* Confetti Particle Effect Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full z-10"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-20 bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-amber-300 text-center transform transition-all animate-in zoom-in-95 duration-200">
        {/* Decorative Floating Sparkle Badges */}
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-md animate-bounce">
          <Sparkles className="w-4 h-4 fill-white" />
        </div>
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-400 text-white flex items-center justify-center shadow-md animate-bounce delay-150">
          <Star className="w-4 h-4 fill-white" />
        </div>

        {/* Top Trophy Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-500 mb-3 shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-kids font-bold text-slate-800 mb-1">
          {titles[stars] || 'Parabéns!'}
        </h2>

        <p className="text-sm text-slate-500 mb-5">
          Você completou o traçado da <span className="font-semibold text-slate-700">{letterTitle}</span>
        </p>

        {/* Big Cursive Character & Word Showcase */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl py-4 px-6 mb-6 flex items-center justify-center gap-4">
          <span className="font-cursive text-6xl text-slate-800 font-bold leading-none select-none">
            {char}
          </span>
          <div className="h-10 w-px bg-amber-200" />
          <div className="text-left">
            <div className="text-2xl">{wordImageEmoji}</div>
            <div className="text-sm font-kids font-medium text-slate-600">{wordExample}</div>
          </div>
          <button
            onClick={() => audio.speak(`${char}, de ${wordExample}`)}
            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-100 rounded-full transition-colors cursor-pointer"
            title="Ouvir som"
            aria-label="Ouvir som da letra"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Animated Gold Stars */}
        <div className="flex justify-center items-center gap-3 mb-4">
          {[1, 2, 3].map((starIdx) => {
            const isFilled = starIdx <= stars;
            return (
              <div
                key={starIdx}
                className={`transform transition-transform duration-500 ${
                  isFilled ? 'scale-110 text-amber-400 animate-bounce' : 'scale-90 text-slate-200'
                }`}
                style={{ animationDelay: `${starIdx * 150}ms` }}
              >
                <Star
                  className={`w-12 h-12 ${
                    isFilled
                      ? 'fill-amber-400 stroke-amber-500 drop-shadow-[0_4px_8px_rgba(245,158,11,0.5)]'
                      : 'stroke-slate-300'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Accuracy badge & score */}
        <div className="flex justify-center items-center gap-4 text-xs font-medium text-slate-600 mb-6">
          <span className="inline-flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            Precisão do traço: <strong>{accuracy}%</strong>
          </span>
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold">
            +{stars * 100} Pontos
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-slate-200 font-kids font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar de Novo
          </button>
          <button
            onClick={onNext}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-kids font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            Próxima Letra
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

