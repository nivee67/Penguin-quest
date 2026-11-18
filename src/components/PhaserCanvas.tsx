import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { SceneBridge, WorldScene } from '../game/WorldScene';
import { RegionId } from '../game/types';

interface PhaserCanvasProps {
  activeRegion: RegionId;
  bridge: SceneBridge;
  isPaused: boolean;
  onSceneReady: (scene: WorldScene) => void;
}

export const PhaserCanvas: React.FC<PhaserCanvasProps> = ({
  activeRegion,
  bridge,
  isPaused,
  onSceneReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<WorldScene | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const bridgeRef = useRef(bridge);
  bridgeRef.current = bridge;

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const scene = new WorldScene();
    scene.attachBridge({
      getState: () => bridgeRef.current.getState(),
      updateState: (u) => bridgeRef.current.updateState(u),
      onPromptChange: (p) => bridgeRef.current.onPromptChange(p),
      onWeatherChange: (w) => bridgeRef.current.onWeatherChange(w),
      onStatusFlagsChange: (f) => bridgeRef.current.onStatusFlagsChange(f),
      onNotify: (t, s, v) => bridgeRef.current.onNotify(t, s, v),
      onAdvanceMission: (g, a) => bridgeRef.current.onAdvanceMission(g, a),
      onTriggerDiscovery: (d) => bridgeRef.current.onTriggerDiscovery(d),
      onGameOver: () => bridgeRef.current.onGameOver(),
    });

    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: parent.clientWidth || window.innerWidth,
      height: parent.clientHeight || window.innerHeight,
      backgroundColor: '#1e6091',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
      scene: [scene],
    });

    gameRef.current = game;
    onSceneReady(scene);

    return () => {
      sceneRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
  }, [activeRegion, onSceneReady]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setPausedState(isPaused);
    }
  }, [isPaused]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full z-0 select-none overflow-hidden"
    />
  );
};
