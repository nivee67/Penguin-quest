import React, { useState } from 'react';
import {
  Gamepad2,
  Home,
  Play,
  RotateCcw,
  Save,
  Settings,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { PlayerSaveState, TouchControlsMode } from '../game/types';

interface PauseSettingsModalProps {
  saveState: PlayerSaveState;
  onResume: () => void;
  onToggleSound: () => void;
  onChangeTouchMode: (mode: TouchControlsMode) => void;
  onSaveNow: () => void;
  onReturnMainMenu: () => void;
  onResetProgress: () => void;
}

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  saveState,
  onResume,
  onToggleSound,
  onChangeTouchMode,
  onSaveNow,
  onReturnMainMenu,
  onResetProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-300" />
            <h2 className="font-display font-bold text-xl text-white">
              Paused &amp; Settings
            </h2>
          </div>
          <button
            onClick={onResume}
            aria-label="Resume game"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={onResume}
            className="min-h-[48px] w-full px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Resume Expedition</span>
          </button>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between gap-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2.5 text-sm font-medium text-slate-200">
              {saveState.settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-amber-300" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
              <span>Sound Effects</span>
            </div>
            <button
              onClick={onToggleSound}
              className={`min-h-[40px] px-4 rounded-xl text-xs font-bold cursor-pointer ${
                saveState.settings.soundEnabled
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {saveState.settings.soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Touch Controls Mode */}
          <div className="py-2 border-b border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Gamepad2 className="w-5 h-5 text-sky-300" />
              <span>On-Screen Touch Joystick</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl">
              {(['auto', 'always', 'off'] as TouchControlsMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChangeTouchMode(mode)}
                  className={`min-h-[38px] rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    saveState.settings.touchControlsMode === mode
                      ? 'bg-sky-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onSaveNow}
              className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-300" />
              <span>Save</span>
            </button>

            <button
              onClick={onReturnMainMenu}
              className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4 text-sky-300" />
              <span>Main Menu</span>
            </button>
          </div>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="min-h-[42px] w-full px-4 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Saved Progress</span>
            </button>
          ) : (
            <div className="rounded-xl bg-rose-950/50 border border-rose-500/40 p-3 flex items-center justify-between gap-2">
              <span className="text-xs text-rose-200">Erase all progress?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmReset(false);
                    onResetProgress();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 text-xs font-bold text-white cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
