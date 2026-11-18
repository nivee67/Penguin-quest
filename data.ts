import { CraftRecipe, DailyMission, MissionGoalType, RegionId, RegionInfo } from './types';

export const REGIONS: Record<RegionId, RegionInfo> = {
  frozen_island: {
    id: 'frozen_island',
    name: 'Frozen Island',
    subtitle: 'Home Archipelago',
    description:
      'Snow-blanketed pines, crystal fishing lagoons, thin-ice straits, and a hidden glacial cave waiting to be explored.',
    image: '/src/assets/images/region_frozen_island_1795009260548.jpg',
    unlockCostCoins: 0,
    unlockMinLevel: 1,
    unlockHint: 'Starting Region',
    groundColor: 0xe6f2fa,
    groundAccentColor: 0xd0e6f5,
    waterColor: 0x1e6091,
    waterShallowColor: 0x3b8ec2,
    foliagePrimary: 0x265c4b,
    foliageSecondary: 0x347862,
    foliageCap: 0xf8fafc,
    rockColor: 0x64748b,
    weatherPool: ['clear', 'snowfall', 'snowfall', 'snowstorm'],
    coldMultiplier: 1.0,
  },
  mystery_jungle: {
    id: 'mystery_jungle',
    name: 'Mystery Jungle',
    subtitle: 'Emerald Canopy',
    description:
      'Bioluminescent mushroom groves, warm waterfalls, and mossy temple ruins hidden beneath towering ferns.',
    image: '/src/assets/images/region_mystery_jungle_1795009260915.jpg',
    unlockCostCoins: 60,
    unlockMinLevel: 2,
    unlockHint: 'Reach Explorer Level 2 & 60 Coins',
    groundColor: 0x4f7d4a,
    groundAccentColor: 0x3f6b3e,
    waterColor: 0x0e7490,
    waterShallowColor: 0x22b8cf,
    foliagePrimary: 0x1b4332,
    foliageSecondary: 0x2d6a4f,
    foliageCap: 0x52b788,
    rockColor: 0x57534e,
    weatherPool: ['clear', 'rain', 'clear', 'starfall'],
    coldMultiplier: 0.45,
  },
  forgotten_desert: {
    id: 'forgotten_desert',
    name: 'Forgotten Desert',
    subtitle: 'Golden Dunes',
    description:
      'Sun-drenched sandstone arches, turquoise palm oases, and ancient relics buried in shifting golden sands.',
    image: '/src/assets/images/region_forgotten_desert_1795009262409.jpg',
    unlockCostCoins: 120,
    unlockMinLevel: 3,
    unlockHint: 'Reach Explorer Level 3 & 120 Coins',
    groundColor: 0xead29a,
    groundAccentColor: 0xdcc07e,
    waterColor: 0x0d9488,
    waterShallowColor: 0x2dd4bf,
    foliagePrimary: 0x3f6212,
    foliageSecondary: 0x65a30d,
    foliageCap: 0x84cc16,
    rockColor: 0xb45309,
    weatherPool: ['clear', 'clear', 'sandstorm', 'clear'],
    coldMultiplier: 0.65,
  },
  sky_mountains: {
    id: 'sky_mountains',
    name: 'Sky Mountains',
    subtitle: 'Cloudtop Peaks',
    description:
      'High-altitude crystal spires floating above sunlit clouds, linked by weathered paths and bracing alpine winds.',
    image: '/src/assets/images/region_sky_mountains_1795009261748.jpg',
    unlockCostCoins: 200,
    unlockMinLevel: 4,
    unlockHint: 'Reach Explorer Level 4 & 200 Coins',
    groundColor: 0xdbeafe,
    groundAccentColor: 0xbfdbfe,
    waterColor: 0x38bdf8,
    waterShallowColor: 0x7dd3fc,
    foliagePrimary: 0x1e40af,
    foliageSecondary: 0x3b82f6,
    foliageCap: 0xf1f5f9,
    rockColor: 0x475569,
    weatherPool: ['clear', 'snowfall', 'starfall', 'snowstorm'],
    coldMultiplier: 1.25,
  },
};

export const REGION_ORDER: RegionId[] = [
  'frozen_island',
  'mystery_jungle',
  'forgotten_desert',
  'sky_mountains',
];

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'cooked_fish',
    name: 'Cooked Fish',
    description: 'Restores +55 Hunger, +20 Health, and +25 Warmth.',
    category: 'food',
    cost: { fish: 1, wood: 1 },
    produces: { key: 'cookedFish', amount: 1 },
  },
  {
    id: 'campfire',
    name: 'Campfire',
    description: 'Places a crackling campfire near you for warmth & light.',
    category: 'structure',
    cost: { wood: 4, stone: 3 },
    placeStructure: 'campfire',
  },
  {
    id: 'wooden_shelter',
    name: 'Wooden Shelter',
    description: 'Builds a cozy timber cabin that shields you from storms.',
    category: 'structure',
    cost: { wood: 8, stone: 4 },
    placeStructure: 'shelter',
  },
  {
    id: 'explorer_torch',
    name: 'Explorer Torch',
    description: 'Craft a warm torch (+50% cold protection for 90s).',
    category: 'survival',
    cost: { wood: 2, stone: 1 },
    produces: { key: 'torch', amount: 1 },
  },
  {
    id: 'fur_scarf',
    name: 'Fur-Lined Scarf',
    description: 'Permanent upgrade: reduces warmth loss by 35%.',
    category: 'gear',
    cost: { wood: 4, berries: 4, stone: 2 },
    uniqueFlag: 'hasFurScarf',
  },
  {
    id: 'ice_boots',
    name: 'Grip Ice Boots',
    description: 'Permanent upgrade: +18% speed & safe footing on thin ice.',
    category: 'gear',
    cost: { wood: 3, stone: 5 },
    uniqueFlag: 'hasIceBoots',
  },
];

export const DISCOVERY_LABELS: Record<string, { name: string; region: string; xp: number; coins: number }> = {
  hidden_cave: {
    name: 'Hidden Glacial Cave',
    region: 'Frozen Island',
    xp: 60,
    coins: 35,
  },
  shipwreck_cove: {
    name: 'Frostbite Shipwreck',
    region: 'Frozen Island',
    xp: 45,
    coins: 25,
  },
  aurora_peak: {
    name: 'Aurora Lookout Peak',
    region: 'Frozen Island',
    xp: 50,
    coins: 30,
  },
  ancient_obelisk: {
    name: 'Ancient Ice Obelisk',
    region: 'Frozen Island',
    xp: 40,
    coins: 20,
  },
  jungle_temple: {
    name: 'Mossy Sun Temple',
    region: 'Mystery Jungle',
    xp: 65,
    coins: 40,
  },
  desert_oasis: {
    name: 'Emerald Oasis',
    region: 'Forgotten Desert',
    xp: 70,
    coins: 45,
  },
  sky_sanctuary: {
    name: 'Cloudtop Sanctuary',
    region: 'Sky Mountains',
    xp: 85,
    coins: 60,
  },
};

export function getXpForNextLevel(level: number): number {
  return 100 + (level - 1) * 75;
}

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  goalType: MissionGoalType;
  target: number;
  rewardCoins: number;
  rewardXp: number;
}

const CORE_MISSIONS: MissionTemplate[] = [
  {
    id: 'daily_fish',
    title: 'Catch 5 Fish',
    description: 'Fish at shimmering ice holes or shorelines to gather 5 fish.',
    goalType: 'catch_fish',
    target: 5,
    rewardCoins: 30,
    rewardXp: 45,
  },
  {
    id: 'daily_wood',
    title: 'Collect 10 Wood',
    description: 'Gather 10 pieces of timber from fallen logs around the island.',
    goalType: 'collect_wood',
    target: 10,
    rewardCoins: 35,
    rewardXp: 50,
  },
  {
    id: 'daily_cave',
    title: 'Discover a Hidden Cave',
    description: 'Explore the northern cliffs to uncover the glowing Hidden Cave.',
    goalType: 'discover_cave',
    target: 1,
    rewardCoins: 45,
    rewardXp: 65,
  },
  {
    id: 'daily_shelter',
    title: 'Build a Small Shelter',
    description: 'Gather 8 Wood & 4 Stone, then craft a Wooden Shelter.',
    goalType: 'build_shelter',
    target: 1,
    rewardCoins: 55,
    rewardXp: 75,
  },
  {
    id: 'daily_night',
    title: 'Survive One Night',
    description: 'Keep warm with campfires or shelter until sunrise arrives.',
    goalType: 'survive_night',
    target: 1,
    rewardCoins: 50,
    rewardXp: 70,
  },
];

const ROTATING_POOL: MissionTemplate[] = [
  {
    id: 'daily_berries',
    title: 'Forage 6 Berries',
    description: 'Pick wild frost berries from bushes to stay energized.',
    goalType: 'collect_berries',
    target: 6,
    rewardCoins: 25,
    rewardXp: 40,
  },
  {
    id: 'daily_stone',
    title: 'Mine 6 Stones',
    description: 'Collect 6 sturdy stones from rocky outcrops.',
    goalType: 'collect_stone',
    target: 6,
    rewardCoins: 30,
    rewardXp: 45,
  },
  {
    id: 'daily_chest',
    title: 'Open 2 Treasure Chests',
    description: 'Seek out hidden chests tucked in coves and ridges.',
    goalType: 'open_chest',
    target: 2,
    rewardCoins: 45,
    rewardXp: 60,
  },
  {
    id: 'daily_campfire',
    title: 'Light a Campfire',
    description: 'Craft and place a warm campfire to fight off the chill.',
    goalType: 'craft_campfire',
    target: 1,
    rewardCoins: 30,
    rewardXp: 45,
  },
  {
    id: 'daily_cook',
    title: 'Cook 2 Fish',
    description: 'Roast fresh fish into hearty Cooked Fish rations.',
    goalType: 'cook_fish',
    target: 2,
    rewardCoins: 35,
    rewardXp: 50,
  },
];

function hashDateSeed(dateStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function generateDailyMissions(
  dateKey: string,
  isFirstDay: boolean
): DailyMission[] {
  // On the player's very first day, present the 5 iconic starter missions requested.
  // On subsequent calendar days, rotate 3 from core + 2 from rotating pool deterministically by date!
  let selected: MissionTemplate[];

  if (isFirstDay) {
    selected = CORE_MISSIONS;
  } else {
    const seed = hashDateSeed(dateKey);
    const rotA = ROTATING_POOL[seed % ROTATING_POOL.length];
    const rotB = ROTATING_POOL[(seed + 2) % ROTATING_POOL.length];
    const coreA = CORE_MISSIONS[seed % CORE_MISSIONS.length];
    const coreB = CORE_MISSIONS[(seed + 1) % CORE_MISSIONS.length];
    const coreC = CORE_MISSIONS[(seed + 3) % CORE_MISSIONS.length];
    const unique = new Map<string, MissionTemplate>();
    [coreA, coreB, coreC, rotA, rotB].forEach((m) => unique.set(m.id, m));
    selected = Array.from(unique.values());
  }

  return selected.map((tpl) => ({
    ...tpl,
    id: `${dateKey}_${tpl.id}`,
    progress: 0,
    completed: false,
    claimed: false,
  }));
}
