import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject, listInstructorProjects } from '../../api/projectApi.ts';
import ProjectCard from '../../components/ProjectCard.tsx';
import ProjectForm from '../../components/ProjectForm.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import DashboardLayout from '../../layouts/DashboardLayout.tsx';
import type { ProjectPayload } from '../../types/project.ts';

export default function InstructorProjectsPage() {
  const navigate = useNavigate();
  const { data: projects, loading, error } = useAsyncData(listInstructorProjects, []);
  const [showForm, setShowForm] = useState<boolean>(false);

  const handleCreate = async (payload: ProjectPayload): Promise<void> => {
    const created = await createProject(payload);
    navigate(`/instructor/projects/${created.id}`);
  };

  return (
    <DashboardLayout title="Projects">
      <div className="mt-4 flex justify-end">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New project
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl bg-slate-800 p-4">
          <h2 className="mb-4 font-semibold">Create project</h2>
          <ProjectForm
            submitLabel="Create project"
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="mt-6">
        {loading && !projects && <p className="text-slate-400">Loading projects…</p>}
        {error && (
          <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}
        {projects && projects.length === 0 && (
          <p className="text-slate-400">No projects yet. Create your first one above.</p>
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
                to={`/instructor/projects/${project.id}`}
              >
                <span className="text-slate-300">
                  {project.teamCount} teams · {project.studentCount} students
                </span>
              </ProjectCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}