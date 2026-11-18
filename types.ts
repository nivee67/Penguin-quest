export type RegionId =
  | 'frozen_island'
  | 'mystery_jungle'
  | 'forgotten_desert'
  | 'sky_mountains';

export type WeatherType =
  | 'clear'
  | 'snowfall'
  | 'snowstorm'
  | 'rain'
  | 'sandstorm'
  | 'starfall';

export type ResourceKey =
  | 'fish'
  | 'berries'
  | 'wood'
  | 'stone'
  | 'cookedFish'
  | 'torch';

export type InventoryCounts = Record<ResourceKey, number>;

export interface SurvivalStats {
  health: number;
  hunger: number;
  energy: number;
  warmth: number;
}

export type MissionGoalType =
  | 'catch_fish'
  | 'collect_wood'
  | 'collect_berries'
  | 'collect_stone'
  | 'discover_cave'
  | 'build_shelter'
  | 'survive_night'
  | 'open_chest'
  | 'craft_campfire'
  | 'cook_fish';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  goalType: MissionGoalType;
  target: number;
  progress: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export interface BuiltStructure {
  id: string;
  type: 'campfire' | 'shelter';
  regionId: RegionId;
  x: number;
  y: number;
}

export type TouchControlsMode = 'auto' | 'always' | 'off';

export interface GameSettings {
  soundEnabled: boolean;
  touchControlsMode: TouchControlsMode;
}

export interface PlayerSaveState {
  version: number;
  activeRegion: RegionId;
  unlockedRegions: RegionId[];
  coins: number;
  xp: number;
  level: number;
  stats: SurvivalStats;
  inventory: InventoryCounts;
  hasFurScarf: boolean;
  hasIceBoots: boolean;
  torchActiveUntilDayTime: number; // remaining torch seconds
  dayCount: number;
  timeOfDay: number; // 0..1 (0.25 = dawn, 0.5 = noon, 0.75 = sunset, 0.9 = night)
  survivedNights: number;
  missionsDate: string; // YYYY-MM-DD local date
  missions: DailyMission[];
  completedMissionIdsAllTime: number;
  discoveries: string[];
  openedChests: string[];
  builtStructures: BuiltStructure[];
  settings: GameSettings;
}

export interface RegionInfo {
  id: RegionId;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  unlockCostCoins: number;
  unlockMinLevel: number;
  unlockHint: string;
  groundColor: number;
  groundAccentColor: number;
  waterColor: number;
  waterShallowColor: number;
  foliagePrimary: number;
  foliageSecondary: number;
  foliageCap: number;
  rockColor: number;
  weatherPool: WeatherType[];
  coldMultiplier: number;
}

export interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  category: 'survival' | 'food' | 'gear' | 'structure';
  cost: Partial<InventoryCounts>;
  produces?: { key: ResourceKey; amount: number };
  uniqueFlag?: 'hasFurScarf' | 'hasIceBoots';
  placeStructure?: 'campfire' | 'shelter';
}

export interface NearbyPrompt {
  id: string;
  label: string;
  sublabel?: string;
  kind:
    | 'fish'
    | 'berries'
    | 'wood'
    | 'stone'
    | 'chest'
    | 'cave'
    | 'landmark'
    | 'campfire'
    | 'shelter';
}

export interface ToastNotification {
  id: string;
  title: string;
  subtitle?: string;
  variant: 'quest' | 'discovery' | 'reward' | 'warning' | 'info';
}

export type ActiveModal =
  | 'none'
  | 'world_map'
  | 'missions'
  | 'inventory'
  | 'pause'
  | 'game_over';
