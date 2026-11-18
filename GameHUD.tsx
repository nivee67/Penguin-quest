import React from 'react';
import {
  Apple,
  Backpack,
  CloudRain,
  CloudSnow,
  Coins,
  Flame,
  Hand,
  Heart,
  Map as MapIcon,
  Moon,
  Pause,
  ScrollText,
  Sparkles,
  Sun,
  Thermometer,
  Utensils,
  Wind,
  Zap,
} from 'lucide-react';
import { REGIONS, getXpForNextLevel } from '../game/data';
import {
  NearbyPrompt,
  PlayerSaveState,
  ToastNotification,
  WeatherType,
} from '../game/types';
import { VirtualJoystick } from './VirtualJoystick';

interface GameHUDProps {
  saveState: PlayerSaveState;
  weather: WeatherType;
  nearbyPrompt: NearbyPrompt | null;
  statusFlags: {
    nearWarmth: boolean;
    inStorm: boolean;
    onThinIce: boolean;
    sheltered: boolean;
  };
  toasts: ToastNotification[];
  showTouchControls: boolean;
  onJoystickChange: (vx: number, vy: number) => void;
  onSprintChange: (sprinting: boolean) => void;
  onInteract: () => void;
  onQuickEat: () => void;
  onOpenWorldMap: () => void;
  onOpenMissions: () => void;
  onOpenInventory: () => void;
  onOpenPause: () => void;
}

const WEATHER_LABELS: Record<WeatherType, { label: string; icon: React.ReactNode }> = {
  clear: { label: 'Clear', icon: <Sun className="w-3.5 h-3.5 text-amber-300" /> },
  snowfall: { label: 'Snowfall', icon: <CloudSnow className="w-3.5 h-3.5 text-sky-200" /> },
  snowstorm: { label: 'Snowstorm', icon: <Wind className="w-3.5 h-3.5 text-cyan-300" /> },
  rain: { label: 'Warm Rain', icon: <CloudRain className="w-3.5 h-3.5 text-emerald-300" /> },
  sandstorm: { label: 'Sandstorm', icon: <Wind className="w-3.5 h-3.5 text-amber-400" /> },
  starfall: { label: 'Starlight', icon: <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> },
};

export const GameHUD: React.FC<GameHUDProps> = ({
  saveState,
  weather,
  nearbyPrompt,
  statusFlags,
  toasts,
  showTouchControls,
  onJoystickChange,
  onSprintChange,
  onInteract,
  onQuickEat,
  onOpenWorldMap,
  onOpenMissions,
  onOpenInventory,
  onOpenPause,
}) => {
  const { stats, inventory } = saveState;
  const isNight = saveState.timeOfDay > 0.76 || saveState.timeOfDay < 0.22;
  const region = REGIONS[saveState.activeRegion];
  const weatherMeta = WEATHER_LABELS[weather];
  const unclaimedMissions = saveState.missions.filter(
    (m) => m.completed && !m.claimed
  ).length;
  const totalFood = inventory.cookedFish + inventory.fish + inventory.berries;
  const nextXp = getXpForNextLevel(saveState.level);

  const meters = [
    {
      key: 'health',
      label: 'HP',
      val: Math.round(stats.health),
      bar: 'bg-rose-500',
      icon: <Heart className="w-3.5 h-3.5 text-rose-400" />,
      low: stats.health < 30,
    },
    {
      key: 'hunger',
      label: 'Food',
      val: Math.round(stats.hunger),
      bar: 'bg-amber-400',
      icon: <Utensils className="w-3.5 h-3.5 text-amber-300" />,
      low: stats.hunger < 25,
    },
    {
      key: 'warmth',
      label: 'Warm',
      val: Math.round(stats.warmth),
      bar: 'bg-orange-500',
      icon: <Thermometer className="w-3.5 h-3.5 text-orange-400" />,
      low: stats.warmth < 28,
    },
    {
      key: 'energy',
      label: 'Engy',
      val: Math.round(stats.energy),
      bar: 'bg-sky-400',
      icon: <Zap className="w-3.5 h-3.5 text-sky-300" />,
      low: stats.energy < 20,
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4">
      {/* TOP BAR: Survival Meters + Time/Weather + Quick Menu Triggers */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        {/* Survival Meters Panel */}
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-2 shadow-lg flex flex-col gap-1.5 min-w-[230px] sm:min-w-[310px]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {meters.map((m) => (
              <div key={m.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-1 text-[11px] font-semibold">
                  <span className="flex items-center gap-1 text-slate-200">
                    {m.icon}
                    <span>{m.label}</span>
                  </span>
                  <span
                    className={`font-mono-num ${
                      m.low ? 'text-rose-300 font-bold' : 'text-slate-100'
                    }`}
                  >
                    {m.val}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${m.bar} transition-all duration-200`}
                    style={{ width: `${Math.max(0, Math.min(100, m.val))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Unboxed status context line */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-300 pt-0.5 border-t border-white/10">
            <span className="font-semibold text-white">{region.name}</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="inline-flex items-center gap-1">
              {isNight ? (
                <Moon className="w-3 h-3 text-indigo-300" />
              ) : (
                <Sun className="w-3 h-3 text-amber-300" />
              )}
              <span className="font-mono-num">
                Day {saveState.dayCount} {isNight ? 'Night' : 'Day'}
              </span>
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="inline-flex items-center gap-1">
              {weatherMeta.icon}
              <span>{weatherMeta.label}</span>
            </span>
            {statusFlags.nearWarmth && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Flame className="w-3 h-3" />
                  Warm
                </span>
              </>
            )}
            {statusFlags.onThinIce && !saveState.hasIceBoots && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="text-cyan-300 font-semibold">Thin Ice!</span>
              </>
            )}
          </div>
        </div>

        {/* Right HUD: Coins/Level + Menu Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 ml-auto">
          <div className="hidden md:flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 text-xs font-semibold shadow-lg">
            <span className="flex items-center gap-1.5 text-amber-300 font-mono-num">
              <Coins className="w-4 h-4" />
              {saveState.coins}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-sky-200 font-mono-num">
              Lv {saveState.level} ({saveState.xp}/{nextXp} XP)
            </span>
          </div>

          <button
            onClick={onOpenWorldMap}
            aria-label="World Map"
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-white flex items-center justify-center gap-1.5 text-xs font-semibold backdrop-blur-md shadow-lg cursor-pointer"
          >
            <MapIcon className="w-4 h-4 text-sky-300" />
            <span className="hidden sm:inline">Map</span>
          </button>

          <button
            onClick={onOpenMissions}
            aria-label="Missions"
            className="relative min-h-[44px] min-w-[44px] px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-white flex items-center justify-center gap-1.5 text-xs font-semibold backdrop-blur-md shadow-lg cursor-pointer"
          >
            <ScrollText className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Missions</span>
            {unclaimedMissions > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-mono-num font-bold flex items-center justify-center shadow">
                {unclaimedMissions}
              </span>
            )}
          </button>

          <button
            onClick={onOpenInventory}
            aria-label="Inventory and Crafting"
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-white flex items-center justify-center gap-1.5 text-xs font-semibold backdrop-blur-md shadow-lg cursor-pointer"
          >
            <Backpack className="w-4 h-4 text-orange-300" />
            <span className="hidden sm:inline">Craft</span>
          </button>

          <button
            onClick={onOpenPause}
            aria-label="Pause and Settings"
            className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-white flex items-center justify-center backdrop-blur-md shadow-lg cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER-TOP QUEST / DISCOVERY ANIMATED TOASTS */}
      <div className="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 w-full max-w-sm px-4">
        {toasts.map((t) => {
          const border =
            t.variant === 'quest'
              ? 'border-emerald-400/70 bg-slate-900/95'
              : t.variant === 'discovery'
              ? 'border-sky-400/70 bg-slate-900/95'
              : t.variant === 'reward'
              ? 'border-amber-400/70 bg-slate-900/95'
              : t.variant === 'warning'
              ? 'border-rose-400/70 bg-rose-950/95'
              : 'border-white/20 bg-slate-900/90';

          return (
            <div
              key={t.id}
              className={`animate-quest-pop w-full rounded-2xl border ${border} px-4 py-3 shadow-xl backdrop-blur-md text-center`}
            >
              <div className="font-display font-bold text-sm sm:text-base text-white">
                {t.title}
              </div>
              {t.subtitle && (
                <div className="text-xs text-slate-200 mt-0.5">{t.subtitle}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM ZONE: Touch Controls OR Desktop Quick Action Bar */}
      <div className="flex items-end justify-between gap-4 pb-1 sm:pb-2">
        {/* Left: Virtual Joystick (when touch controls visible) */}
        <div className="pointer-events-auto">
          {showTouchControls ? (
            <VirtualJoystick onChange={onJoystickChange} />
          ) : (
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/75 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200">
              <span className="font-mono-num text-amber-300">
                Fish: {inventory.fish} · Wood: {inventory.wood} · Stone: {inventory.stone} · Berries: {inventory.berries}
              </span>
            </div>
          )}
        </div>

        {/* Center/Right: Context Action Prompt + Quick Eat / Sprint */}
        <div className="pointer-events-auto flex items-end gap-2.5 sm:gap-3 ml-auto">
          {/* Quick Eat Button */}
          <button
            onClick={onQuickEat}
            disabled={totalFood === 0}
            className={`min-h-[48px] px-3.5 rounded-2xl border flex items-center gap-2 text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer ${
              totalFood > 0
                ? 'bg-slate-900/85 hover:bg-slate-800 border-white/20 text-white'
                : 'bg-slate-900/45 border-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Apple className="w-4 h-4 text-rose-400" />
            <span>Eat ({totalFood})</span>
          </button>

          {/* Touch Sprint Button */}
          {showTouchControls && (
            <button
              onPointerDown={() => onSprintChange(true)}
              onPointerUp={() => onSprintChange(false)}
              onPointerCancel={() => onSprintChange(false)}
              onPointerLeave={() => onSprintChange(false)}
              className="min-h-[52px] min-w-[56px] px-3.5 rounded-2xl bg-sky-600/90 active:bg-sky-500 border border-sky-300/50 text-white font-display font-bold text-xs flex flex-col items-center justify-center shadow-lg touch-none select-none cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Sprint</span>
            </button>
          )}

          {/* Large Primary Interact / Gather Button */}
          <button
            onClick={onInteract}
            disabled={!nearbyPrompt}
            className={`min-h-[60px] min-w-[126px] sm:min-w-[150px] px-5 rounded-2xl font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer ${
              nearbyPrompt
                ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 border-2 border-amber-200'
                : 'bg-slate-900/65 text-slate-400 border border-white/15 cursor-default'
            }`}
          >
            <Hand className="w-5 h-5" />
            <span className="truncate max-w-[140px]">
              {nearbyPrompt ? nearbyPrompt.label : 'Explore'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
