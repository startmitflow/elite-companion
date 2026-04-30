import { create } from 'zustand';

// Ships store
interface Ship {
  id: string;
  name: string;
  ship_type: string;
  loadout: any;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface ShipsState {
  ships: Ship[];
  selectedShip: Ship | null;
  setShips: (ships: Ship[]) => void;
  setSelectedShip: (ship: Ship | null) => void;
  addShip: (ship: Ship) => void;
  updateShip: (id: string, data: Partial<Ship>) => void;
  removeShip: (id: string) => void;
}

export const useShipsStore = create<ShipsState>((set) => ({
  ships: [],
  selectedShip: null,
  setShips: (ships) => set({ ships }),
  setSelectedShip: (ship) => set({ selectedShip: ship }),
  addShip: (ship) => set((state) => ({ ships: [ship, ...state.ships] })),
  updateShip: (id, data) =>
    set((state) => ({
      ships: state.ships.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),
  removeShip: (id) =>
    set((state) => ({
      ships: state.ships.filter((s) => s.id !== id),
    })),
}));

// Materials store
interface Material {
  id: number;
  name: string;
  category: string;
  rarity: number;
  count: number;
}

interface MaterialsState {
  materials: Material[];
  categories: { encoded: Material[]; manufactured: Material[]; raw: Material[] };
  setMaterials: (materials: Material[]) => void;
}

export const useMaterialsStore = create<MaterialsState>((set) => ({
  materials: [],
  categories: { encoded: [], manufactured: [], raw: [] },
  setMaterials: (materials) => {
    const categories = {
      encoded: materials.filter((m) => m.category === 'encoded'),
      manufactured: materials.filter((m) => m.category === 'manufactured'),
      raw: materials.filter((m) => m.category === 'raw'),
    };
    set({ materials, categories });
  },
}));

// Colonisation store
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

interface ColonisationState {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  removeProject: (id: string) => void;
}

export const useColonisationStore = create<ColonisationState>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, data) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
}));