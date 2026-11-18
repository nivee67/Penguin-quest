import { generateDailyMissions, getLocalDateKey, getXpForNextLevel } from './data';
import { PlayerSaveState } from './types';

const STORAGE_KEY = 'penguin_quest_save_v1';

export function createInitialSaveState(): PlayerSaveState {
  const today = getLocalDateKey();
  return {
    version: 1,
    activeRegion: 'frozen_island',
    unlockedRegions: ['frozen_island'],
    coins: 20,
    xp: 0,
    level: 1,
    stats: {
      health: 100,
      hunger: 92,
      energy: 100,
      warmth: 95,
    },
    inventory: {
      fish: 1,
      berries: 2,
      wood: 2,
      stone: 1,
      cookedFish: 0,
      torch: 0,
    },
    hasFurScarf: false,
    hasIceBoots: false,
    torchActiveUntilDayTime: 0,
    dayCount: 1,
    timeOfDay: 0.34, // Crisp bright morning
    survivedNights: 0,
    missionsDate: today,
    missions: generateDailyMissions(today, true),
    completedMissionIdsAllTime: 0,
    discoveries: [],
    openedChests: [],
    builtStructures: [
      {
        id: 'starter_camp_fire',
        type: 'campfire',
        regionId: 'frozen_island',
        x: 1180,
        y: 1220,
      },
    ],
    settings: {
      soundEnabled: true,
      touchControlsMode: 'auto',
    },
  };
}

export function loadSaveState(): PlayerSaveState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialSaveState();
    }
    const parsed = JSON.parse(raw) as PlayerSaveState;
    const base = createInitialSaveState();
    const merged: PlayerSaveState = {
      ...base,
      ...parsed,
      stats: { ...base.stats, ...(parsed.stats || {}) },
      inventory: { ...base.inventory, ...(parsed.inventory || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };

    const today = getLocalDateKey();
    if (merged.missionsDate !== today) {
      merged.missionsDate = today;
      merged.missions = generateDailyMissions(today, false);
    }

    // Clamp stats safely on reload
    merged.stats.health = Math.max(25, Math.min(100, merged.stats.health));
    merged.stats.hunger = Math.max(15, Math.min(100, merged.stats.hunger));
    merged.stats.energy = Math.max(25, Math.min(100, merged.stats.energy));
    merged.stats.warmth = Math.max(25, Math.min(100, merged.stats.warmth));

    return merged;
  } catch {
    return createInitialSaveState();
  }
}

export function saveGameState(state: PlayerSaveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function resetSaveState(): PlayerSaveState {
  const fresh = createInitialSaveState();
  saveGameState(fresh);
  return fresh;
}

export function applyXpAndLevel(
  currentXp: number,
  currentLevel: number,
  gainedXp: number
): { xp: number; level: number; leveledUp: boolean } {
  let xp = currentXp + gainedXp;
  let level = currentLevel;
  let leveledUp = false;

  while (xp >= getXpForNextLevel(level)) {
    xp -= getXpForNextLevel(level);
    level += 1;
    leveledUp = true;
  }

  return { xp, level, leveledUp };
}
