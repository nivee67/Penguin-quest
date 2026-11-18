// Cozy Web Audio API procedural sound effects — zero external audio dependencies.

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled() {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, endFreq),
        now + duration
      );
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.playTone(540, 0.07, 'triangle', 0.08, 0, 680);
  }

  public playGather(kind: 'fish' | 'berries' | 'wood' | 'stone') {
    if (kind === 'fish') {
      this.playTone(340, 0.12, 'sine', 0.12, 0, 620);
      this.playTone(680, 0.14, 'triangle', 0.09, 0.07, 880);
    } else if (kind === 'berries') {
      this.playTone(520, 0.09, 'sine', 0.1, 0, 760);
      this.playTone(790, 0.11, 'sine', 0.08, 0.06, 940);
    } else if (kind === 'wood') {
      this.playTone(170, 0.1, 'triangle', 0.15, 0, 95);
      this.playTone(230, 0.08, 'square', 0.04, 0.04, 120);
    } else {
      this.playTone(310, 0.08, 'square', 0.06, 0, 190);
      this.playTone(460, 0.09, 'triangle', 0.08, 0.04, 290);
    }
  }

  public playEat() {
    this.playTone(420, 0.1, 'sine', 0.1, 0, 560);
    this.playTone(560, 0.12, 'sine', 0.1, 0.09, 720);
  }

  public playCraft() {
    this.playTone(440, 0.11, 'triangle', 0.11, 0);
    this.playTone(554.37, 0.11, 'triangle', 0.11, 0.08);
    this.playTone(659.25, 0.22, 'sine', 0.13, 0.16);
  }

  public playChest() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.24, 'triangle', 0.12, idx * 0.075);
    });
  }

  public playDiscovery() {
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.35, 'sine', 0.11, idx * 0.1);
    });
  }

  public playQuestComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'triangle', 0.12, idx * 0.07);
    });
  }

  public playHurt() {
    this.playTone(180, 0.18, 'sawtooth', 0.08, 0, 90);
  }
}

export const soundFX = new SoundManager();
