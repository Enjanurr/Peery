import { ArrowLeft, Clock } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getGradebook, revokeOverride, setOverride } from '../../api/gradeApi.ts';
import OverrideDialog, { type OverrideFormValues } from '../../components/OverrideDialog.tsx';
import OverrideHistoryPanel from '../../components/OverrideHistoryPanel.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import DashboardLayout from '../../layouts/DashboardLayout.tsx';
import type { GradebookRow } from '../../types/grades.ts';
import { formatPercentExact } from '../../utils/grades.ts';

interface DialogState {
  mode: 'set' | 'revoke';
  row: GradebookRow;
}

export default function InstructorGradebookPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);

  const { data, loading, error, reload } = useAsyncData(() => getGradebook(id), [id]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [historyFor, setHistoryFor] = useState<number | null>(null);
  const [historyVersion, setHistoryVersion] = useState<number>(0);

  if (Number.isNaN(id)) {
    return <Navigate to="/instructor/projects" replace />;
  }

  const back = (
    <Link
      to={`/instructor/projects/${id}/results`}
      className="mt-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
    >
      <ArrowLeft className="h-4 w-4" />
      Results
    </Link>
  );

  if (loading && !data) {
    return (
      <DashboardLayout title="Grades">
        {back}
        <p className="mt-4 text-slate-400">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Grades">
        {back}
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error || 'Could not load the gradebook.'}
        </p>
      </DashboardLayout>
    );
  }

  const closed = data.evaluationState === 'CLOSED';

  const handleSubmit = async (values: OverrideFormValues): Promise<void> => {
    if (!dialog) return;
    if (dialog.mode === 'set') {
      await setOverride(id, dialog.row.studentId, values);
    } else {
      await revokeOverride(id, dialog.row.studentId, { reason: values.reason });
    }
    setDialog(null);
    setHistoryVersion((v) => v + 1);
    reload();
  };

  return (
    <DashboardLayout title={`Grades: ${data.projectTitle}`}>
      {back}

      {!closed && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Evaluation has not closed yet. These grades are provisional and overrides are locked until the
            deadline passes.
          </p>
        </div>
      )}

      {data.rows.length === 0 ? (
        <p className="mt-4 text-slate-400">This project has no students on teams yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl bg-slate-800">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Peer score</th>
                <th className="px-4 py-3 font-medium">Final grade</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <Fragment key={row.studentId}>
                  <tr className="border-t border-slate-700">
                    <td className="px-4 py-3 font-medium text-slate-100">{row.fullName}</td>
                    <td className="px-4 py-3 text-slate-300">{row.teamName}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">
                      {formatPercentExact(row.computedPercent)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-medium text-slate-100">{formatPercentExact(row.finalPercent)}</span>
                      {row.overridden && (
                        <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                          Overridden
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          onClick={() => setDialog({ mode: 'set', row })}
                          disabled={!closed}
                          className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Override
                        </button>
                        {row.overridden && (
                          <button
                            onClick={() => setDialog({ mode: 'revoke', row })}
                            disabled={!closed}
                            className="rounded-lg bg-slate-700 px-3 py-1 text-xs hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          onClick={() => setHistoryFor(historyFor === row.studentId ? null : row.studentId)}
                          className="rounded-lg bg-slate-700 px-3 py-1 text-xs hover:bg-slate-600"
                        >
                          {historyFor === row.studentId ? 'Hide history' : 'History'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {historyFor === row.studentId && (
                    <tr className="border-t border-slate-700 bg-slate-900">
                      <td colSpan={5} className="px-4 py-3">
                        <OverrideHistoryPanel projectId={id} studentId={row.studentId} version={historyVersion} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <OverrideDialog
          mode={dialog.mode}
          studentName={dialog.row.fullName}
          computedPercent={dialog.row.computedPercent}
          currentOverride={dialog.row.overridePercent}
          onSubmit={handleSubmit}
          onClose={() => setDialog(null)}
        />
      )}
    </DashboardLayout>
  );
}