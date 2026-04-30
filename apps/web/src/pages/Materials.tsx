import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

interface Material {
  id: number;
  name: string;
  category: 'encoded' | 'manufactured' | 'raw';
  rarity: number;
  count: number;
}

const RARITY_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-yellow-400',
};

const RARITY_LABELS: Record<number, string> = {
  1: 'Very Common',
  2: 'Common',
  3: 'Standard',
  4: 'Rare',
  5: 'Very Rare',
};

export default function Materials() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'encoded' | 'manufactured' | 'raw'>('all');

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => api.getInventory(),
  });

  const filteredMaterials = selectedCategory === 'all'
    ? materials
    : materials.filter((m: Material) => m.category === selectedCategory);

  const totalCount = materials.reduce((sum: number, m: Material) => sum + (m.count || 0), 0);

  const categoryTotals = {
    encoded: materials.filter((m: Material) => m.category === 'encoded').reduce((sum: number, m: Material) => sum + (m.count || 0), 0),
    manufactured: materials.filter((m: Material) => m.category === 'manufactured').reduce((sum: number, m: Material) => sum + (m.count || 0), 0),
    raw: materials.filter((m: Material) => m.category === 'raw').reduce((sum: number, m: Material) => sum + (m.count || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-eurostile text-elite-orange">Materials</h1>
        <button className="btn btn-secondary">Sync from Journal</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="panel p-4">
          <div className="text-3xl font-bold text-white">{totalCount}</div>
          <div className="text-elite-muted text-sm">Total Materials</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-blue-400">{categoryTotals.encoded}</div>
          <div className="text-elite-muted text-sm">Encoded</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-green-400">{categoryTotals.manufactured}</div>
          <div className="text-elite-muted text-sm">Manufactured</div>
        </div>
        <div className="panel p-4">
          <div className="text-3xl font-bold text-purple-400">{categoryTotals.raw}</div>
          <div className="text-elite-muted text-sm">Raw</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        {['all', 'encoded', 'manufactured', 'raw'].map((cat) => (
          <button
            key={cat}
            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory(cat as any)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Materials List */}
      {isLoading ? (
        <div className="panel p-8 text-center text-elite-muted">Loading materials...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="panel p-8 text-center text-elite-muted">
          <p>No materials tracked.</p>
          <p className="text-sm mt-2">
            Sync your journal or manually add materials to see your inventory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredMaterials.map((material: Material) => (
            <div
              key={material.id}
              className="panel p-3 flex items-center justify-between"
            >
              <div>
                <div className={`font-medium ${RARITY_COLORS[material.rarity]}`}>
                  {material.name}
                </div>
                <div className="text-elite-muted text-xs">
                  {RARITY_LABELS[material.rarity]} • {material.category}
                </div>
              </div>
              <div className="text-xl font-bold text-white">
                {material.count || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}