import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

interface Mission {
  id: string;
  name: string;
  mission_type: string;
  target_system: string;
  target_station?: string;
  reward: number;
  expiry?: string;
  status: 'active' | 'completed' | 'failed';
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900/50 text-green-400',
  completed: 'bg-blue-900/50 text-blue-400',
  failed: 'bg-red-900/50 text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  failed: 'Failed',
};

export default function Missions() {
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'failed' | 'all'>('active');

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions', statusFilter],
    queryFn: () => api.getMissions(statusFilter === 'all' ? undefined : statusFilter),
  });

  const totalReward = missions
    .filter((m: Mission) => m.status === 'active')
    .reduce((sum: number, m: Mission) => sum + (m.reward || 0), 0);

  const formatReward = (credits: number) => {
    if (credits >= 1000000) return `${(credits / 1000000).toFixed(1)}M`;
    if (credits >= 1000) return `${(credits / 1000).toFixed(0)}K`;
    return credits.toString();
  };

  const timeUntilExpiry = (expiry: string) => {
    const diff = new Date(expiry).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-eurostile text-elite-orange">Missions</h1>
        <button className="btn btn-secondary">Sync from Journal</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="panel p-4">
          <div className="text-3xl font-bold text-green-400">
            {missions.filter((m: Mission) => m.status === 'active').length}
          </div>
          <div className="text-elite-muted text-sm">Active Missions</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-yellow-400">
            {formatReward(totalReward)}
          </div>
          <div className="text-elite-muted text-sm">Potential Reward</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-blue-400">
            {missions.filter((m: Mission) => m.status === 'completed').length}
          </div>
          <div className="text-elite-muted text-sm">Completed</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-red-400">
            {missions.filter((m: Mission) => m.status === 'failed').length}
          </div>
          <div className="text-elite-muted text-sm">Failed</div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['active', 'completed', 'failed', 'all'].map((status) => (
          <button
            key={status}
            className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(status as any)}
          >
            {STATUS_LABELS[status] || 'All'}
          </button>
        ))}
      </div>

      {/* Missions List */}
      {isLoading ? (
        <div className="panel p-8 text-center text-elite-muted">Loading missions...</div>
      ) : missions.length === 0 ? (
        <div className="panel p-8 text-center text-elite-muted">
          <p>No missions found.</p>
          <p className="text-sm mt-2">
            Accept missions in-game and sync your journal to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((mission: Mission) => (
            <div key={mission.id} className="panel p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-white">{mission.name}</div>
                  <div className="text-elite-orange text-sm">{mission.mission_type}</div>
                  {mission.target_system && (
                    <div className="text-elite-muted text-sm mt-1">
                      📍 {mission.target_system}
                      {mission.target_station && ` / ${mission.target_station}`}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-bold">
                    {formatReward(mission.reward)} CR
                  </div>
                  {mission.expiry && (
                    <div className="text-elite-muted text-sm">
                      ⏱ {timeUntilExpiry(mission.expiry)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[mission.status]}`}>
                  {STATUS_LABELS[mission.status]}
                </span>
                <span className="text-elite-muted text-xs">
                  Added {new Date(mission.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}