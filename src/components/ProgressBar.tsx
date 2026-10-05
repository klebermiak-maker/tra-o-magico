import React from 'react';
import { Star, Sparkles } from 'lucide-react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  accuracyScore: number; // 0 to 100
  activeStarCount: number; // 0 to 3
  feedbackMessage?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  activeStarCount,
  feedbackMessage,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-2">
      {/* Upper status and Stars */}
      <div className="flex items-center justify-between mb-1.5 text-sm font-medium">
        <div className="flex items-center gap-1.5 text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="font-kids font-semibold text-slate-800">
            {feedbackMessage || (progress === 0 ? 'Comece no ponto 1!' : progress < 100 ? 'Continue o traço...' : 'Muito bem!')}
          </span>
        </div>

        {/* 3 Stars Progress checkpoints */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((starNum) => {
            const isEarned = starNum <= activeStarCount;
            return (
              <div
                key={starNum}
                className={`transition-all duration-300 transform ${
                  isEarned ? 'scale-110 text-amber-400' : 'text-slate-200'
                }`}
              >
                <Star
                  className={`w-6 h-6 ${
                    isEarned
                      ? 'fill-amber-400 stroke-amber-500 filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.4)]'
                      : 'stroke-slate-300'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Track Bar */}
      <div className="relative w-full h-4 bg-amber-100/80 rounded-full overflow-hidden p-0.5 shadow-inner border border-amber-200/70">
        {/* Animated Fill Gradient */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 transition-all duration-150 ease-out shadow-sm relative overflow-hidden"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {/* Shimmer light effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
        </div>

        {/* Milestone Tick Marks */}
        <div className="absolute inset-0 flex justify-between px-3 pointer-events-none items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-xs" style={{ left: '33%' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-xs" style={{ left: '66%' }} />
        </div>
      </div>

      {/* Percentage text */}
      <div className="flex justify-between items-center mt-1 text-xs text-slate-500 font-medium">
        <span>Início</span>
        <span className="font-mono font-semibold text-slate-600">{Math.round(progress)}%</span>
        <span>Conclusão</span>
      </div>
    </div>
  );
};
