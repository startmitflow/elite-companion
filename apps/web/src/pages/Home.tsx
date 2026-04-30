export default function Home() {
  return (
    <div className="space-y-6">
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Welcome, Commander</h2>
        </div>
        <div className="p-4">
          <p className="text-elite-muted">
            Track your ships, materials, missions, and more.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-4">
          <div className="text-3xl font-bold text-elite-orange">0</div>
          <div className="text-elite-muted text-sm">Active Missions</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-elite-cyan">0</div>
          <div className="text-elite-muted text-sm">Materials</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-green-400">0</div>
          <div className="text-elite-muted text-sm">Ships</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-purple-400">0</div>
          <div className="text-elite-muted text-sm">Discoveries</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="btn btn-primary">Import Ship</button>
          <button className="btn btn-secondary">Sync Journal</button>
          <button className="btn btn-secondary">Find Trade Route</button>
          <button className="btn btn-secondary">Plan Colony</button>
        </div>
      </div>
    </div>
  );
}