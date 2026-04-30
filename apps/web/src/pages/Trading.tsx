export default function Trading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-eurostile text-elite-orange">Trading Routes</h1>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Find Trade Routes</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-elite-muted mb-2">Origin System</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Enter system name..."
              />
            </div>
            <div>
              <label className="block text-elite-muted mb-2">Max Jump Range (LY)</label>
              <input
                type="number"
                className="input w-full"
                placeholder="50"
              />
            </div>
          </div>
          <button className="btn btn-primary">Search Routes</button>
        </div>
      </div>

      <div className="panel">
        <div className="p-8 text-center text-elite-muted">
          <p>Enter a system to find profitable trade routes.</p>
        </div>
      </div>
    </div>
  );
}