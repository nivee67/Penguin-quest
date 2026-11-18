import React, { useState } from 'react';
import { Award, CheckCircle2, Coins, Compass, ScrollText, Sparkles, X } from 'lucide-react';
import { DISCOVERY_LABELS, getXpForNextLevel } from '../game/data';
import { PlayerSaveState } from '../game/types';

interface MissionsModalProps {
  saveState: PlayerSaveState;
  onClose: () => void;
  onClaimMission: (missionId: string) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  saveState,
  onClose,
  onClaimMission,
}) => {
  const [tab, setTab] = useState<'missions' | 'discoveries'>('missions');
  const nextXp = getXpForNextLevel(saveState.level);
  const discoveryEntries = Object.entries(DISCOVERY_LABELS);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-amber-300" />
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                Explorer Missions
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Daily refresh: <span className="font-mono-num">{saveState.missionsDate}</span> · Level {saveState.level} ({saveState.xp}/{nextXp} XP)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Missions"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Controls */}
        <div className="px-5 sm:px-7 pt-3 pb-2 border-b border-white/10 flex items-center gap-2">
          <button
            onClick={() => setTab('missions')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'missions'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Daily Missions ({saveState.missions.filter((m) => m.completed).length}/{saveState.missions.length})
          </button>
          <button
            onClick={() => setTab('discoveries')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'discoveries'
                ? 'bg-sky-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Discoveries ({saveState.discoveries.length}/{discoveryEntries.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 space-y-3">
          {tab === 'missions' ? (
            saveState.missions.map((mission) => {
              const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
              const canClaim = mission.completed && !mission.claimed;

              return (
                <div
                  key={mission.id}
                  className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    mission.claimed
                      ? 'bg-slate-800/35 border-white/5 opacity-75'
                      : canClaim
                      ? 'bg-emerald-950/35 border-emerald-400/50'
                      : 'bg-slate-800/60 border-white/10'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base text-white">
                        {mission.title}
                      </h3>
                      {mission.claimed && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      {mission.description}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2.5 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            mission.completed ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono-num text-slate-200 shrink-0">
                        {mission.progress}/{mission.target}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2.5 text-xs font-mono-num">
                      <span className="text-amber-300 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />+{mission.rewardCoins}
                      </span>
                      <span className="text-sky-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />+{mission.rewardXp} XP
                      </span>
                    </div>

                    {mission.claimed ? (
                      <span className="text-xs font-semibold text-emerald-400">
                        Claimed
                      </span>
                    ) : canClaim ? (
                      <button
                        onClick={() => onClaimMission(mission.id)}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display font-bold text-sm flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>Claim</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">In Progress</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {discoveryEntries.map(([id, info]) => {
                const found = saveState.discoveries.includes(id);
                return (
                  <div
                    key={id}
                    className={`rounded-2xl border p-4 flex items-start gap-3 ${
                      found
                        ? 'bg-sky-950/35 border-sky-400/40'
                        : 'bg-slate-800/40 border-white/10 opacity-75'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        found
                          ? 'bg-sky-400/20 text-sky-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-white">
                        {found ? info.name : 'Uncharted Landmark'}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {info.region} · +{info.coins} Coins / +{info.xp} XP
                      </div>
                      <div className="text-xs mt-1 font-medium text-sky-300">
                        {found ? 'Discovered' : 'Explore the island to find'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
