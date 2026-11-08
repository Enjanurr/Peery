/** "88.50%", or an em dash when there is no value. */
export function formatPercentExact(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}%`;
}