import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

interface Project {
  id: string;
  system_name: string;
  project_type: string;
  economy_type: string;
  status: string;
  progress_percent: number;
  notes?: string;
  created_at: string;
}

interface BuildRequirement {
  name: string;
  amount: number;
}

const PROJECT_TYPES = [
  { value: 'outpost', label: 'Outpost' },
  { value: 'hub', label: 'Hub' },
  { value: 'station', label: 'Station' },
  { value: 'megaship', label: 'Megaship Dockyard' },
];

const ECONOMY_TYPES = [
  { value: 'industrial', label: 'Industrial', description: 'High mineral/metal deposits' },
  { value: 'refinery', label: 'Refinery', description: 'Raw material extraction sites' },
  { value: 'agriculture', label: 'Agriculture', description: 'Earth-like worlds, terraforming' },
  { value: 'military', label: 'Military', description: 'Strategic locations, high security' },
  { value: 'tourism', label: 'Tourism', description: 'Scenic views, rare phenomena' },
  { value: 'hightech', label: 'High Tech', description: 'Ruins, guardian sites, anomalies' },
  { value: 'extraction', label: 'Extraction', description: 'Asteroid clusters, ring systems' },
];

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-900/50 text-yellow-400',
  in_progress: 'bg-blue-900/50 text-blue-400',
  completed: 'bg-green-900/50 text-green-400',
  abandoned: 'bg-gray-900/50 text-gray-400',
};

export default function Colonisation() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['colonisation-projects'],
    queryFn: () => api.getColonisationProjects(),
  });

  const { data: requirements } = useQuery({
    queryKey: ['build-requirements', 'outpost'],
    queryFn: () => api.getBuildRequirements('outpost'),
    enabled: showCalculator,
  });

  const createMutation = useMutation({
    mutationFn: (data: { systemName: string; projectType: string; economyType: string; notes?: string }) =>
      api.createColonisationProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colonisation-projects'] });
      setShowNewProject(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; progressPercent?: number; notes?: string } }) =>
      api.updateColonisationProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colonisation-projects'] });
    },
  });

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      systemName: formData.get('systemName') as string,
      projectType: formData.get('projectType') as string,
      economyType: formData.get('economyType') as string,
      notes: formData.get('notes') as string || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-eurostile text-elite-orange">Colonisation</h1>
        <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
          + New Project
        </button>
      </div>

      {/* Economy Recommendations */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Economy Recommendations</h2>
        </div>
        <div className="p-6">
          <p className="text-elite-muted mb-4">
            Analyze a system to get economy type recommendations for colonisation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ECONOMY_TYPES.map((eco) => (
              <div key={eco.value} className="panel p-3">
                <div className="font-medium text-elite-orange">{eco.label}</div>
                <p className="text-elite-muted text-xs">{eco.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Active Projects</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-elite-muted">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-elite-muted">
            <p>No colonisation projects yet.</p>
            <p className="text-sm mt-2">Create a new project to start planning your colony.</p>
          </div>
        ) : (
          <div className="divide-y divide-elite-border">
            {projects.map((project: Project) => (
              <div
                key={project.id}
                className="p-4 cursor-pointer hover:bg-elite-border/20"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{project.system_name}</div>
                    <div className="text-elite-orange text-sm">
                      {PROJECT_TYPES.find((p) => p.value === project.project_type)?.label} •
                      {' '}{ECONOMY_TYPES.find((e) => e.value === project.economy_type)?.label}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[project.status]}`}>
                    {project.status}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-elite-muted mb-1">
                    <span>Progress</span>
                    <span>{project.progress_percent}%</span>
                  </div>
                  <div className="h-2 bg-elite-dark rounded overflow-hidden">
                    <div
                      className="h-full bg-elite-orange transition-all"
                      style={{ width: `${project.progress_percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Build Requirements Calculator */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Build Requirements Calculator</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-elite-muted mb-2">Structure Type</label>
              <select
                className="input w-full"
                id="structure-type"
                defaultValue="outpost"
              >
                {PROJECT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-elite-muted mb-2">Economy Type</label>
              <select className="input w-full" id="economy-type" defaultValue="industrial">
                {ECONOMY_TYPES.map((eco) => (
                  <option key={eco.value} value={eco.value}>
                    {eco.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowCalculator(!showCalculator)}>
            {showCalculator ? 'Hide Requirements' : 'Show Requirements'}
          </button>

          {showCalculator && requirements && (
            <div className="mt-4 space-y-2">
              <h3 className="text-elite-muted mb-2">Materials Required</h3>
              {requirements.materials.map((mat: BuildRequirement) => (
                <div key={mat.name} className="flex justify-between py-2 border-b border-elite-border">
                  <span>{mat.name}</span>
                  <span className="text-elite-orange">{mat.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="panel p-6 w-full max-w-md">
            <h2 className="panel-title mb-4">New Colonisation Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-elite-muted mb-2">System Name</label>
                <input
                  type="text"
                  name="systemName"
                  className="input w-full"
                  placeholder="e.g., LHS 3447"
                  required
                />
              </div>
              <div>
                <label className="block text-elite-muted mb-2">Project Type</label>
                <select name="projectType" className="input w-full" required>
                  {PROJECT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-elite-muted mb-2">Economy Type</label>
                <select name="economyType" className="input w-full" required>
                  {ECONOMY_TYPES.map((eco) => (
                    <option key={eco.value} value={eco.value}>
                      {eco.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-elite-muted mb-2">Notes (Optional)</label>
                <textarea
                  name="notes"
                  className="input w-full"
                  rows={3}
                  placeholder="Add any planning notes..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewProject(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedProject(null)}
        >
          <div className="panel p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="panel-title">{selectedProject.system_name}</h2>
              <button
                className="text-elite-muted hover:text-white"
                onClick={() => setSelectedProject(null)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-elite-muted text-sm">Type</div>
                  <div className="text-white">
                    {PROJECT_TYPES.find((p) => p.value === selectedProject.project_type)?.label}
                  </div>
                </div>
                <div>
                  <div className="text-elite-muted text-sm">Economy</div>
                  <div className="text-white">
                    {ECONOMY_TYPES.find((e) => e.value === selectedProject.economy_type)?.label}
                  </div>
                </div>
                <div>
                  <div className="text-elite-muted text-sm">Status</div>
                  <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[selectedProject.status]}`}>
                    {selectedProject.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm text-elite-muted mb-1">
                  <span>Progress</span>
                  <span>{selectedProject.progress_percent}%</span>
                </div>
                <div className="h-3 bg-elite-dark rounded overflow-hidden">
                  <div
                    className="h-full bg-elite-orange transition-all"
                    style={{ width: `${selectedProject.progress_percent}%` }}
                  />
                </div>
              </div>

              {selectedProject.notes && (
                <div>
                  <div className="text-elite-muted text-sm mb-1">Notes</div>
                  <div className="text-white text-sm">{selectedProject.notes}</div>
                </div>
              )}

              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={selectedProject.status}
                  onChange={(e) => {
                    updateMutation.mutate({
                      id: selectedProject.id,
                      data: { status: e.target.value },
                    });
                    setSelectedProject({ ...selectedProject, status: e.target.value });
                  }}
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}