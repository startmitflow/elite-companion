import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

interface Ship {
  id: string;
  name: string;
  ship_type: string;
  loadout: any;
  is_favorite: boolean;
  created_at: string;
}

const SHIP_TYPES = [
  'Sidewinder',
  'Eagle',
  'Hauler',
  'Adder',
  'Viper Mk III',
  'Cobra Mk III',
  'Type-6 Transporter',
  'Dolphin',
  'Type-7 Transporter',
  'ASP Explorer',
  'Vulture',
  'Imperial Courier',
  'Imperial Clipper',
  'Federal Dropship',
  'Type-9 Heavy',
  'Python',
  'Fer-de-Lance',
  'Beluga Liner',
  'Type-10 Defender',
  'Krait Mk II',
  'Krait Phantom',
  'Mamba',
  'Alliance Chieftain',
  'Alliance Crusader',
  'Alliance Challenger',
  'Federal Assault Ship',
  'Federal Gunship',
  'Imperial Cutter',
  'Federal Corvette',
  'Anaconda',
];

export default function Ships() {
  const [showModal, setShowModal] = useState(false);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const queryClient = useQueryClient();

  const { data: ships = [], isLoading } = useQuery({
    queryKey: ['ships'],
    queryFn: () => api.getShips(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; shipType: string; loadout: any }) =>
      api.createShip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteShip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
    },
  });

  const handleImport = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const data = JSON.parse(event.target.value);
      if (data.Ship && data.Modules) {
        createMutation.mutate({
          name: data.ShipName || data.Ship,
          shipType: data.Ship,
          loadout: data,
        });
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-eurostile text-elite-orange">Ship Loadouts</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Import Loadout
        </button>
      </div>

      {isLoading ? (
        <div className="panel p-8 text-center text-elite-muted">Loading ships...</div>
      ) : ships.length === 0 ? (
        <div className="panel p-8 text-center text-elite-muted">
          <p>No ships saved yet.</p>
          <p className="text-sm mt-2">
            Import a ship loadout from your journal or paste an EDSY/Coriolis JSON.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ships.map((ship) => (
            <div
              key={ship.id}
              className="panel cursor-pointer hover:border-elite-orange transition-colors"
              onClick={() => setSelectedShip(ship)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">{ship.name}</h3>
                  {ship.is_favorite && <span className="text-yellow-400">★</span>}
                </div>
                <div className="text-elite-orange text-sm">{ship.ship_type}</div>
                <div className="text-elite-muted text-xs mt-2">
                  Added {new Date(ship.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="panel p-6 w-full max-w-lg">
            <h2 className="panel-title mb-4">Import Ship Loadout</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-elite-muted mb-2">Ship Name</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="My Krait Mk II"
                  id="ship-name"
                />
              </div>
              <div>
                <label className="block text-elite-muted mb-2">Ship Type</label>
                <select className="input w-full" id="ship-type">
                  {SHIP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-elite-muted mb-2">
                  Loadout JSON (paste from EDSY, Coriolis, or journal)
                </label>
                <textarea
                  className="input w-full h-32 font-mono text-xs"
                  placeholder='{"Ship": "Krait Mk II", ...}'
                  onChange={handleImport}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const name = (document.getElementById('ship-name') as HTMLInputElement).value;
                    const type = (document.getElementById('ship-type') as HTMLSelectElement).value;
                    createMutation.mutate({ name, shipType: type, loadout: {} });
                  }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedShip && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedShip(null)}
        >
          <div className="panel p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="panel-title">{selectedShip.name}</h2>
              <button
                className="text-elite-muted hover:text-white"
                onClick={() => setSelectedShip(null)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-elite-orange">{selectedShip.ship_type}</div>
              {selectedShip.loadout?.Modules && (
                <div>
                  <h3 className="text-elite-muted mb-2">Modules</h3>
                  <div className="max-h-64 overflow-y-auto">
                    {selectedShip.loadout.Modules.map((mod: any, i: number) => (
                      <div key={i} className="flex justify-between py-1 border-b border-elite-border">
                        <span className="text-sm">{mod.Slot}</span>
                        <span className="text-elite-muted text-sm">{mod.Item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  className="btn btn-secondary text-red-400"
                  onClick={() => {
                    deleteMutation.mutate(selectedShip.id);
                    setSelectedShip(null);
                  }}
                >
                  Delete
                </button>
                <button className="btn btn-secondary">Export</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}