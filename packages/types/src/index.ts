// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  commanderName?: string;
  createdAt: Date;
}

export interface UserSettings {
  userId: string;
  preferredLanguage: string;
  theme: 'dark' | 'light';
  edsmApiKey?: string;
  inaraApiKey?: string;
}

// Ship types
export interface Ship {
  id: string;
  userId: string;
  name: string;
  shipType: string;
  loadout: ShipLoadout;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipLoadout {
  ship: string;
  shipName: string;
  shipId: number;
  hullMass: number;
  fuelCapacity: number;
  cargoCapacity: number;
  modules: ShipModule[];
}

export interface ShipModule {
  slot: string;
  item: string;
  on: boolean;
  priority: number;
  power: number;
}

// Material types
export type MaterialCategory = 'encoded' | 'manufactured' | 'raw';

export interface Material {
  id: number;
  name: string;
  category: MaterialCategory;
  rarity: number;
  description?: string;
}

export interface InventoryItem extends Material {
  count: number;
  lastUpdated: Date;
}

// Mission types
export type MissionStatus = 'active' | 'completed' | 'failed';

export interface Mission {
  id: string;
  userId: string;
  missionId?: string;
  name: string;
  missionType?: string;
  targetSystem?: string;
  targetStation?: string;
  reward?: number;
  expiry?: Date;
  status: MissionStatus;
  createdAt: Date;
}

// Colonisation types
export type ProjectType = 'outpost' | 'hub' | 'station' | 'megaship';
export type EconomyType = 'industrial' | 'refinery' | 'agriculture' | 'military' | 'tourism' | 'hightech' | 'extraction';
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'abandoned';

export interface ColonisationProject {
  id: string;
  userId: string;
  systemName: string;
  projectType: ProjectType;
  economyType: EconomyType;
  status: ProjectStatus;
  progressPercent: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConstructionRequirement {
  projectId: string;
  materialName: string;
  required: number;
  delivered: number;
}

export interface SystemResource {
  id: string;
  systemName: string;
  bodyName: string;
  bodyType?: string;
  resources?: Record<string, number>;
  atmosphereType?: string;
  terraformState?: string;
  landable?: boolean;
  recommendedEconomy?: EconomyType;
  analyzedAt: Date;
}

// Exploration types
export interface ExplorationStats {
  userId: string;
  systemsVisited: number;
  firstDiscoveries: number;
  totalDistanceLy: number;
  estimatedCredits: number;
  updatedAt: Date;
}

export interface Discovery {
  id: string;
  userId: string;
  systemName: string;
  bodyName: string;
  bodyType?: string;
  isFirstDiscovery: boolean;
  scanType?: string;
  estimatedValue?: number;
  discoveredAt: Date;
}

// Trading types
export interface MarketPrice {
  id: number;
  systemName: string;
  stationName: string;
  commodityName: string;
  buyPrice?: number;
  sellPrice?: number;
  demand?: number;
  supply?: number;
  updatedAt: Date;
}

export interface TradeRoute {
  fromSystem: string;
  fromStation: string;
  toSystem: string;
  toStation: string;
  commodity: string;
  profitPerUnit: number;
}

// Journal event types
export interface JournalEvent {
  timestamp: string;
  event: string;
  [key: string]: any;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}