import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

interface Discovery {
  id: string;
  system_name: string;
  body_name: string;
  body_type?: string;
  is_first_discovery: boolean;
  estimated_value?: number;
  discovered_at: string;
}

interface Stats {
  systems_visited: number;
  first_discoveries: number;
  total_distance_ly: number;
  estimated_credits: number;
}

export default function Exploration() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['exploration-stats'],
    queryFn: () => api.getExplorationStats(),
  });

  const { data: discoveries = [], isLoading: discoveriesLoading } = useQuery({
    queryKey: ['discoveries'],
    queryFn: () => api.getDiscoveries(50),
  });

  const formatCredits = (credits: number) => {
    if (credits >= 1000000000) return `${(credits / 1000000000).toFixed(2)}B`;
    if (credits >= 1000000) return `${(credits / 1000000).toFixed(1)}M`;
    if (credits >= 1000) return `${(credits / 1000).toFixed(0)}K`;
    return credits.toString();
  };

  const formatDistance = (ly: number) => {
    if (ly >= 1000000) return `${(ly / 1000000).toFixed(0)}M LY`;
    if (ly >= 1000) return `${(ly / 1000).toFixed(0)}K LY`;
    return `${ly.toFixed(0)} LY`;
  };

  const explorationStats: Stats = stats || {
    systems_visited: 0,
    first_discoveries: 0,
    total_distance_ly: 0,
    estimated_credits: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-eurostile text-elite-orange">Exploration</h1>
        <button className="btn btn-secondary">Sync from Journal</button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="panel p-4">
          <div className="text-3xl font-bold text-elite-orange">
            {explorationStats.systems_visited.toLocaleString()}
          </div>
          <div className="text-elite-muted text-sm">Systems Visited</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-elite-cyan">
            {explorationStats.first_discoveries.toLocaleString()}
          </div>
          <div className="text-elite-muted text-sm">First Discoveries</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-green-400">
            {formatDistance(explorationStats.total_distance_ly)}
          </div>
          <div className="text-elite-muted text-sm">Distance Traveled</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-yellow-400">
            {formatCredits(explorationStats.estimated_credits)} CR
          </div>
          <div className="text-elite-muted text-sm">Est. Exploration Value</div>
        </div>
      </div>

      {/* Body Type Summary */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Discovery Breakdown</h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl text-yellow-400">★</div>
            <div className="text-elite-muted text-sm mt-1">Stars</div>
            <div className="text-white font-bold">
              {discoveries.filter((d: Discovery) => d.body_type?.includes('Star')).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-blue-400">●</div>
            <div className="text-elite-muted text-sm mt-1">Planets</div>
            <div className="text-white font-bold">
              {discoveries.filter((d: Discovery) => !d.body_type?.includes('Star') && d.body_type).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-green-400">🌍</div>
            <div className="text-elite-muted text-sm mt-1">Earth-likes</div>
            <div className="text-white font-bold">
              {discoveries.filter((d: Discovery) => d.body_type?.includes('Earth')).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-purple-400">★</div>
            <div className="text-elite-muted text-sm mt-1">First Discovered</div>
            <div className="text-white font-bold">
              {discoveries.filter((d: Discovery) => d.is_first_discovery).length}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Discoveries */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Recent Discoveries</h2>
        </div>
        {discoveriesLoading ? (
          <div className="p-8 text-center text-elite-muted">Loading discoveries...</div>
        ) : discoveries.length === 0 ? (
          <div className="p-8 text-center text-elite-muted">
            <p>No discoveries logged yet.</p>
            <p className="text-sm mt-2">
              Scan new systems to track your exploration progress.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-elite-border max-h-96 overflow-y-auto">
            {discoveries.map((discovery: Discovery) => (
              <div key={discovery.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">
                    {discovery.body_name}
                    {discovery.is_first_discovery && (
                      <span className="ml-2 text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                        FIRST
                      </span>
                    )}
                  </div>
                  <div className="text-elite-muted text-sm">
                    {discovery.system_name} • {discovery.body_type || 'Unknown'}
                  </div>
                </div>
                <div className="text-right">
                  {discovery.estimated_value && (
                    <div className="text-yellow-400">
                      {formatCredits(discovery.estimated_value)} CR
                    </div>
                  )}
                  <div className="text-elite-muted text-xs">
                    {new Date(discovery.discovered_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exploration Tips */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Exploration Tips</h2>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="flex gap-3">
            <div className="text-elite-orange">💡</div>
            <div>
              <div className="font-medium text-white">Honk Before You Jump</div>
              <div className="text-elite-muted">
                Use your discovery scanner in each system to reveal all bodies.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-elite-orange">💡</div>
            <div>
              <div className="font-medium text-white">Detailed Surface Scans</div>
              <div className="text-elite-muted">
                Use the Detailed Surface Scanner on high-value bodies for bonus credits.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-elite-orange">💡</div>
            <div>
              <div className="font-medium text-white">Earth-likes & Water Worlds</div>
              <div className="text-elite-muted">
                These are the most valuable discoveries. Always scan them in detail!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}