/**
 * Acoustic Leveling Assistant using Web Audio API
 * Provides progressive sonar-like acoustic feedback:
 * - Continuous beeps whose cadence (frequency of beeps) and pitch increase as the vehicle nears level
 * - Level chime when vehicle is within tolerance
 * - Auto-unlocks AudioContext on Android radio touch interactions
 */

class AudioAssistant {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private pitch: number = 0;
  private roll: number = 0;
  private tolerance: number = 0.4;
  private volume: number = 0.7;
  private lastBeepTime: number = 0;
  private loopIntervalId: number | null = null;

  constructor() {
    this.startLoop();
    this.setupAutoUnlock();
  }

  /**
   * Unlock AudioContext on Android touch or click
   */
  private setupAutoUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.initCtx();
    };

    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.initCtx();
        }
      });
    }
  }

  /**
   * Initialize or resume AudioContext
   */
  public initCtx(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.ctx = new AudioCtxClass();
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (err) {
      console.warn('AudioContext initialization error:', err);
      return null;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initCtx();
      this.playChirp(880, 0.08);
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setTolerance(tol: number) {
    this.tolerance = Math.max(0.05, tol);
  }

  /**
   * Update tilt state
   */
  public updateTilt(pitch: number, roll: number, tolerance?: number) {
    this.pitch = pitch;
    this.roll = roll;
    if (tolerance !== undefined) {
      this.tolerance = tolerance;
    }
  }

  /**
   * Background evaluation loop
   */
  private startLoop() {
    if (this.loopIntervalId !== null || typeof window === 'undefined') return;

    this.loopIntervalId = window.setInterval(() => {
      this.tick();
    }, 35);
  }

  private tick() {
    if (!this.isEnabled) return;
    if (!this.ctx) return;
    if (this.ctx.state !== 'running') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const totalTilt = Math.sqrt(this.pitch * this.pitch + this.roll * this.roll);
    const now = this.ctx.currentTime;

    // 1. PERFECT LEVEL (<= tolerance): Continuous sweet confirmation chime
    if (totalTilt <= this.tolerance) {
      if (now - this.lastBeepTime >= 1.2) {
        this.playLevelTone();
        this.lastBeepTime = now;
      }
      return;
    }

    // 2. APPROACHING LEVEL (tolerance to 6.0°):
    // Cadence and pitch speed up as vehicle approaches level
    if (totalTilt <= 6.0) {
      const ratio = Math.max(0, Math.min(1, (totalTilt - this.tolerance) / (6.0 - this.tolerance)));
      const interval = 0.09 + Math.pow(ratio, 1.3) * 0.91;

      if (now - this.lastBeepTime >= interval) {
        const freq = 1200 - ratio * 650;
        const duration = 0.035 + (1 - ratio) * 0.025;
        this.playBeep(freq, duration);
        this.lastBeepTime = now;
      }
    } else {
      // 3. FAR FROM LEVEL (> 6.0°): Slow periodic tick
      if (now - this.lastBeepTime >= 1.4) {
        this.playBeep(440, 0.05);
        this.lastBeepTime = now;
      }
    }
  }

  private playBeep(freq: number, duration: number) {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      if (ctx.state !== 'running') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch {
      // ignore
    }
  }

  public playChirp(freq: number = 880, duration: number = 0.08) {
    this.initCtx();
    this.playBeep(freq, duration);
  }

  private playLevelTone() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      if (ctx.state !== 'running') {
        ctx.resume().catch(() => {});
      }
      const t = ctx.currentTime;
      const notes = [587.33, 880.0, 1174.66]; // D-major triad

      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.03);

        gain.gain.setValueAtTime(0, t + idx * 0.03);
        gain.gain.linearRampToValueAtTime(this.volume * 0.18, t + idx * 0.03 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + idx * 0.03);
        osc.stop(t + idx * 0.03 + 0.23);
      });
    } catch {
      // ignore
    }
  }
}

export const audioAssistant = new AudioAssistant();
