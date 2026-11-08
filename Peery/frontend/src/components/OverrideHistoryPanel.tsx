import { getOverrideHistory } from '../api/gradeApi.ts';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { formatDateTime } from '../utils/dates.ts';
import { formatPercentExact } from '../utils/grades.ts';

interface OverrideHistoryPanelProps {
  projectId: number;
  studentId: number;
  /** Bump this to reload the history after a change. */
  version: number;
}

export default function OverrideHistoryPanel({ projectId, studentId, version }: OverrideHistoryPanelProps) {
  const { data, loading, error } = useAsyncData(
    () => getOverrideHistory(projectId, studentId),
    [projectId, studentId, version],
  );

  if (loading && !data) return <p className="text-sm text-slate-400">Loading history…</p>;
  if (error && !data) return <p className="text-sm text-rose-300">{error}</p>;
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-400">No overrides have been made for this student.</p>;
  }

  return (
    <ul className="space-y-2">
      {data.map((entry) => (
        <li key={entry.id} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-100">
              {entry.action === 'SET'
                ? `Set to ${formatPercentExact(entry.overridePercent)}`
                : 'Override revoked'}
            </span>
            <span className="text-xs text-slate-400">
              {entry.instructorName} · {formatDateTime(entry.createdAt)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-slate-300">{entry.reason}</p>
          <p className="mt-1 text-xs text-slate-500">
            Peer-evaluation score at the time: {formatPercentExact(entry.computedPercent)}
          </p>
        </li>
      ))}
    </ul>
  );
}