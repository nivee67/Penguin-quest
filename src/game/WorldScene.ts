import Phaser from 'phaser';
import { DISCOVERY_LABELS, REGIONS } from './data';
import { soundFX } from './sound';
import { applyXpAndLevel } from './storage';
import { generateGameTextures } from './textures';
import {
  BuiltStructure,
  NearbyPrompt,
  PlayerSaveState,
  RegionInfo,
  ResourceKey,
  WeatherType,
} from './types';

export interface SceneBridge {
  getState: () => PlayerSaveState;
  updateState: (updater: (prev: PlayerSaveState) => PlayerSaveState) => void;
  onPromptChange: (prompt: NearbyPrompt | null) => void;
  onWeatherChange: (weather: WeatherType) => void;
  onStatusFlagsChange: (flags: {
    nearWarmth: boolean;
    inStorm: boolean;
    onThinIce: boolean;
    sheltered: boolean;
  }) => void;
  onNotify: (
    title: string,
    subtitle: string | undefined,
    variant: 'quest' | 'discovery' | 'reward' | 'warning' | 'info'
  ) => void;
  onAdvanceMission: (goalType: PlayerSaveState['missions'][number]['goalType'], amount?: number) => void;
  onTriggerDiscovery: (discoveryId: string) => void;
  onGameOver: () => void;
}

interface ResourceNode {
  id: string;
  kind: 'fish' | 'berries' | 'wood' | 'stone';
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Image;
  available: boolean;
  respawnTimer: number;
}

interface ChestNode {
  id: string;
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  opened: boolean;
}

interface LandmarkNode {
  id: string;
  discoveryId: string;
  label: string;
  kind: 'cave' | 'landmark';
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image;
}

interface StructureNode {
  data: BuiltStructure;
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
}

interface ThinIceZone {
  x: number;
  y: number;
  rx: number;
  ry: number;
  crackProgress: number;
}

const WORLD_W = 2400;
const WORLD_H = 1800;

export class WorldScene extends Phaser.Scene {
  private bridge!: SceneBridge;
  private region!: RegionInfo;

  private penguin!: Phaser.GameObjects.Image;
  private penguinGlow!: Phaser.GameObjects.Image;
  private interactRing!: Phaser.GameObjects.Arc;
  private nightOverlay!: Phaser.GameObjects.Rectangle;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
  };

  private joyVec = { x: 0, y: 0 };
  private mobileSprint = false;
  private paused = false;

  private resources: ResourceNode[] = [];
  private chests: ChestNode[] = [];
  private landmarks: LandmarkNode[] = [];
  private structures: StructureNode[] = [];
  private thinIceZones: ThinIceZone[] = [];
  private obstacleCircles: Array<{ x: number; y: number; r: number }> = [];

  private snowEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private stormEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  private currentWeather: WeatherType = 'clear';
  private weatherTimer = 26;
  private footprintTimer = 0;
  private hudSyncTimer = 0;
  private waddlePhase = 0;
  private hurtCooldown = 0;
  private lastNightTrack = false;
  private activePrompt: NearbyPrompt | null = null;

  constructor() {
    super('WorldScene');
  }

  public attachBridge(bridge: SceneBridge) {
    this.bridge = bridge;
  }

  public setJoystick(vx: number, vy: number) {
    this.joyVec.x = vx;
    this.joyVec.y = vy;
  }

  public setMobileSprint(active: boolean) {
    this.mobileSprint = active;
  }

  public setPausedState(isPaused: boolean) {
    this.paused = isPaused;
  }

  public spawnStructureNearPlayer(type: 'campfire' | 'shelter') {
    if (!this.penguin || !this.bridge) return;
    const state = this.bridge.getState();
    const offsetX = this.penguin.flipX ? -78 : 78;
    const px = Phaser.Math.Clamp(this.penguin.x + offsetX, 340, WORLD_W - 340);
    const py = Phaser.Math.Clamp(this.penguin.y + 18, 280, WORLD_H - 280);

    const newStruct: BuiltStructure = {
      id: `${type}_${Date.now()}`,
      type,
      regionId: state.activeRegion,
      x: Math.round(px),
      y: Math.round(py),
    };

    this.addStructureVisual(newStruct);
    this.bridge.updateState((prev) => ({
      ...prev,
      builtStructures: [...prev.builtStructures, newStruct],
    }));

    this.spawnFloatingText(
      px,
      py - 40,
      type === 'shelter' ? 'Shelter Built!' : 'Campfire Lit!',
      '#fde047'
    );
  }

  public triggerInteract() {
    if (this.paused || !this.activePrompt) return;
    const prompt = this.activePrompt;

    // Resource gathering
    const res = this.resources.find((r) => r.id === prompt.id && r.available);
    if (res) {
      this.collectResource(res);
      return;
    }

    // Treasure chest
    const chest = this.chests.find((c) => c.id === prompt.id && !c.opened);
    if (chest) {
      this.openChest(chest);
      return;
    }

    // Cave or Landmark
    const lm = this.landmarks.find((l) => l.id === prompt.id);
    if (lm) {
      this.interactLandmark(lm);
      return;
    }

    // Built Shelter (Rest until dawn during dusk/night!)
    const struct = this.structures.find((s) => s.data.id === prompt.id);
    if (struct) {
      this.interactStructure(struct);
    }
  }

  public respawnAtCamp() {
    if (!this.penguin) return;
    this.penguin.setPosition(1200, 1240);
    this.hurtCooldown = 1.5;
  }

  create() {
    const state = this.bridge.getState();
    this.region = REGIONS[state.activeRegion];
    this.lastNightTrack = state.timeOfDay > 0.78 || state.timeOfDay < 0.22;

    this.resources = [];
    this.chests = [];
    this.landmarks = [];
    this.structures = [];
    this.thinIceZones = [];
    this.obstacleCircles = [];

    generateGameTextures(this, this.region);
    this.buildWorldTerrain();
    this.populateWorldObjects(state);

    // Night & Twilight Overlay (screen-fixed)
    this.nightOverlay = this.add
      .rectangle(0, 0, this.scale.width * 2, this.scale.height * 2, 0x0b1736, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(900);

    // Penguin Explorer
    const startX = 1200;
    const startY = 1255;
    this.penguinGlow = this.add
      .image(startX, startY, 'fx_glow')
      .setDepth(895)
      .setScale(1.1)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.penguin = this.add
      .image(startX, startY, this.getPenguinTextureKey(state))
      .setDepth(startY);

    // Bobbing interaction highlight ring
    this.interactRing = this.add
      .circle(0, 0, 42)
      .setStrokeStyle(3, 0xfbbf24, 0.9)
      .setFillStyle(0xfbbf24, 0.12)
      .setVisible(false)
      .setDepth(50);

    this.tweens.add({
      targets: this.interactRing,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0.65,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Camera follow
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.penguin, true, 0.12, 0.12);
    this.cameras.main.setZoom(this.scale.width < 640 ? 0.85 : 1.0);

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.nightOverlay.setSize(gameSize.width * 2, gameSize.height * 2);
      this.cameras.main.setZoom(gameSize.width < 640 ? 0.85 : 1.0);
    });

    // Keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        SHIFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      };

      this.wasd.E.on('down', () => this.triggerInteract());
      this.wasd.SPACE.on('down', () => this.triggerInteract());
    }

    // Weather particles
    this.setupWeatherParticles();
    this.setWeather(this.region.weatherPool[1] || 'snowfall');
  }

  private getPenguinTextureKey(state: PlayerSaveState): string {
    if (state.hasFurScarf && state.hasIceBoots) return 'penguin_both';
    if (state.hasFurScarf) return 'penguin_fur';
    if (state.hasIceBoots) return 'penguin_boots';
    return 'penguin_base';
  }

  private buildWorldTerrain() {
    const g = this.add.graphics().setDepth(1);

    // Deep water background
    g.fillStyle(this.region.waterColor, 1);
    g.fillRect(0, 0, WORLD_W, WORLD_H);

    // Animated shallow water waves around island
    const shallow = this.add.graphics().setDepth(2);
    shallow.fillStyle(this.region.waterShallowColor, 0.6);
    shallow.fillEllipse(WORLD_W / 2, WORLD_H / 2, 1980, 1440);
    this.tweens.add({
      targets: shallow,
      scaleX: 1.015,
      scaleY: 1.015,
      x: -16,
      y: -10,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Island shoreline cliff rim (gives stylized 3D depth)
    g.fillStyle(0x334155, 0.5);
    g.fillRoundedRect(240, 210, 1920, 1400, 340);

    // Main island terrain surface
    g.fillStyle(this.region.groundColor, 1);
    g.fillRoundedRect(240, 190, 1920, 1380, 340);

    // Soft organic elevation zones & paths
    g.fillStyle(this.region.groundAccentColor, 0.65);
    g.fillEllipse(720, 1080, 560, 420); // West Pine Woods
    g.fillEllipse(1740, 740, 520, 390); // East Grove
    g.fillEllipse(1200, 440, 720, 320); // North Blizzard Ridge

    // Cozy Base Camp clearing
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(1200, 1230, 340, 230);

    // Frozen Fishing Lagoon (East-South lagoon)
    g.fillStyle(this.region.waterShallowColor, 0.9);
    g.fillEllipse(1660, 1180, 340, 230);
    g.lineStyle(6, 0xffffff, 0.55);
    g.strokeEllipse(1660, 1180, 344, 234);

    // Secondary Ice Pond (North-West near cave)
    g.fillStyle(this.region.waterShallowColor, 0.85);
    g.fillEllipse(840, 720, 250, 170);

    // Cracked Thin Ice Hazard Zones
    this.thinIceZones = [
      { x: 1500, y: 920, rx: 64, ry: 44, crackProgress: 0 },
      { x: 860, y: 720, rx: 64, ry: 44, crackProgress: 0 },
      { x: 1200, y: 630, rx: 64, ry: 44, crackProgress: 0 },
    ];
    this.thinIceZones.forEach((zone) => {
      this.add.image(zone.x, zone.y, 'hazard_thin_ice').setDepth(4);
    });

    // Subtle snowdrift / ground pebble details
    for (let i = 0; i < 65; i++) {
      const dx = Phaser.Math.Between(340, WORLD_W - 340);
      const dy = Phaser.Math.Between(280, WORLD_H - 280);
      g.fillStyle(0xffffff, 0.28);
      g.fillEllipse(dx, dy, Phaser.Math.Between(30, 85), Phaser.Math.Between(14, 34));
    }
  }

  private populateWorldObjects(state: PlayerSaveState) {
    // 1. Curated Landmarks & Hidden Cave
    const landmarkConfigs: Array<{
      id: string;
      discoveryId: string;
      label: string;
      kind: 'cave' | 'landmark';
      x: number;
      y: number;
    }> =
      state.activeRegion === 'frozen_island'
        ? [
            {
              id: 'lm_cave',
              discoveryId: 'hidden_cave',
              label: 'Hidden Glacial Cave',
              kind: 'cave',
              x: 520,
              y: 460,
            },
            {
              id: 'lm_aurora',
              discoveryId: 'aurora_peak',
              label: 'Aurora Lookout Peak',
              kind: 'landmark',
              x: 1200,
              y: 340,
            },
            {
              id: 'lm_shipwreck',
              discoveryId: 'shipwreck_cove',
              label: 'Frostbite Shipwreck',
              kind: 'landmark',
              x: 1900,
              y: 1340,
            },
            {
              id: 'lm_obelisk',
              discoveryId: 'ancient_obelisk',
              label: 'Ancient Ice Obelisk',
              kind: 'landmark',
              x: 580,
              y: 1380,
            },
          ]
        : [
            {
              id: `lm_cave_${state.activeRegion}`,
              discoveryId: 'hidden_cave',
              label: 'Secret Grotto Cave',
              kind: 'cave',
              x: 540,
              y: 470,
            },
            {
              id: `lm_region_${state.activeRegion}`,
              discoveryId:
                state.activeRegion === 'mystery_jungle'
                  ? 'jungle_temple'
                  : state.activeRegion === 'forgotten_desert'
                  ? 'desert_oasis'
                  : 'sky_sanctuary',
              label:
                state.activeRegion === 'mystery_jungle'
                  ? 'Mossy Sun Temple'
                  : state.activeRegion === 'forgotten_desert'
                  ? 'Emerald Oasis Shrine'
                  : 'Cloudtop Sanctuary',
              kind: 'landmark',
              x: 1220,
              y: 350,
            },
          ];

    landmarkConfigs.forEach((cfg) => {
      const tex = cfg.kind === 'cave' ? 'prop_cave' : 'prop_landmark';
      const sprite = this.add.image(cfg.x, cfg.y, tex).setDepth(cfg.y);
      const glow = this.add
        .image(cfg.x, cfg.y + 10, 'fx_glow')
        .setDepth(cfg.y - 1)
        .setScale(cfg.kind === 'cave' ? 1.5 : 1.0)
        .setTint(0x38bdf8)
        .setAlpha(0.5)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.landmarks.push({ ...cfg, sprite, glow });
      this.obstacleCircles.push({ x: cfg.x, y: cfg.y + 12, r: 42 });
    });

    // 2. Treasure Chests
    const chestCoords = [
      { id: `${state.activeRegion}_chest_cave`, x: 635, y: 505 },
      { id: `${state.activeRegion}_chest_ridge`, x: 1320, y: 365 },
      { id: `${state.activeRegion}_chest_east`, x: 1960, y: 790 },
      { id: `${state.activeRegion}_chest_south`, x: 640, y: 1410 },
    ];
    chestCoords.forEach((c) => {
      const opened = state.openedChests.includes(c.id);
      const sprite = this.add
        .image(c.x, c.y, opened ? 'prop_chest_open' : 'prop_chest_closed')
        .setDepth(c.y);
      const glow = this.add
        .image(c.x, c.y, 'fx_glow')
        .setDepth(c.y - 1)
        .setScale(0.75)
        .setTint(0xfbbf24)
        .setAlpha(opened ? 0 : 0.6)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.chests.push({ id: c.id, x: c.x, y: c.y, sprite, glow, opened });
    });

    // 3. Fishing Spots around Lagoon & Coast
    const fishCoords = [
      { x: 1560, y: 1150 },
      { x: 1710, y: 1215 },
      { x: 1640, y: 1110 },
      { x: 1755, y: 1140 },
      { x: 930, y: 1420 },
      { x: 1440, y: 1410 },
    ];
    fishCoords.forEach((f, idx) => {
      const sprite = this.add.image(f.x, f.y, 'res_fish_spot').setDepth(10);
      this.tweens.add({
        targets: sprite,
        scaleX: 1.05,
        scaleY: 0.96,
        duration: 1200 + idx * 140,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.resources.push({
        id: `fish_${idx}`,
        kind: 'fish',
        x: f.x,
        y: f.y,
        sprite,
        available: true,
        respawnTimer: 0,
      });
    });

    // 4. Berry Bushes, Wood Logs & Stones scattered across groves
    const berryCoords = [
      [1040, 1210],
      [920, 1140],
      [740, 1020],
      [660, 1180],
      [1390, 1070],
      [1540, 740],
      [1760, 690],
      [1880, 960],
      [980, 880],
      [1110, 560],
    ];
    berryCoords.forEach(([x, y], idx) => {
      const sprite = this.add.image(x, y, 'res_berries').setDepth(y);
      this.resources.push({
        id: `berries_${idx}`,
        kind: 'berries',
        x,
        y,
        sprite,
        available: true,
        respawnTimer: 0,
      });
    });

    const woodCoords = [
      [1080, 1300],
      [960, 1240],
      [810, 1140],
      [680, 960],
      [790, 860],
      [1340, 1240],
      [1480, 1120],
      [1610, 840],
      [1730, 620],
      [1860, 750],
      [1030, 520],
      [690, 620],
    ];
    woodCoords.forEach(([x, y], idx) => {
      const sprite = this.add.image(x, y, 'res_wood').setDepth(y);
      this.resources.push({
        id: `wood_${idx}`,
        kind: 'wood',
        x,
        y,
        sprite,
        available: true,
        respawnTimer: 0,
      });
    });

    const stoneCoords = [
      [1290, 1140],
      [990, 980],
      [620, 840],
      [730, 510],
      [1050, 410],
      [1420, 440],
      [1640, 580],
      [1870, 610],
      [1820, 1220],
      [720, 1340],
    ];
    stoneCoords.forEach(([x, y], idx) => {
      const sprite = this.add.image(x, y, 'res_stone').setDepth(y);
      this.resources.push({
        id: `stone_${idx}`,
        kind: 'stone',
        x,
        y,
        sprite,
        available: true,
        respawnTimer: 0,
      });
    });

    // 5. Decorative 3D Trees around woods & perimeter (with soft collision)
    const treeCoords = [
      [540, 980],
      [610, 1080],
      [760, 1240],
      [840, 980],
      [910, 1310],
      [1580, 640],
      [1680, 740],
      [1820, 660],
      [1920, 860],
      [1840, 1040],
      [440, 680],
      [480, 820],
      [960, 380],
      [1480, 390],
      [1740, 490],
      [1390, 1360],
      [810, 1440],
      [1120, 1450],
    ];
    treeCoords.forEach(([tx, ty]) => {
      this.add.image(tx, ty, 'prop_tree').setDepth(ty);
      this.obstacleCircles.push({ x: tx, y: ty + 35, r: 22 });
    });

    // 6. Built Structures in this region
    state.builtStructures
      .filter((s) => s.regionId === state.activeRegion)
      .forEach((s) => this.addStructureVisual(s));
  }

  private addStructureVisual(struct: BuiltStructure) {
    const tex = struct.type === 'shelter' ? 'prop_shelter' : 'prop_campfire';
    const sprite = this.add.image(struct.x, struct.y, tex).setDepth(struct.y);
    const glow = this.add
      .image(struct.x, struct.y, 'fx_glow')
      .setDepth(struct.y - 1)
      .setScale(struct.type === 'shelter' ? 1.8 : 1.35)
      .setTint(0xfb923c)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: glow,
      scaleX: (struct.type === 'shelter' ? 1.8 : 1.35) * 1.08,
      scaleY: (struct.type === 'shelter' ? 1.8 : 1.35) * 1.08,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.structures.push({ data: struct, sprite, glow });
  }

  private setupWeatherParticles() {
    const isDesert = this.region.id === 'forgotten_desert';
    const isJungle = this.region.id === 'mystery_jungle';

    this.snowEmitter = this.add
      .particles(0, 0, 'fx_snow', {
        x: { min: 0, max: this.scale.width + 400 },
        y: -20,
        lifespan: 4200,
        speedY: { min: isJungle ? 220 : 55, max: isJungle ? 310 : 105 },
        speedX: { min: -35, max: 20 },
        scale: { start: 0.45, end: 0.18 },
        alpha: { start: 0.78, end: 0 },
        tint: isDesert ? 0xfde68a : isJungle ? 0xa7f3d0 : 0xffffff,
        frequency: 90,
        quantity: 2,
      })
      .setScrollFactor(0)
      .setDepth(920);

    this.stormEmitter = this.add
      .particles(0, 0, 'fx_snow', {
        x: { min: -200, max: this.scale.width + 600 },
        y: { min: -50, max: this.scale.height * 0.5 },
        lifespan: 2100,
        speedY: { min: 150, max: 240 },
        speedX: { min: -260, max: -160 },
        scale: { start: 0.6, end: 0.2 },
        alpha: { start: 0.85, end: 0 },
        tint: isDesert ? 0xf59e0b : 0xe0f2fe,
        frequency: 28,
        quantity: 4,
      })
      .setScrollFactor(0)
      .setDepth(925);

    this.snowEmitter.stop();
    this.stormEmitter.stop();
  }

  private setWeather(weather: WeatherType) {
    this.currentWeather = weather;
    this.bridge.onWeatherChange(weather);

    if (!this.snowEmitter || !this.stormEmitter) return;

    if (weather === 'clear') {
      this.snowEmitter.stop();
      this.stormEmitter.stop();
    } else if (weather === 'snowfall' || weather === 'rain' || weather === 'starfall') {
      this.snowEmitter.start();
      this.stormEmitter.stop();
    } else {
      // snowstorm or sandstorm
      this.snowEmitter.start();
      this.stormEmitter.start();
    }
  }

  private collectResource(res: ResourceNode) {
    const state = this.bridge.getState();
    if (state.stats.energy < 4) {
      this.bridge.onNotify('Low Energy!', 'Eat berries or rest near a campfire.', 'warning');
      soundFX.playHurt();
      return;
    }

    res.available = false;
    res.respawnTimer = res.kind === 'fish' ? 14 : 22;
    res.sprite.setAlpha(0.28);

    soundFX.playGather(res.kind);

    const keyMap: Record<ResourceNode['kind'], ResourceKey> = {
      fish: 'fish',
      berries: 'berries',
      wood: 'wood',
      stone: 'stone',
    };

    const resKey = keyMap[res.kind];
    const amount = res.kind === 'wood' ? 2 : 1;

    this.bridge.updateState((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [resKey]: prev.inventory[resKey] + amount,
      },
      stats: {
        ...prev.stats,
        energy: Math.max(0, prev.stats.energy - 4),
      },
    }));

    const labelMap = {
      fish: '+1 Fish',
      berries: '+1 Berries',
      wood: '+2 Wood',
      stone: '+1 Stone',
    };
    this.spawnFloatingText(res.x, res.y - 34, labelMap[res.kind], '#ffffff');

    // Mission progress
    if (res.kind === 'fish') this.bridge.onAdvanceMission('catch_fish', 1);
    if (res.kind === 'wood') this.bridge.onAdvanceMission('collect_wood', amount);
    if (res.kind === 'berries') this.bridge.onAdvanceMission('collect_berries', 1);
    if (res.kind === 'stone') this.bridge.onAdvanceMission('collect_stone', 1);

    // Cute hop animation on penguin
    this.tweens.add({
      targets: this.penguin,
      scaleY: 1.14,
      scaleX: 0.9,
      duration: 110,
      yoyo: true,
    });
  }

  private openChest(chest: ChestNode) {
    chest.opened = true;
    chest.sprite.setTexture('prop_chest_open');
    chest.glow.setAlpha(0);
    soundFX.playChest();

    const bonusCoins = 28;
    const bonusXp = 35;

    this.bridge.updateState((prev) => {
      const lv = applyXpAndLevel(prev.xp, prev.level, bonusXp);
      return {
        ...prev,
        openedChests: [...prev.openedChests, chest.id],
        coins: prev.coins + bonusCoins,
        xp: lv.xp,
        level: lv.level,
        inventory: {
          ...prev.inventory,
          wood: prev.inventory.wood + 2,
          stone: prev.inventory.stone + 2,
          fish: prev.inventory.fish + 1,
        },
      };
    });

    this.spawnFloatingText(chest.x, chest.y - 42, `+${bonusCoins} Coins!`, '#fbbf24');
    this.bridge.onNotify(
      'Treasure Chest Opened!',
      `Found ${bonusCoins} Coins, ${bonusXp} XP, 2 Wood, 2 Stone & 1 Fish.`,
      'reward'
    );
    this.bridge.onAdvanceMission('open_chest', 1);
  }

  private interactLandmark(lm: LandmarkNode) {
    const state = this.bridge.getState();
    const already = state.discoveries.includes(lm.discoveryId);

    if (!already) {
      soundFX.playDiscovery();
      this.bridge.onTriggerDiscovery(lm.discoveryId);
      if (lm.kind === 'cave') {
        this.bridge.onAdvanceMission('discover_cave', 1);
      }
      this.spawnFloatingText(lm.x, lm.y - 60, 'Discovery!', '#67e8f9');
    } else {
      const info = DISCOVERY_LABELS[lm.discoveryId];
      soundFX.playClick();
      this.bridge.onNotify(
        info?.name || lm.label,
        lm.kind === 'cave'
          ? 'The glowing crystals keep the cavern sheltered and warm!'
          : 'A serene landmark you charted earlier.',
        'info'
      );
    }
  }

  private interactStructure(struct: StructureNode) {
    const state = this.bridge.getState();
    const isNight = state.timeOfDay > 0.72 || state.timeOfDay < 0.22;

    if (struct.data.type === 'shelter' && isNight) {
      soundFX.playCraft();
      this.bridge.updateState((prev) => ({
        ...prev,
        timeOfDay: 0.28, // Skip safely to crisp morning!
        dayCount: prev.dayCount + 1,
        survivedNights: prev.survivedNights + 1,
        stats: {
          ...prev.stats,
          health: Math.min(100, prev.stats.health + 30),
          warmth: 100,
          energy: 100,
        },
      }));
      this.lastNightTrack = false;
      this.bridge.onAdvanceMission('survive_night', 1);
      this.bridge.onNotify(
        'Rested Safely Until Dawn!',
        'You slept warmly inside your timber shelter.',
        'quest'
      );
    } else {
      soundFX.playClick();
      this.bridge.onNotify(
        struct.data.type === 'shelter' ? 'Cozy Wooden Shelter' : 'Warm Campfire',
        struct.data.type === 'shelter'
          ? 'Shields you from storms. Interact at night to sleep until dawn.'
          : 'Restores Warmth & Energy nearby. Open Inventory to cook Fish!',
        'info'
      );
    }
  }

  private spawnFloatingText(x: number, y: number, message: string, color: string) {
    const txt = this.add
      .text(x, y, message, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color,
        stroke: '#0f172a',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(950);

    this.tweens.add({
      targets: txt,
      y: y - 42,
      alpha: 0,
      duration: 950,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  update(_time: number, deltaMs: number) {
    if (!this.bridge || !this.penguin || this.paused) return;

    const dt = Math.min(0.05, deltaMs / 1000);
    const state = this.bridge.getState();

    // Update penguin texture if upgrades changed
    const targetTex = this.getPenguinTextureKey(state);
    if (this.penguin.texture.key !== targetTex) {
      this.penguin.setTexture(targetTex);
    }

    // 1. Movement Vector (Keyboard + Virtual Joystick)
    let mx = this.joyVec.x;
    let my = this.joyVec.y;

    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) mx -= 1;
      if (this.cursors.right.isDown || this.wasd.D.isDown) mx += 1;
      if (this.cursors.up.isDown || this.wasd.W.isDown) my -= 1;
      if (this.wasd.S.isDown || this.cursors.down.isDown) my += 1;
    }

    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }

    const wantsSprint =
      this.mobileSprint || Boolean(this.wasd?.SHIFT.isDown);
    const canSprint = wantsSprint && state.stats.energy > 6 && len > 0.1;
    const baseSpeed = state.hasIceBoots ? 248 : 210;
    const speed = canSprint ? baseSpeed * 1.42 : baseSpeed;

    // Blizzard wind gentle push on northern ridge
    let windDx = 0;
    if (
      (this.currentWeather === 'snowstorm' || this.currentWeather === 'sandstorm') &&
      this.penguin.y < 620
    ) {
      windDx = -24;
    }

    if (len > 0.05) {
      let nextX = this.penguin.x + (mx * speed + windDx) * dt;
      let nextY = this.penguin.y + my * speed * dt;

      // Keep inside island walkable boundary
      nextX = Phaser.Math.Clamp(nextX, 300, WORLD_W - 300);
      nextY = Phaser.Math.Clamp(nextY, 250, WORLD_H - 270);

      // Soft circle collision against trees/landmarks
      for (const obs of this.obstacleCircles) {
        const dx = nextX - obs.x;
        const dy = nextY - obs.y;
        const dist = Math.hypot(dx, dy);
        const minDist = obs.r + 18;
        if (dist < minDist && dist > 0.001) {
          const push = minDist - dist;
          nextX += (dx / dist) * push;
          nextY += (dy / dist) * push;
        }
      }

      this.penguin.setPosition(nextX, nextY);
      this.penguin.setDepth(nextY);
      if (Math.abs(mx) > 0.08) {
        this.penguin.setFlipX(mx < 0);
      }

      // Cute waddle tilt!
      this.waddlePhase += dt * (canSprint ? 15 : 10);
      this.penguin.setAngle(Math.sin(this.waddlePhase) * 6.5);

      // Footprint puffs
      this.footprintTimer -= dt;
      if (this.footprintTimer <= 0) {
        this.footprintTimer = canSprint ? 0.18 : 0.28;
        const fp = this.add
          .image(nextX, nextY + 26, 'fx_footprint')
          .setDepth(5)
          .setAlpha(0.5);
        this.tweens.add({
          targets: fp,
          alpha: 0,
          duration: 1800,
          onComplete: () => fp.destroy(),
        });
      }
    } else {
      this.penguin.setAngle(Phaser.Math.Linear(this.penguin.angle, 0, 0.2));
    }

    // 2. Respawn timers for resources
    for (const res of this.resources) {
      if (!res.available) {
        res.respawnTimer -= dt;
        if (res.respawnTimer <= 0) {
          res.available = true;
          res.sprite.setAlpha(1);
        }
      }
    }

    // 3. Weather cycle
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weatherTimer = Phaser.Math.Between(28, 44);
      const pool = this.region.weatherPool;
      const next = pool[Phaser.Math.Between(0, pool.length - 1)];
      if (next !== this.currentWeather) {
        this.setWeather(next);
        if (next === 'snowstorm' || next === 'sandstorm') {
          this.bridge.onNotify(
            next === 'snowstorm' ? 'Snowstorm Approaching!' : 'Sandstorm Rising!',
            'Stay near a campfire, shelter, or cave to stay warm.',
            'warning'
          );
        }
      }
    }

    // 4. Proximity Zones: Campfires, Shelters, Cave, Thin Ice
    let nearWarmth = false;
    let sheltered = false;

    for (const st of this.structures) {
      const dist = Phaser.Math.Distance.Between(
        this.penguin.x,
        this.penguin.y,
        st.data.x,
        st.data.y
      );
      if (dist < 170) nearWarmth = true;
      if (st.data.type === 'shelter' && dist < 145) sheltered = true;
    }

    const cave = this.landmarks.find((l) => l.kind === 'cave');
    if (
      cave &&
      Phaser.Math.Distance.Between(this.penguin.x, this.penguin.y, cave.x, cave.y) < 165
    ) {
      nearWarmth = true;
      sheltered = true;
    }

    let onThinIce = false;
    if (this.hurtCooldown > 0) this.hurtCooldown -= dt;

    for (const zone of this.thinIceZones) {
      const dx = (this.penguin.x - zone.x) / zone.rx;
      const dy = (this.penguin.y - zone.y) / zone.ry;
      if (dx * dx + dy * dy <= 1) {
        onThinIce = true;
        if (!state.hasIceBoots) {
          zone.crackProgress += dt;
          if (zone.crackProgress > 1.15 && this.hurtCooldown <= 0) {
            zone.crackProgress = 0;
            this.hurtCooldown = 2.0;
            soundFX.playHurt();
            this.cameras.main.shake(180, 0.008);
            this.spawnFloatingText(this.penguin.x, this.penguin.y - 36, 'Thin Ice Crack!', '#7dd3fc');
            this.bridge.updateState((prev) => ({
              ...prev,
              stats: {
                ...prev.stats,
                warmth: Math.max(0, prev.stats.warmth - 12),
                health: Math.max(0, prev.stats.health - 8),
              },
            }));
          }
        }
      } else {
        zone.crackProgress = Math.max(0, zone.crackProgress - dt * 0.5);
      }
    }

    // 5. Day/Night Lighting & Survival Meters
    const dayCycleRate = 1 / 110; // ~110s per full day/night cycle
    let nextTime = state.timeOfDay + dt * dayCycleRate;
    let dayIncrement = 0;
    let survivedNightNow = false;
    if (nextTime >= 1) {
      nextTime -= 1;
    }
    const isNight = nextTime > 0.76 || nextTime < 0.22;
    if (this.lastNightTrack && !isNight && nextTime >= 0.22 && nextTime < 0.35) {
      dayIncrement = 1;
      survivedNightNow = true;
    }
    this.lastNightTrack = isNight;

    // Night darkness overlay math
    let darkAlpha = 0;
    let overlayColor = 0x0b1736;
    if (nextTime >= 0.68 && nextTime < 0.78) {
      // Sunset warm-to-dusk transition
      const t = (nextTime - 0.68) / 0.1;
      darkAlpha = t * 0.42;
      overlayColor = 0x3b1d4a;
    } else if (nextTime >= 0.78 || nextTime < 0.18) {
      darkAlpha = 0.54;
      overlayColor = 0x09132e;
    } else if (nextTime >= 0.18 && nextTime < 0.28) {
      const t = 1 - (nextTime - 0.18) / 0.1;
      darkAlpha = t * 0.54;
      overlayColor = 0x1e293b;
    }
    this.nightOverlay.setFillStyle(overlayColor, darkAlpha);

    // Torch glow on penguin
    const torchActive = state.torchActiveUntilDayTime > 0;
    this.penguinGlow.setPosition(this.penguin.x, this.penguin.y);
    this.penguinGlow.setAlpha(torchActive ? 0.68 : isNight ? 0.22 : 0);

    // Survival Meter Deltas
    const inStorm =
      this.currentWeather === 'snowstorm' || this.currentWeather === 'sandstorm';
    const onBlizzardRidge = this.penguin.y < 560 && this.region.id === 'frozen_island';

    let warmthDelta = -0.75 * this.region.coldMultiplier;
    if (isNight) warmthDelta *= 1.55;
    if (inStorm && !sheltered) warmthDelta *= 1.95;
    if (onBlizzardRidge && !sheltered) warmthDelta *= 1.35;
    if (state.hasFurScarf) warmthDelta *= 0.65;
    if (torchActive) warmthDelta *= 0.45;
    if (nearWarmth) warmthDelta = 12.5;
    else if (sheltered) warmthDelta = 6.0;

    let hungerDelta = len > 0.1 ? -0.58 : -0.3;
    if (canSprint) hungerDelta *= 1.5;

    let energyDelta = canSprint ? -9.5 : len > 0.1 ? -0.45 : 3.2;
    if (nearWarmth) energyDelta += 4.5;

    let healthDelta = 0;
    if (state.stats.hunger <= 0 || state.stats.warmth <= 0) {
      healthDelta = -3.4;
    } else if (state.stats.hunger > 55 && state.stats.warmth > 55) {
      healthDelta = 0.75;
    }

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.25) {
      const stepDt = this.hudSyncTimer;
      this.hudSyncTimer = 0;

      this.bridge.onStatusFlagsChange({
        nearWarmth,
        inStorm,
        onThinIce,
        sheltered,
      });

      let triggeredGameOver = false;

      this.bridge.updateState((prev) => {
        const nextHealth = Phaser.Math.Clamp(
          prev.stats.health + healthDelta * stepDt,
          0,
          100
        );
        if (nextHealth <= 0) triggeredGameOver = true;

        return {
          ...prev,
          timeOfDay: nextTime,
          dayCount: prev.dayCount + dayIncrement,
          survivedNights: prev.survivedNights + (survivedNightNow ? 1 : 0),
          torchActiveUntilDayTime: Math.max(
            0,
            prev.torchActiveUntilDayTime - stepDt
          ),
          stats: {
            health: nextHealth,
            hunger: Phaser.Math.Clamp(prev.stats.hunger + hungerDelta * stepDt, 0, 100),
            energy: Phaser.Math.Clamp(prev.stats.energy + energyDelta * stepDt, 0, 100),
            warmth: Phaser.Math.Clamp(prev.stats.warmth + warmthDelta * stepDt, 0, 100),
          },
        };
      });

      if (survivedNightNow) {
        this.bridge.onAdvanceMission('survive_night', 1);
        this.bridge.onNotify(
          'Survived the Night!',
          'A crisp new morning dawns across the island.',
          'quest'
        );
      }

      if (triggeredGameOver) {
        this.paused = true;
        this.bridge.onGameOver();
      }
    }

    // 6. Find Nearest Interactive Target
    this.updateNearestPrompt(isNight);
  }

  private updateNearestPrompt(isNight: boolean) {
    type Candidate = { dist: number; x: number; y: number; prompt: NearbyPrompt };
    const candidates: Candidate[] = [];

    const consider = (
      dist: number,
      maxDist: number,
      x: number,
      y: number,
      prompt: NearbyPrompt
    ) => {
      if (dist <= maxDist) {
        candidates.push({ dist, x, y, prompt });
      }
    };

    for (const res of this.resources) {
      if (!res.available) continue;
      const d = Phaser.Math.Distance.Between(
        this.penguin.x,
        this.penguin.y,
        res.x,
        res.y
      );
      const labelMap = {
        fish: 'Catch Fish',
        berries: 'Pick Berries',
        wood: 'Chop Wood',
        stone: 'Mine Stone',
      };
      consider(d, 95, res.x, res.y, {
        id: res.id,
        label: labelMap[res.kind],
        kind: res.kind,
      });
    }

    for (const chest of this.chests) {
      if (chest.opened) continue;
      const d = Phaser.Math.Distance.Between(
        this.penguin.x,
        this.penguin.y,
        chest.x,
        chest.y
      );
      consider(d, 100, chest.x, chest.y, {
        id: chest.id,
        label: 'Open Chest',
        kind: 'chest',
      });
    }

    for (const lm of this.landmarks) {
      const d = Phaser.Math.Distance.Between(
        this.penguin.x,
        this.penguin.y,
        lm.x,
        lm.y
      );
      consider(d, 120, lm.x, lm.y, {
        id: lm.id,
        label: lm.kind === 'cave' ? 'Explore Cave' : 'Inspect Landmark',
        sublabel: lm.label,
        kind: lm.kind,
      });
    }

    for (const st of this.structures) {
      const d = Phaser.Math.Distance.Between(
        this.penguin.x,
        this.penguin.y,
        st.data.x,
        st.data.y
      );
      consider(d, 110, st.data.x, st.data.y, {
        id: st.data.id,
        label:
          st.data.type === 'shelter' && isNight
            ? 'Rest Until Dawn'
            : st.data.type === 'shelter'
            ? 'Wooden Shelter'
            : 'Warm Campfire',
        kind: st.data.type,
      });
    }

    candidates.sort((a, b) => a.dist - b.dist);
    const best = candidates[0] || null;

    if (best) {
      this.interactRing.setPosition(best.x, best.y).setVisible(true);
      if (
        !this.activePrompt ||
        this.activePrompt.id !== best.prompt.id ||
        this.activePrompt.label !== best.prompt.label
      ) {
        this.activePrompt = best.prompt;
        this.bridge.onPromptChange(best.prompt);
      }
    } else {
      this.interactRing.setVisible(false);
      if (this.activePrompt !== null) {
        this.activePrompt = null;
        this.bridge.onPromptChange(null);
      }
    }
  }
}
