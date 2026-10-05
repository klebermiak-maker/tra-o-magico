import { StrokePoint, DirectionArrow } from '../types/game';

/**
 * Samples evenly spaced points and direction arrows from an SVG path string
 * Uses native SVGPathElement for mathematical accuracy
 */
export function samplePathPoints(
  pathData: string,
  sampleCount: number = 40
): { points: StrokePoint[]; arrows: DirectionArrow[]; totalLength: number } {
  if (typeof document === 'undefined') {
    return { points: [], arrows: [], totalLength: 0 };
  }

  try {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    const totalLength = path.getTotalLength();

    if (totalLength === 0) {
      return { points: [], arrows: [], totalLength: 0 };
    }

    const points: StrokePoint[] = [];
    const step = totalLength / (sampleCount - 1);

    for (let i = 0; i < sampleCount; i++) {
      const distance = Math.min(totalLength, i * step);
      const pt = path.getPointAtLength(distance);
      points.push({
        x: Math.round(pt.x * 10) / 10,
        y: Math.round(pt.y * 10) / 10,
      });
    }

    // Generate direction arrows at 25%, 50%, 75%
    const arrowPositions = [0.25, 0.5, 0.75];
    const arrows: DirectionArrow[] = [];

    arrowPositions.forEach((pos) => {
      const dist = pos * totalLength;
      const p1 = path.getPointAtLength(Math.max(0, dist - 4));
      const p2 = path.getPointAtLength(Math.min(totalLength, dist + 4));
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
      const center = path.getPointAtLength(dist);

      arrows.push({
        x: Math.round(center.x * 10) / 10,
        y: Math.round(center.y * 10) / 10,
        angle: Math.round(angle),
      });
    });

    return { points, arrows, totalLength };
  } catch (err) {
    console.error('Error sampling path:', err);
    return { points: [], arrows: [], totalLength: 0 };
  }
}

/**
 * Calculates Euclidean distance between two points
 */
export function getDistance(p1: StrokePoint, p2: StrokePoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
