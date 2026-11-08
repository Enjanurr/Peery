export function formatScore(value: number | null, digits = 2): string {
  return value === null ? '—' : value.toFixed(digits);
}

export function formatPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}%`;
}