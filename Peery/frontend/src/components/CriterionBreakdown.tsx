import type { CriterionResult } from '../types/results.ts';
import ScoreBar from './ScoreBar.tsx';

interface CriterionBreakdownProps {
  criteria: CriterionResult[];
}

export default function CriterionBreakdown({ criteria }: CriterionBreakdownProps) {
  if (criteria.length === 0) {
    return <p className="text-sm text-slate-400">No criteria have been scored yet.</p>;
  }

  return (
    <div className="space-y-4">
      {criteria.map((criterion) => (
        <ScoreBar
          key={criterion.criterionId}
          label={criterion.criterionName}
          average={criterion.average}
          min={criterion.minScore}
          max={criterion.maxScore}
        />
      ))}
    </div>
  );
}