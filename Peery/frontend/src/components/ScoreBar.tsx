import { formatScore } from '../utils/scores.ts';

interface ScoreBarProps {
  label: string;
  average: number | null;
  min: number;
  max: number;
}

export default function ScoreBar({ label, average, min, max }: ScoreBarProps) {
  const percent =
    average === null ? 0 : Math.min(100, Math.max(0, ((average - min) / (max - min)) * 100));

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="tabular-nums text-slate-400">
          {formatScore(average)} / {max}
        </span>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-slate-700"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}