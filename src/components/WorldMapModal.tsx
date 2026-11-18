import React from 'react';
import { Check, Coins, Compass, Lock, Navigation, X } from 'lucide-react';
import { REGIONS, REGION_ORDER } from '../game/data';
import { PlayerSaveState, RegionId } from '../game/types';

interface WorldMapModalProps {
  saveState: PlayerSaveState;
  onClose: () => void;
  onUnlockRegion: (regionId: RegionId) => void;
  onTravelRegion: (regionId: RegionId) => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  saveState,
  onClose,
  onUnlockRegion,
  onTravelRegion,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-sky-300" />
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                World Map
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Level {saveState.level} Explorer ·{' '}
                <span className="font-mono-num text-amber-300">
                  {saveState.coins} Coins
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close World Map"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region Grid */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {REGION_ORDER.map((id) => {
            const region = REGIONS[id];
            const isUnlocked = saveState.unlockedRegions.includes(id);
            const isActive = saveState.activeRegion === id;
            const meetsLevel = saveState.level >= region.unlockMinLevel;
            const meetsCoins = saveState.coins >= region.unlockCostCoins;
            const canUnlock = !isUnlocked && meetsLevel && meetsCoins;

            return (
              <div
                key={id}
                className={`rounded-2xl border overflow-hidden flex flex-col transition-colors ${
                  isActive
                    ? 'border-amber-400/70 bg-slate-800/80'
                    : 'border-white/10 bg-slate-800/45'
                }`}
              >
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  <img
                    src={region.image}
                    alt={region.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${
                      isUnlocked ? '' : 'grayscale-[55%] opacity-75'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium text-sky-300">
                        {region.subtitle}
                      </div>
                      <h3 className="font-display font-bold text-lg text-white">
                        {region.name}
                      </h3>
                    </div>
                    {isActive && (
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Current
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {region.description}
                  </p>

                  {isUnlocked ? (
                    <button
                      onClick={() => onTravelRegion(id)}
                      className={`min-h-[46px] w-full px-4 py-2.5 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                      }`}
                    >
                      <Navigation className="w-4 h-4" />
                      <span>{isActive ? 'Continue Exploring' : `Travel to ${region.name}`}</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-slate-300 flex items-center justify-between">
                        <span>Requirement: Level {region.unlockMinLevel}</span>
                        <span className="font-mono-num text-amber-300 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {region.unlockCostCoins} Coins
                        </span>
                      </div>
                      <button
                        onClick={() => onUnlockRegion(id)}
                        disabled={!canUnlock}
                        className={`min-h-[46px] w-full px-4 py-2.5 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                          canUnlock
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-400 border border-white/10 cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                        <span>
                          {canUnlock
                            ? `Unlock (${region.unlockCostCoins} Coins)`
                            : !meetsLevel
                            ? `Need Level ${region.unlockMinLevel}`
                            : `Need ${region.unlockCostCoins} Coins`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
