import React from 'react';
import {
  Backpack,
  Compass,
  Map as MapIcon,
  Play,
  ScrollText,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { REGIONS, getXpForNextLevel } from '../game/data';
import { PlayerSaveState } from '../game/types';

interface MainMenuProps {
  saveState: PlayerSaveState;
  hasActiveSession: boolean;
  onPlay: () => void;
  onOpenWorldMap: () => void;
  onOpenMissions: () => void;
  onOpenInventory: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveState,
  hasActiveSession,
  onPlay,
  onOpenWorldMap,
  onOpenMissions,
  onOpenInventory,
  onToggleSound,
}) => {
  const activeRegion = REGIONS[saveState.activeRegion];
  const unclaimedCount = saveState.missions.filter(
    (m) => m.completed && !m.claimed
  ).length;
  const nextLevelXp = getXpForNextLevel(saveState.level);

  return (
    <div className="relative w-full h-full overflow-y-auto bg-slate-950 text-slate-50 flex flex-col">
      {/* Full-bleed atmospheric backdrop with measured readability scrim */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/src/assets/images/menu_penguin_hero_1795009259653.jpg"
          alt="Little penguin explorer overlooking Frozen Island"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/50" />
      </div>

      {/* Top minimal utility header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-5 pb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white whitespace-nowrap">
            Penguin Quest
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:flex items-center gap-3 text-sm text-slate-200 font-medium">
            <span className="font-mono-num">Level {saveState.level}</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="font-mono-num text-amber-300">{saveState.coins} Coins</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>{activeRegion.name}</span>
          </div>

          <button
            onClick={onToggleSound}
            aria-label={saveState.settings.soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-slate-900/75 hover:bg-slate-800 border border-white/15 text-slate-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {saveState.settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-amber-300" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
            <span className="hidden md:inline text-xs font-medium">
              {saveState.settings.soundEnabled ? 'Sound On' : 'Muted'}
            </span>
          </button>
        </div>
      </header>

      {/* Hero + Menu Controls */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col justify-center">
        <div className="max-w-xl">
          <p className="text-sm font-semibold tracking-wide text-amber-300 mb-2">
            Cozy Arctic Survival Adventure
          </p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.08] tracking-tight text-balance mb-4">
            Penguin Quest – The Little Explorer
          </h1>
          <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-7 max-w-lg">
            Leave the safe glacier behind to forage berries, catch fish, build warm shelters, brave roaring snowstorms, and chart mysterious islands.
          </p>

          {/* Compact Explorer Status Strip (unboxed clean metadata) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300 mb-7">
            <span className="font-mono-num">
              Day {saveState.dayCount}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono-num text-sky-300">
              XP {saveState.xp}/{nextLevelXp}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono-num text-amber-300">
              {saveState.coins} Coins
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              {saveState.discoveries.length} Discoveries
            </span>
          </div>

          {/* Primary Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-md">
            <button
              onClick={onPlay}
              className="sm:col-span-2 min-h-[56px] px-6 py-3.5 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 active:scale-[0.99] text-slate-950 font-display font-bold text-lg tracking-wide flex items-center justify-center gap-3 shadow-lg shadow-orange-950/40 transition-all cursor-pointer"
            >
              <Play className="w-6 h-6 fill-slate-950" />
              <span>{hasActiveSession ? 'RESUME EXPEDITION' : 'PLAY'}</span>
            </button>

            <button
              onClick={onOpenWorldMap}
              className="min-h-[52px] px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/15 text-white font-display font-semibold text-base flex items-center justify-center gap-2.5 backdrop-blur-md transition-colors cursor-pointer"
            >
              <MapIcon className="w-5 h-5 text-sky-300" />
              <span>WORLD MAP</span>
            </button>

            <button
              onClick={onOpenMissions}
              className="relative min-h-[52px] px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/15 text-white font-display font-semibold text-base flex items-center justify-center gap-2.5 backdrop-blur-md transition-colors cursor-pointer"
            >
              <ScrollText className="w-5 h-5 text-amber-300" />
              <span>MISSIONS</span>
              {unclaimedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-mono-num font-bold rounded-full bg-emerald-500 text-slate-950">
                  {unclaimedCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenInventory}
              className="sm:col-span-2 min-h-[50px] px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/15 text-white font-display font-semibold text-base flex items-center justify-center gap-2.5 backdrop-blur-md transition-colors cursor-pointer"
            >
              <Backpack className="w-5 h-5 text-orange-300" />
              <span>INVENTORY &amp; CRAFTING</span>
            </button>
          </div>
        </div>
      </main>

      {/* Quiet controls guide footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pb-5 pt-2 text-xs sm:text-sm text-slate-300/90 flex flex-wrap items-center justify-between gap-2">
        <span>
          Desktop: Move with WASD / Arrows · Gather with E or Space · Sprint with Shift
        </span>
        <span>
          Mobile: Touch Joystick &amp; Action Buttons
        </span>
      </footer>
    </div>
  );
};
