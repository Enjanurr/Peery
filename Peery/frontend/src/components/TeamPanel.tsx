import { Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import type { StudentSummary, Team } from '../types/project.ts';

interface TeamPanelProps {
  team: Team;
  availableStudents: StudentSummary[];
  busy: boolean;
  onAddMember: (teamId: number, studentId: number) => void;
  onRemoveMember: (teamId: number, studentId: number) => void;
  onDeleteTeam: (teamId: number) => void;
}

export default function TeamPanel({
  team,
  availableStudents,
  busy,
  onAddMember,
  onRemoveMember,
  onDeleteTeam,
}: TeamPanelProps) {
  const [selected, setSelected] = useState<string>('');

  const handleAdd = (): void => {
    if (!selected) return;
    onAddMember(team.id, Number(selected));
    setSelected('');
  };

  return (
    <section className="rounded-xl bg-slate-800 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {team.name}{' '}
          <span className="text-sm font-normal text-slate-400">({team.members.length} members)</span>
        </h3>
        <button
          onClick={() => onDeleteTeam(team.id)}
          disabled={busy}
          aria-label={`Delete team ${team.name}`}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-rose-400 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {team.members.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No members yet.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {team.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-sm"
            >
              <span>
                {member.fullName} <span className="text-slate-400">· {member.email}</span>
              </span>
              <button
                onClick={() => onRemoveMember(team.id, member.id)}
                disabled={busy}
                aria-label={`Remove ${member.fullName}`}
                className="rounded p-1 text-slate-400 hover:text-rose-400 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={busy || availableStudents.length === 0}
          aria-label={`Add a student to ${team.name}`}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">
            {availableStudents.length === 0 ? 'No unassigned students' : 'Select a student…'}
          </option>
          {availableStudents.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName} ({student.email})
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={busy || !selected}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          Add
        </button>
      </div>
    </section>
  );
}