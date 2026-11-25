export function scorePercent(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}
