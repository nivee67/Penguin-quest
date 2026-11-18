import Phaser from 'phaser';
import { RegionInfo } from './types';

function hexToCss(hex: number, alpha = 1): string {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function makeCanvasTex(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
) {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w, h);
  draw(ctx, w, h);
  tex.refresh();
}

export function generateGameTextures(scene: Phaser.Scene, region: RegionInfo) {
  // 1. Soft radial glow sprite (for campfires, chests, cave, lantern)
  makeCanvasTex(scene, 'fx_glow', 160, 160, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255, 224, 140, 0.95)');
    grad.addColorStop(0.35, 'rgba(255, 165, 70, 0.45)');
    grad.addColorStop(0.7, 'rgba(255, 130, 50, 0.14)');
    grad.addColorStop(1, 'rgba(255, 120, 40, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

  // 2. Soft snowflake / particle dot
  makeCanvasTex(scene, 'fx_snow', 16, 16, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, 7);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.6, 'rgba(225, 244, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

  // 3. Footprint puff
  makeCanvasTex(scene, 'fx_footprint', 18, 12, (ctx) => {
    ctx.fillStyle = 'rgba(148, 178, 206, 0.42)';
    ctx.beginPath();
    ctx.ellipse(9, 6, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. Stylized 3D Penguin Explorer (front/three-quarter cute view, 96x96)
  const drawPenguin = (key: string, furScarf: boolean, hasBoots: boolean) => {
    makeCanvasTex(scene, key, 96, 96, (ctx) => {
      // Soft ground shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.beginPath();
      ctx.ellipse(48, 84, 23, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Backpack behind body (tan leather + rolled sleeping mat)
      ctx.fillStyle = '#92542b';
      ctx.strokeStyle = '#4a2511';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(22, 36, 18, 26, 7);
      ctx.fill();
      ctx.stroke();

      // Sleeping roll on top of backpack
      ctx.fillStyle = '#d4a373';
      ctx.beginPath();
      ctx.roundRect(20, 31, 18, 9, 4);
      ctx.fill();
      ctx.stroke();

      // Little brass compass badge on backpack
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(28, 52, 4, 0, Math.PI * 2);
      ctx.fill();

      // Webbed feet (or Ice Boots!)
      const footColor = hasBoots ? '#38bdf8' : '#f97316';
      const footStroke = hasBoots ? '#0369a1' : '#9a3412';
      ctx.fillStyle = footColor;
      ctx.strokeStyle = footStroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(39, 80, 9, 5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(57, 80, 9, 5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Plump 3D penguin body
      const bodyGrad = ctx.createRadialGradient(42, 34, 6, 48, 52, 34);
      bodyGrad.addColorStop(0, '#334155');
      bodyGrad.addColorStop(0.55, '#1e293b');
      bodyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(48, 51, 24, 29, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Left & Right Flippers
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(24, 54, 6, 13, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(72, 54, 6, 13, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cream white belly
      const bellyGrad = ctx.createLinearGradient(48, 38, 48, 78);
      bellyGrad.addColorStop(0, '#ffffff');
      bellyGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = bellyGrad;
      ctx.beginPath();
      ctx.ellipse(48, 57, 17, 21, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face white patch
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(42, 34, 8, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(54, 34, 8, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glossy Eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(41.5, 33.5, 3.3, 0, Math.PI * 2);
      ctx.arc(54.5, 33.5, 3.3, 0, Math.PI * 2);
      ctx.fill();
      // Eye sparkles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(40.5, 32.3, 1.2, 0, Math.PI * 2);
      ctx.arc(53.5, 32.3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Rosy cheeks
      ctx.fillStyle = 'rgba(251, 113, 133, 0.55)';
      ctx.beginPath();
      ctx.ellipse(35, 38, 3.6, 2.2, 0, 0, Math.PI * 2);
      ctx.ellipse(61, 38, 3.6, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute orange beak
      ctx.fillStyle = '#fb923c';
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(44, 36);
      ctx.lineTo(52, 36);
      ctx.lineTo(48, 42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cozy Orange Knitted Scarf (with fur trim if upgraded!)
      ctx.fillStyle = furScarf ? '#ef4444' : '#f97316';
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2;
      // Trailing scarf tail
      ctx.beginPath();
      ctx.roundRect(54, 44, 10, 20, 4);
      ctx.fill();
      ctx.stroke();
      // Neck wrap
      ctx.beginPath();
      ctx.roundRect(27, 40, 42, 10, 5);
      ctx.fill();
      ctx.stroke();

      // Scarf knit stripes / fur fluff
      ctx.fillStyle = furScarf ? '#fef3c7' : '#fdba74';
      ctx.fillRect(34, 42, 4, 6);
      ctx.fillRect(46, 42, 4, 6);
      ctx.fillRect(57, 56, 5, 4);
    });
  };

  drawPenguin('penguin_base', false, false);
  drawPenguin('penguin_fur', true, false);
  drawPenguin('penguin_boots', false, true);
  drawPenguin('penguin_both', true, true);

  // 5. Stylized 3D Tree (Snowy Pine / Jungle Canopy / Desert Palm / Crystal Pine)
  makeCanvasTex(scene, 'prop_tree', 120, 148, (ctx) => {
    // Drop shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
    ctx.beginPath();
    ctx.ellipse(62, 134, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#6b4423';
    ctx.strokeStyle = '#3e2410';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(51, 98, 18, 36, 4);
    ctx.fill();
    ctx.stroke();

    // 3 tiered lush cones
    const tiers = [
      { y: 86, w: 46, h: 40 },
      { y: 60, w: 38, h: 36 },
      { y: 36, w: 28, h: 32 },
    ];
    tiers.forEach((t, idx) => {
      ctx.fillStyle =
        idx % 2 === 0
          ? hexToCss(region.foliagePrimary)
          : hexToCss(region.foliageSecondary);
      ctx.strokeStyle = '#0f2922';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(60, t.y - t.h);
      ctx.quadraticCurveTo(60 + t.w * 0.65, t.y - 4, 60 + t.w, t.y + 8);
      ctx.quadraticCurveTo(60, t.y + 18, 60 - t.w, t.y + 8);
      ctx.quadraticCurveTo(60 - t.w * 0.65, t.y - 4, 60, t.y - t.h);
      ctx.fill();
      ctx.stroke();

      // Cap highlight (snow/moss/sun)
      ctx.fillStyle = hexToCss(region.foliageCap, 0.94);
      ctx.beginPath();
      ctx.moveTo(60, t.y - t.h + 2);
      ctx.quadraticCurveTo(60 + t.w * 0.4, t.y - t.h * 0.35, 60 + t.w * 0.6, t.y - t.h * 0.15);
      ctx.quadraticCurveTo(60, t.y - t.h * 0.02, 60 - t.w * 0.55, t.y - t.h * 0.18);
      ctx.quadraticCurveTo(60 - t.w * 0.35, t.y - t.h * 0.35, 60, t.y - t.h + 2);
      ctx.fill();
    });
  });

  // 6. Berry Bush
  makeCanvasTex(scene, 'res_berries', 72, 64, (ctx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.ellipse(36, 54, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const puffs = [
      [24, 38, 14],
      [48, 38, 14],
      [36, 29, 17],
      [36, 41, 15],
    ];
    ctx.strokeStyle = '#14332a';
    ctx.lineWidth = 2.5;
    puffs.forEach(([x, y, r]) => {
      ctx.fillStyle = hexToCss(region.foliageSecondary);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Bright berries
    const berries = [
      [25, 34],
      [36, 25],
      [46, 35],
      [32, 42],
      [42, 43],
    ];
    berries.forEach(([bx, by]) => {
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(bx, by, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.arc(bx - 1.2, by - 1.2, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // 7. Wood Log Pile
  makeCanvasTex(scene, 'res_wood', 76, 56, (ctx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.ellipse(38, 46, 27, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawLog = (x: number, y: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = '#854d27';
      ctx.strokeStyle = '#432310';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-22, -7, 44, 14, 6);
      ctx.fill();
      ctx.stroke();
      // Cut end
      ctx.fillStyle = '#e7c697';
      ctx.beginPath();
      ctx.ellipse(19, 0, 4.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    drawLog(36, 38, -0.08);
    drawLog(40, 29, 0.14);
  });

  // 8. Stone Boulder
  makeCanvasTex(scene, 'res_stone', 74, 60, (ctx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
    ctx.beginPath();
    ctx.ellipse(37, 50, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hexToCss(region.rockColor);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(15, 45);
    ctx.lineTo(19, 25);
    ctx.lineTo(35, 16);
    ctx.lineTo(54, 22);
    ctx.lineTo(60, 43);
    ctx.lineTo(44, 50);
    ctx.lineTo(20, 49);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top highlight facet
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(21, 26);
    ctx.lineTo(35, 18);
    ctx.lineTo(51, 23);
    ctx.lineTo(39, 32);
    ctx.closePath();
    ctx.fill();
  });

  // 9. Fishing Spot (Shimmering ice hole / oasis pool with fish!)
  makeCanvasTex(scene, 'res_fish_spot', 92, 68, (ctx) => {
    // Ice/sand rim
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(46, 34, 40, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep water pool
    const poolGrad = ctx.createRadialGradient(46, 32, 4, 46, 34, 34);
    poolGrad.addColorStop(0, '#0ea5e9');
    poolGrad.addColorStop(0.7, '#0369a1');
    poolGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = poolGrad;
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(46, 34, 33, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cute silver-orange fish silhouette inside
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(44, 34, 10, 5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(52, 34);
    ctx.lineTo(59, 29);
    ctx.lineTo(58, 38);
    ctx.closePath();
    ctx.fill();

    // Water shimmer ring
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(38, 30, 12, 0.3, 2.2);
    ctx.stroke();
  });

  // 10. Treasure Chest (Closed & Open)
  const drawChest = (key: string, open: boolean) => {
    makeCanvasTex(scene, key, 72, 68, (ctx) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.ellipse(36, 56, 24, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Base wood box
      ctx.fillStyle = '#92400e';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(14, 30, 44, 24, 5);
      ctx.fill();
      ctx.stroke();

      // Gold trim bands
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(20, 30, 5, 24);
      ctx.fillRect(47, 30, 5, 24);

      if (!open) {
        // Closed arched lid
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.roundRect(13, 19, 46, 15, [10, 10, 3, 3]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(20, 20, 5, 13);
        ctx.fillRect(47, 20, 5, 13);

        // Lock clasp
        ctx.beginPath();
        ctx.roundRect(32, 29, 8, 10, 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Open lid tilted back + golden coins inside
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        ctx.ellipse(36, 30, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(14, 10, 44, 14, [8, 8, 2, 2]);
        ctx.fill();
        ctx.stroke();
      }
    });
  };
  drawChest('prop_chest_closed', false);
  drawChest('prop_chest_open', true);

  // 11. Campfire
  makeCanvasTex(scene, 'prop_campfire', 72, 72, (ctx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(36, 56, 25, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone ring
    const stones = [
      [18, 50],
      [27, 56],
      [38, 57],
      [48, 54],
      [54, 48],
      [22, 43],
      [50, 43],
    ];
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    stones.forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Crossed logs
    ctx.fillStyle = '#78350f';
    ctx.fillRect(24, 44, 24, 6);

    // Outer flame
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(36, 14);
    ctx.quadraticCurveTo(52, 32, 46, 48);
    ctx.quadraticCurveTo(36, 52, 26, 48);
    ctx.quadraticCurveTo(20, 32, 36, 14);
    ctx.fill();

    // Inner bright flame
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(36, 23);
    ctx.quadraticCurveTo(45, 36, 41, 47);
    ctx.quadraticCurveTo(36, 50, 31, 47);
    ctx.quadraticCurveTo(27, 36, 36, 23);
    ctx.fill();
  });

  // 12. Wooden Shelter Cabin
  makeCanvasTex(scene, 'prop_shelter', 148, 136, (ctx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
    ctx.beginPath();
    ctx.ellipse(74, 118, 56, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Timber walls
    ctx.fillStyle = '#9a5b2c';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(28, 56, 92, 60, 6);
    ctx.fill();
    ctx.stroke();

    // Door
    ctx.fillStyle = '#5c2d0c';
    ctx.beginPath();
    ctx.roundRect(60, 74, 28, 42, [8, 8, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Warm glowing window
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.roundRect(37, 74, 16, 16, 3);
    ctx.fill();
    ctx.stroke();

    // Sloped A-frame roof + snow cap
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.moveTo(14, 62);
    ctx.lineTo(74, 18);
    ctx.lineTo(134, 62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hexToCss(region.foliageCap);
    ctx.beginPath();
    ctx.moveTo(19, 57);
    ctx.lineTo(74, 16);
    ctx.lineTo(129, 57);
    ctx.lineTo(120, 62);
    ctx.lineTo(74, 27);
    ctx.lineTo(28, 62);
    ctx.closePath();
    ctx.fill();
  });

  // 13. Hidden Cave Entrance
  makeCanvasTex(scene, 'prop_cave', 180, 148, (ctx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
    ctx.beginPath();
    ctx.ellipse(90, 130, 74, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rock arch mound
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 126);
    ctx.quadraticCurveTo(22, 28, 90, 18);
    ctx.quadraticCurveTo(158, 28, 164, 126);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Snow/moss crown
    ctx.fillStyle = hexToCss(region.foliageCap, 0.92);
    ctx.beginPath();
    ctx.moveTo(30, 56);
    ctx.quadraticCurveTo(90, 10, 150, 56);
    ctx.quadraticCurveTo(124, 48, 90, 54);
    ctx.quadraticCurveTo(54, 48, 30, 56);
    ctx.fill();

    // Dark cavern mouth
    const caveGrad = ctx.createRadialGradient(90, 100, 10, 90, 96, 50);
    caveGrad.addColorStop(0, '#020617');
    caveGrad.addColorStop(0.75, '#0f172a');
    caveGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = caveGrad;
    ctx.beginPath();
    ctx.moveTo(48, 126);
    ctx.quadraticCurveTo(50, 56, 90, 54);
    ctx.quadraticCurveTo(130, 56, 132, 126);
    ctx.closePath();
    ctx.fill();

    // Glowing cyan crystal shards inside cave
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(58, 122);
    ctx.lineTo(64, 98);
    ctx.lineTo(72, 122);
    ctx.fill();

    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.moveTo(110, 122);
    ctx.lineTo(118, 92);
    ctx.lineTo(124, 122);
    ctx.fill();
  });

  // 14. Discovery Landmark (Obelisk / Cairn / Temple Pillar)
  makeCanvasTex(scene, 'prop_landmark', 88, 116, (ctx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
    ctx.beginPath();
    ctx.ellipse(44, 104, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base pedestal
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(22, 82, 44, 22, 5);
    ctx.fill();
    ctx.stroke();

    // Tapered obelisk spire
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(28, 82);
    ctx.lineTo(34, 24);
    ctx.lineTo(44, 12);
    ctx.lineTo(54, 24);
    ctx.lineTo(60, 82);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing rune core
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(44, 48, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.arc(44, 48, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // 15. Cracked Thin Ice Hazard Patch
  makeCanvasTex(scene, 'hazard_thin_ice', 140, 100, (ctx) => {
    ctx.fillStyle = 'rgba(125, 211, 252, 0.55)';
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(70, 50, 62, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fracture cracks
    ctx.strokeStyle = 'rgba(14, 116, 144, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 50);
    ctx.lineTo(35, 32);
    ctx.moveTo(70, 50);
    ctx.lineTo(106, 36);
    ctx.moveTo(70, 50);
    ctx.lineTo(48, 76);
    ctx.lineTo(34, 80);
    ctx.moveTo(70, 50);
    ctx.lineTo(100, 72);
    ctx.stroke();
  });
}
