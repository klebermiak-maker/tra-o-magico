export type LetterCategory = 'lower' | 'upper' | 'words';

export type PedagogicalFamily = 
  | 'onda'      // Família da Onda do Mar (c, a, o, d, g, q)
  | 'laco'      // Família do Laço (e, l, b, f, h, k)
  | 'montanha'  // Família dos Pulinhos (m, n, u, v, w, y)
  | 'ioio'      // Família do Ioiô / Vai-e-Vem (i, j, t, p, r, s, z, x)
  | 'maiuscula' // Letras Maiúsculas Elegantes
  | 'palavras'; // Palavras Conectadas

export interface StrokePoint {
  x: number;
  y: number;
}

export interface DirectionArrow {
  x: number;
  y: number;
  angle: number; // degrees
}

export interface LetterStroke {
  id: number;
  path: string; // SVG path command
  points: StrokePoint[]; // Dense checkpoints along curve
  arrows?: DirectionArrow[];
  startPoint: StrokePoint;
  startLabel: string;
}

export interface CursiveLetterData {
  id: string;
  char: string;
  displayChar: string; // Print block equivalent (letra bastão)
  title: string;
  category: LetterCategory;
  family: PedagogicalFamily;
  familyName: string;
  tip: string;
  wordExample: string;
  wordImageEmoji: string;
  viewBox: { width: number; height: number };
  baselineY: number;
  midlineY: number;
  toplineY: number;
  bottomlineY: number;
  strokes: LetterStroke[];
}

export type PenTool = 'pencil' | 'rainbow' | 'glitter' | 'gold';

export interface UserProgress {
  starsByLetter: Record<string, number>; // letterId -> 1, 2, or 3
  completedCount: number;
  stickersUnlocked: string[];
  totalScore: number;
}

export type GameTab = 'tracing' | 'recognition' | 'memory' | 'freehand' | 'stickers';
