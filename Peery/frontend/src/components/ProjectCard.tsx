import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../utils/dates.ts';
import StatusBadge from './StatusBadge.tsx';

interface ProjectCardProps {
  title: string;
  description: string | null;
  evalStartDate: string;
  evalEndDate: string;
  /** When set, the whole card links there. */
  to?: string;
  children?: ReactNode;
}

export default function ProjectCard({
  title,
  description,
  evalStartDate,
  evalEndDate,
  to,
  children,
}: ProjectCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-100">{title}</h3>
        <StatusBadge start={evalStartDate} end={evalEndDate} />
      </div>
      {description && <p className="mt-1 line-clamp-2 text-sm text-slate-400">{description}</p>}
      <p className="mt-3 text-xs text-slate-400">
        {formatDateTime(evalStartDate)} → {formatDateTime(evalEndDate)}
      </p>
      {children && <div className="mt-3 border-t border-slate-700 pt-3 text-sm">{children}</div>}
    </>
  );

  const base = 'block rounded-xl bg-slate-800 p-4';

  return to ? (
    <Link to={to} className={`${base} transition hover:bg-slate-700/70`}>
      {content}
    </Link>
  ) : (
    <div className={base}>{content}</div>
  );
}