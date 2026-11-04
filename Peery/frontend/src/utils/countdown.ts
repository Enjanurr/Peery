/** "2d 3h", "5h 10m" or "12m". Uses the server's clock so a wrong device clock cannot mislead. */
export function formatRemaining(endIso: string, nowIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(nowIso).getTime();
  if (ms <= 0) return 'now';

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}