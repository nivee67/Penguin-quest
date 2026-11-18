import React from 'react';
import {
  Apple,
  Backpack,
  Check,
  Flame,
  Hammer,
  Mountain,
  Trees,
  Utensils,
  X,
} from 'lucide-react';
import { CRAFT_RECIPES } from '../game/data';
import { CraftRecipe, PlayerSaveState, ResourceKey } from '../game/types';

interface InventoryCraftModalProps {
  saveState: PlayerSaveState;
  inGame: boolean;
  onClose: () => void;
  onConsumeItem: (key: 'fish' | 'berries' | 'cookedFish' | 'torch') => void;
  onCraftRecipe: (recipe: CraftRecipe) => void;
}

const RESOURCE_META: Array<{
  key: ResourceKey;
  label: string;
  desc: string;
  actionLabel?: string;
  color: string;
}> = [
  {
    key: 'fish',
    label: 'Fresh Fish',
    desc: '+20 Hunger',
    actionLabel: 'Eat Raw',
    color: 'text-sky-300',
  },
  {
    key: 'cookedFish',
    label: 'Cooked Fish',
    desc: '+55 Hunger, +20 HP, +25 Warmth',
    actionLabel: 'Eat Meal',
    color: 'text-amber-300',
  },
  {
    key: 'berries',
    label: 'Frost Berries',
    desc: '+15 Hunger, +8 Energy',
    actionLabel: 'Eat',
    color: 'text-rose-300',
  },
  {
    key: 'wood',
    label: 'Timber Wood',
    desc: 'Crafting & Shelters',
    color: 'text-orange-300',
  },
  {
    key: 'stone',
    label: 'Island Stone',
    desc: 'Campfires & Gear',
    color: 'text-slate-300',
  },
  {
    key: 'torch',
    label: 'Explorer Torch',
    desc: '90s Cold Shield + Light',
    actionLabel: 'Light',
    color: 'text-yellow-300',
  },
];

export const InventoryCraftModal: React.FC<InventoryCraftModalProps> = ({
  saveState,
  inGame,
  onClose,
  onConsumeItem,
  onCraftRecipe,
}) => {
  const canAfford = (cost: CraftRecipe['cost']) => {
    return Object.entries(cost).every(([k, amt]) => {
      const key = k as ResourceKey;
      return saveState.inventory[key] >= (amt || 0);
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Backpack className="w-6 h-6 text-orange-300" />
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                Backpack &amp; Crafting
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Use food to stay energized or craft shelters and warm gear
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Inventory"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 space-y-6">
          {/* Resource Grid */}
          <section>
            <h3 className="font-display font-bold text-base text-slate-100 mb-3 flex items-center gap-2">
              <Apple className="w-4 h-4 text-rose-300" />
              <span>Resources &amp; Supplies</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {RESOURCE_META.map((item) => {
                const count = saveState.inventory[item.key];
                const isUsable =
                  item.key === 'fish' ||
                  item.key === 'berries' ||
                  item.key === 'cookedFish' ||
                  item.key === 'torch';

                return (
                  <div
                    key={item.key}
                    className="rounded-2xl bg-slate-800/60 border border-white/10 p-3.5 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`font-display font-bold text-sm ${item.color}`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">{item.desc}</div>
                      </div>
                      <span className="font-mono-num font-bold text-lg text-white">
                        {count}
                      </span>
                    </div>

                    {isUsable && item.actionLabel && (
                      <button
                        onClick={() =>
                          onConsumeItem(
                            item.key as 'fish' | 'berries' | 'cookedFish' | 'torch'
                          )
                        }
                        disabled={count <= 0}
                        className={`min-h-[40px] w-full px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          count > 0
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                            : 'bg-slate-900/60 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {item.actionLabel}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Crafting & Building */}
          <section>
            <h3 className="font-display font-bold text-base text-slate-100 mb-3 flex items-center gap-2">
              <Hammer className="w-4 h-4 text-amber-300" />
              <span>Survival Crafting</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CRAFT_RECIPES.map((recipe) => {
                const alreadyOwned =
                  (recipe.uniqueFlag === 'hasFurScarf' && saveState.hasFurScarf) ||
                  (recipe.uniqueFlag === 'hasIceBoots' && saveState.hasIceBoots);
                const affordable = canAfford(recipe.cost);
                const needsWorld = Boolean(recipe.placeStructure) && !inGame;
                const disabled = alreadyOwned || !affordable || needsWorld;

                return (
                  <div
                    key={recipe.id}
                    className="rounded-2xl bg-slate-800/60 border border-white/10 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                          {recipe.category === 'structure' ? (
                            <Flame className="w-4 h-4 text-orange-400" />
                          ) : recipe.category === 'food' ? (
                            <Utensils className="w-4 h-4 text-amber-300" />
                          ) : recipe.category === 'gear' ? (
                            <Mountain className="w-4 h-4 text-sky-300" />
                          ) : (
                            <Trees className="w-4 h-4 text-emerald-300" />
                          )}
                          <span>{recipe.name}</span>
                        </h4>
                        {alreadyOwned && (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Equipped
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {recipe.description}
                      </p>

                      {/* Clean unboxed cost line */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-mono-num">
                        {Object.entries(recipe.cost).map(([k, amt]) => {
                          const key = k as ResourceKey;
                          const have = saveState.inventory[key];
                          const ok = have >= (amt || 0);
                          return (
                            <span
                              key={k}
                              className={ok ? 'text-emerald-300' : 'text-rose-300'}
                            >
                              {amt} {k} ({have})
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => onCraftRecipe(recipe)}
                      disabled={disabled}
                      className={`min-h-[42px] w-full px-4 py-2 rounded-xl font-display font-bold text-sm transition-colors ${
                        alreadyOwned
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 cursor-default'
                          : !disabled
                          ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                          : 'bg-slate-900/65 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {alreadyOwned
                        ? 'Crafted'
                        : needsWorld
                        ? 'Enter World to Build'
                        : recipe.placeStructure
                        ? 'Build Near Penguin'
                        : 'Craft'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
