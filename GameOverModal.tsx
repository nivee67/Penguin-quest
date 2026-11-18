import React from 'react';
import { Flame, HeartHandshake } from 'lucide-react';

interface GameOverModalProps {
  onRecoverAtCamp: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  onRecoverAtCamp,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-400/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-4">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-white">
          Penguin Got Too Chilly!
        </h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Your little explorer fainted in the cold, but friendly sled pups guided him safely back to the warm Base Campfire.
        </p>

        <button
          onClick={onRecoverAtCamp}
          className="mt-6 min-h-[50px] w-full px-5 py-3 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-display font-bold text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <Flame className="w-5 h-5" />
          <span>Warm Up &amp; Continue</span>
        </button>
      </div>
    </div>
  );
};
