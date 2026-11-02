import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listMyProjects } from '../../api/projectApi.ts';
import ProjectCard from '../../components/ProjectCard.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import DashboardLayout from '../../layouts/DashboardLayout.tsx';

export default function StudentProjectsPage() {
  const { data: projects, loading, error } = useAsyncData(listMyProjects, []);

  return (
    <DashboardLayout title="My Projects">
      <Link
        to="/student"
        className="mt-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mt-4">
        {loading && !projects && <p className="text-slate-400">Loading projects…</p>}
        {error && (
          <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}
        {projects && projects.length === 0 && (
          <p className="text-slate-400">You are not part of any project yet.</p>
        )}
        {projects && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                description={project.description}
                evalStartDate={project.evalStartDate}
                evalEndDate={project.evalEndDate}
              >
                {project.team ? (
                  <div>
                    <p className="font-medium text-slate-200">Team: {project.team.name}</p>
                    {project.team.teammates.length === 0 ? (
                      <p className="mt-1 text-slate-400">No teammates yet.</p>
                    ) : (
                      <ul className="mt-1 space-y-0.5 text-slate-400">
                        {project.team.teammates.map((mate) => (
                          <li key={mate.id}>{mate.fullName}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">You have not been assigned to a team yet.</p>
                )}
              </ProjectCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}