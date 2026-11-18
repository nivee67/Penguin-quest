import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { InventoryCraftModal } from './components/InventoryCraftModal';
import { MainMenu } from './components/MainMenu';
import { MissionsModal } from './components/MissionsModal';
import { PauseSettingsModal } from './components/PauseSettingsModal';
import { PhaserCanvas } from './components/PhaserCanvas';
import { WorldMapModal } from './components/WorldMapModal';
import { DISCOVERY_LABELS, REGIONS } from './game/data';
import { soundFX } from './game/sound';
import {
  applyXpAndLevel,
  loadSaveState,
  resetSaveState,
  saveGameState,
} from './game/storage';
import {
  ActiveModal,
  CraftRecipe,
  MissionGoalType,
  NearbyPrompt,
  PlayerSaveState,
  RegionId,
  ResourceKey,
  ToastNotification,
  TouchControlsMode,
  WeatherType,
} from './game/types';
import { SceneBridge, WorldScene } from './game/WorldScene';

export default function App() {
  const [saveState, setSaveState] = useState<PlayerSaveState>(() => {
    const initial = loadSaveState();
    soundFX.setEnabled(initial.settings.soundEnabled);
    return initial;
  });

  const stateRef = useRef<PlayerSaveState>(saveState);
  stateRef.current = saveState;

  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');

  const [nearbyPrompt, setNearbyPrompt] = useState<NearbyPrompt | null>(null);
  const [weather, setWeather] = useState<WeatherType>('snowfall');
  const [statusFlags, setStatusFlags] = useState({
    nearWarmth: false,
    inStorm: false,
    onThinIce: false,
    sheltered: false,
  });
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const sceneRef = useRef<WorldScene | null>(null);

  // Detect touch capability / compact mobile viewport
  useEffect(() => {
    const check = () => {
      const touchCapable =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 900;
      setIsTouchDevice(touchCapable);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Persist save state cleanly
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveGameState(saveState);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const pushToast = useCallback(
    (
      title: string,
      subtitle: string | undefined,
      variant: ToastNotification['variant']
    ) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, title, subtitle, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const updateState = useCallback(
    (updater: (prev: PlayerSaveState) => PlayerSaveState) => {
      setSaveState((prev) => {
        const next = updater(prev);
        stateRef.current = next;
        return next;
      });
    },
    []
  );

  const advanceMission = useCallback(
    (goalType: MissionGoalType, amount = 1) => {
      let newlyCompletedTitle: string | null = null;
      updateState((prev) => {
        const nextMissions = prev.missions.map((m) => {
          if (m.goalType !== goalType || m.completed) return m;
          const nextProg = Math.min(m.target, m.progress + amount);
          const nowDone = nextProg >= m.target;
          if (nowDone) newlyCompletedTitle = m.title;
          return {
            ...m,
            progress: nextProg,
            completed: nowDone,
          };
        });
        return { ...prev, missions: nextMissions };
      });

      if (newlyCompletedTitle) {
        soundFX.playQuestComplete();
        pushToast(
          `Mission Complete: ${newlyCompletedTitle}`,
          'Open Missions to claim your Coins & XP!',
          'quest'
        );
      }
    },
    [pushToast, updateState]
  );

  const triggerDiscovery = useCallback(
    (discoveryId: string) => {
      const info = DISCOVERY_LABELS[discoveryId];
      if (!info) return;

      let leveledUpTo: number | null = null;
      updateState((prev) => {
        if (prev.discoveries.includes(discoveryId)) return prev;
        const lv = applyXpAndLevel(prev.xp, prev.level, info.xp);
        if (lv.leveledUp) leveledUpTo = lv.level;
        return {
          ...prev,
          discoveries: [...prev.discoveries, discoveryId],
          coins: prev.coins + info.coins,
          xp: lv.xp,
          level: lv.level,
        };
      });

      pushToast(
        `Discovered: ${info.name}!`,
        `+${info.coins} Coins · +${info.xp} XP`,
        'discovery'
      );
      if (leveledUpTo) {
        pushToast(
          `Explorer Level ${leveledUpTo}!`,
          'New regions may now be unlocked on the World Map.',
          'reward'
        );
      }
    },
    [pushToast, updateState]
  );

  const handleClaimMission = (missionId: string) => {
    soundFX.playQuestComplete();
    let rewardText = '';
    let leveledUpTo: number | null = null;

    updateState((prev) => {
      const target = prev.missions.find((m) => m.id === missionId);
      if (!target || !target.completed || target.claimed) return prev;
      rewardText = `+${target.rewardCoins} Coins · +${target.rewardXp} XP`;
      const lv = applyXpAndLevel(prev.xp, prev.level, target.rewardXp);
      if (lv.leveledUp) leveledUpTo = lv.level;

      return {
        ...prev,
        coins: prev.coins + target.rewardCoins,
        xp: lv.xp,
        level: lv.level,
        completedMissionIdsAllTime: prev.completedMissionIdsAllTime + 1,
        missions: prev.missions.map((m) =>
          m.id === missionId ? { ...m, claimed: true } : m
        ),
      };
    });

    if (rewardText) {
      pushToast('Mission Reward Claimed!', rewardText, 'reward');
    }
    if (leveledUpTo) {
      pushToast(
        `Explorer Level ${leveledUpTo}!`,
        'Check the World Map for new lands!',
        'quest'
      );
    }
  };

  const handleConsumeItem = useCallback(
    (key: 'fish' | 'berries' | 'cookedFish' | 'torch') => {
      const current = stateRef.current;
      if (current.inventory[key] <= 0) return;

      if (key === 'torch') {
        soundFX.playCraft();
        updateState((prev) => ({
          ...prev,
          inventory: { ...prev.inventory, torch: prev.inventory.torch - 1 },
          torchActiveUntilDayTime: 90,
        }));
        pushToast(
          'Explorer Torch Lit!',
          '+50% Cold Protection & light for 90 seconds.',
          'info'
        );
        return;
      }

      soundFX.playEat();
      updateState((prev) => {
        const s = prev.stats;
        if (key === 'cookedFish') {
          return {
            ...prev,
            inventory: { ...prev.inventory, cookedFish: prev.inventory.cookedFish - 1 },
            stats: {
              ...s,
              hunger: Math.min(100, s.hunger + 55),
              health: Math.min(100, s.health + 20),
              warmth: Math.min(100, s.warmth + 25),
            },
          };
        }
        if (key === 'fish') {
          return {
            ...prev,
            inventory: { ...prev.inventory, fish: prev.inventory.fish - 1 },
            stats: {
              ...s,
              hunger: Math.min(100, s.hunger + 22),
            },
          };
        }
        return {
          ...prev,
          inventory: { ...prev.inventory, berries: prev.inventory.berries - 1 },
          stats: {
            ...s,
            hunger: Math.min(100, s.hunger + 15),
            energy: Math.min(100, s.energy + 10),
          },
        };
      });
    },
    [pushToast, updateState]
  );

  const handleQuickEat = useCallback(() => {
    const inv = stateRef.current.inventory;
    if (inv.cookedFish > 0) handleConsumeItem('cookedFish');
    else if (inv.berries > 0) handleConsumeItem('berries');
    else if (inv.fish > 0) handleConsumeItem('fish');
  }, [handleConsumeItem]);

  const handleCraftRecipe = (recipe: CraftRecipe) => {
    const cur = stateRef.current;
    const canAfford = Object.entries(recipe.cost).every(([k, amt]) => {
      return cur.inventory[k as ResourceKey] >= (amt || 0);
    });
    if (!canAfford) return;

    soundFX.playCraft();

    updateState((prev) => {
      const nextInv = { ...prev.inventory };
      Object.entries(recipe.cost).forEach(([k, amt]) => {
        const key = k as ResourceKey;
        nextInv[key] = Math.max(0, nextInv[key] - (amt || 0));
      });
      if (recipe.produces) {
        nextInv[recipe.produces.key] += recipe.produces.amount;
      }
      return {
        ...prev,
        inventory: nextInv,
        hasFurScarf:
          recipe.uniqueFlag === 'hasFurScarf' ? true : prev.hasFurScarf,
        hasIceBoots:
          recipe.uniqueFlag === 'hasIceBoots' ? true : prev.hasIceBoots,
      };
    });

    if (recipe.placeStructure && sceneRef.current) {
      sceneRef.current.spawnStructureNearPlayer(recipe.placeStructure);
      setActiveModal('none');
      if (recipe.placeStructure === 'shelter') advanceMission('build_shelter', 1);
      if (recipe.placeStructure === 'campfire') advanceMission('craft_campfire', 1);
    } else if (recipe.id === 'cooked_fish') {
      advanceMission('cook_fish', 1);
      pushToast('Crafted Cooked Fish!', 'Added to your backpack.', 'info');
    } else {
      pushToast(`Crafted ${recipe.name}!`, recipe.description, 'reward');
    }
  };

  const handleUnlockRegion = (regionId: RegionId) => {
    const info = REGIONS[regionId];
    const cur = stateRef.current;
    if (
      cur.unlockedRegions.includes(regionId) ||
      cur.level < info.unlockMinLevel ||
      cur.coins < info.unlockCostCoins
    ) {
      return;
    }

    soundFX.playChest();
    updateState((prev) => ({
      ...prev,
      coins: prev.coins - info.unlockCostCoins,
      unlockedRegions: [...prev.unlockedRegions, regionId],
      activeRegion: regionId,
    }));
    setActiveModal('none');
    setScreen('playing');
    setHasActiveSession(true);
    pushToast(`Unlocked ${info.name}!`, 'Welcome to a brand new region.', 'discovery');
  };

  const handleTravelRegion = (regionId: RegionId) => {
    soundFX.playClick();
    updateState((prev) => ({ ...prev, activeRegion: regionId }));
    setActiveModal('none');
    setScreen('playing');
    setHasActiveSession(true);
    pushToast(`Arrived at ${REGIONS[regionId].name}`, undefined, 'info');
  };

  const handleToggleSound = () => {
    updateState((prev) => {
      const nextSound = !prev.settings.soundEnabled;
      soundFX.setEnabled(nextSound);
      if (nextSound) soundFX.playClick();
      return {
        ...prev,
        settings: { ...prev.settings, soundEnabled: nextSound },
      };
    });
  };

  const handleChangeTouchMode = (mode: TouchControlsMode) => {
    soundFX.playClick();
    updateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, touchControlsMode: mode },
    }));
  };

  const handleRecoverAtCamp = () => {
    soundFX.playCraft();
    updateState((prev) => ({
      ...prev,
      stats: {
        health: 80,
        hunger: Math.max(55, prev.stats.hunger),
        energy: 90,
        warmth: 100,
      },
    }));
    sceneRef.current?.respawnAtCamp();
    setActiveModal('none');
  };

  // Desktop keyboard shortcuts for modals & quick-eat
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'playing') return;
      if (e.key === 'Escape') {
        setActiveModal((prev) => (prev === 'none' ? 'pause' : 'none'));
      } else if (activeModal === 'none') {
        if (e.key === 'm' || e.key === 'M') setActiveModal('world_map');
        else if (e.key === 'q' || e.key === 'Q') setActiveModal('missions');
        else if (e.key === 'i' || e.key === 'I' || e.key === 'c' || e.key === 'C')
          setActiveModal('inventory');
        else if (e.key === 'f' || e.key === 'F') handleQuickEat();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, activeModal, handleQuickEat]);

  const bridge: SceneBridge = useMemo(
    () => ({
      getState: () => stateRef.current,
      updateState,
      onPromptChange: setNearbyPrompt,
      onWeatherChange: setWeather,
      onStatusFlagsChange: setStatusFlags,
      onNotify: pushToast,
      onAdvanceMission: advanceMission,
      onTriggerDiscovery: triggerDiscovery,
      onGameOver: () => setActiveModal('game_over'),
    }),
    [advanceMission, pushToast, triggerDiscovery, updateState]
  );

  const handleSceneReady = useCallback((scene: WorldScene) => {
    sceneRef.current = scene;
  }, []);

  const showTouchControls =
    saveState.settings.touchControlsMode === 'always' ||
    (saveState.settings.touchControlsMode === 'auto' && isTouchDevice);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {screen === 'menu' ? (
        <MainMenu
          saveState={saveState}
          hasActiveSession={hasActiveSession}
          onPlay={() => {
            soundFX.playClick();
            setHasActiveSession(true);
            setScreen('playing');
          }}
          onOpenWorldMap={() => {
            soundFX.playClick();
            setActiveModal('world_map');
          }}
          onOpenMissions={() => {
            soundFX.playClick();
            setActiveModal('missions');
          }}
          onOpenInventory={() => {
            soundFX.playClick();
            setActiveModal('inventory');
          }}
          onToggleSound={handleToggleSound}
        />
      ) : (
        <>
          <PhaserCanvas
            activeRegion={saveState.activeRegion}
            bridge={bridge}
            isPaused={activeModal !== 'none'}
            onSceneReady={handleSceneReady}
          />
          <GameHUD
            saveState={saveState}
            weather={weather}
            nearbyPrompt={nearbyPrompt}
            statusFlags={statusFlags}
            toasts={toasts}
            showTouchControls={showTouchControls}
            onJoystickChange={(vx, vy) => sceneRef.current?.setJoystick(vx, vy)}
            onSprintChange={(s) => sceneRef.current?.setMobileSprint(s)}
            onInteract={() => sceneRef.current?.triggerInteract()}
            onQuickEat={handleQuickEat}
            onOpenWorldMap={() => {
              soundFX.playClick();
              setActiveModal('world_map');
            }}
            onOpenMissions={() => {
              soundFX.playClick();
              setActiveModal('missions');
            }}
            onOpenInventory={() => {
              soundFX.playClick();
              setActiveModal('inventory');
            }}
            onOpenPause={() => {
              soundFX.playClick();
              setActiveModal('pause');
            }}
          />
        </>
      )}

      {/* Modals shared seamlessly between Main Menu and Active Gameplay */}
      {activeModal === 'world_map' && (
        <WorldMapModal
          saveState={saveState}
          onClose={() => setActiveModal('none')}
          onUnlockRegion={handleUnlockRegion}
          onTravelRegion={handleTravelRegion}
        />
      )}

      {activeModal === 'missions' && (
        <MissionsModal
          saveState={saveState}
          onClose={() => setActiveModal('none')}
          onClaimMission={handleClaimMission}
        />
      )}

      {activeModal === 'inventory' && (
        <InventoryCraftModal
          saveState={saveState}
          inGame={screen === 'playing'}
          onClose={() => setActiveModal('none')}
          onConsumeItem={handleConsumeItem}
          onCraftRecipe={handleCraftRecipe}
        />
      )}

      {activeModal === 'pause' && (
        <PauseSettingsModal
          saveState={saveState}
          onResume={() => setActiveModal('none')}
          onToggleSound={handleToggleSound}
          onChangeTouchMode={handleChangeTouchMode}
          onSaveNow={() => {
            saveGameState(stateRef.current);
            soundFX.playClick();
            pushToast('Progress Saved!', undefined, 'info');
            setActiveModal('none');
          }}
          onReturnMainMenu={() => {
            saveGameState(stateRef.current);
            setActiveModal('none');
            setScreen('menu');
          }}
          onResetProgress={() => {
            const fresh = resetSaveState();
            setSaveState(fresh);
            setActiveModal('none');
            setHasActiveSession(false);
            setScreen('menu');
          }}
        />
      )}

      {activeModal === 'game_over' && (
        <GameOverModal onRecoverAtCamp={handleRecoverAtCamp} />
      )}
    </div>
  );
}
