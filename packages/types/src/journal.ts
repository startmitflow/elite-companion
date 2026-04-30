// Elite Dangerous Journal Event Types

export interface LoadGameEvent {
  event: 'LoadGame';
  timestamp: string;
  Commander: string;
  FID: string;
  Ship: string;
  Ship_Localised: string;
  ShipName: string;
  ShipIdent: string;
  FuelLevel: number;
  FuelCapacity: number;
  GameVersion: string;
  GameBuild: string;
}

export interface LoadoutEvent {
  event: 'Loadout';
  timestamp: string;
  Ship: string;
  ShipName: string;
  ShipIdent: string;
  HullHealth: number;
  HullValue: number;
  Modules: ModuleInfo[];
}

export interface ModuleInfo {
  Slot: string;
  Item: string;
  On: boolean;
  Priority: number;
  Power: number;
  Health: number;
  Engineering?: EngineeringInfo;
}

export interface EngineeringInfo {
  Engineer: string;
  EngineerID: number;
  Level: number;
  Quality: number;
  Modifications: Modification[];
}

export interface Modification {
  Name: string;
  Value: number;
  OriginalValue: number;
}

export interface MaterialsEvent {
  event: 'Materials';
  timestamp: string;
  Raw: MaterialInfo[];
  Manufactured: MaterialInfo[];
  Encoded: MaterialInfo[];
}

export interface MaterialInfo {
  Name: string;
  Name_Localised?: string;
  Count: number;
}

export interface MissionAcceptedEvent {
  event: 'MissionAccepted';
  timestamp: string;
  MissionID: number;
  Name: string;
  LocalisedName?: string;
  MissionType?: string;
  TargetSystem?: string;
  TargetStation?: string;
  Expiry?: string;
  Reward?: number;
}

export interface MissionCompletedEvent {
  event: 'MissionCompleted';
  timestamp: string;
  MissionID: number;
  Name: string;
}

export interface FSDJumpEvent {
  event: 'FSDJump';
  timestamp: string;
  StarSystem: string;
  SystemAddress: number;
  StarPos: [number, number, number];
  JumpDist: number;
  FuelUsed: number;
  FuelLevel: number;
}

export interface ScanEvent {
  event: 'Scan';
  timestamp: string;
  ScanType: 'AutoScan' | 'Detailed' | 'NavBeaconDetail';
  BodyName: string;
  BodyID: number;
  StarSystem?: string;
  SystemAddress?: number;
  PlanetClass?: string;
  StarType?: string;
  DistanceFromArrivalLS: number;
  WasDiscovered?: boolean;
  WasMapped?: boolean;
}

export interface MarketEvent {
  event: 'Market';
  timestamp: string;
  MarketID: number;
  StationName: string;
  StarSystem: string;
  Items: MarketItem[];
}

export interface MarketItem {
  id: number;
  Name: string;
  Name_Localised?: string;
  Category: string;
  BuyPrice: number;
  SellPrice: number;
  MeanPrice: number;
  Stock: number;
  StockBracket: number;
  Demand: number;
  DemandBracket: number;
  Consumer: boolean;
  Producer: boolean;
  Rare: boolean;
}

export interface ShipyardEvent {
  event: 'Shipyard';
  timestamp: string;
  MarketID: number;
  StationName: string;
  StarSystem: string;
  Ships: ShipyardShip[];
}

export interface ShipyardShip {
  id: number;
  Name: string;
  BasePrice: number;
}

export interface FSSSignalDiscoveredEvent {
  event: 'FSSSignalDiscovered';
  timestamp: string;
  SystemAddress: number;
  SignalName: string;
  SignalName_Localised?: string;
  USSType?: string;
  USSType_Localised?: string;
  SpawningState?: string;
  SpawningState_Localised?: string;
  SpawningFaction?: string;
}

export interface SAAScanCompleteEvent {
  event: 'SAAScanComplete';
  timestamp: string;
  BodyName: string;
  BodyID: number;
  SystemAddress: number;
  ProbesUsed: number;
  EfficiencyTarget: number;
}