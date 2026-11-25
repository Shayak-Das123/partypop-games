// Procedural Web Audio API Soundboard for instant, zero-latency party audio

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft tactile UI click / bubble pop
  public playPop(pitchMultiplier: number = 1.0) {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 420 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Card slide / peek sound
  public playSwipe() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  // Timer Tick & Bomb Ticking (wooden block tap / dynamic accelerated pitch)
  public playTick(pitchOrHigh: number | boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    let baseFreq = 587;
    if (typeof pitchOrHigh === 'boolean') {
      baseFreq = pitchOrHigh ? 880 : 587;
    } else if (typeof pitchOrHigh === 'number') {
      baseFreq = Math.min(1600, 650 * pitchOrHigh);
    }

    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  // Fast aerodynamic whoosh sound when phone is physically passed
  public playWhooshPass() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  // Urgent rapid mechanical ticking for Tick-Tick-BOOM
  public playUrgentBombTick(pitchMultiplier: number = 1.0) {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    const freq = 1200 * pitchMultiplier;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    // Highpass filter for sharp mechanical clock click
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  }

  // Forehead Pop! Correct Guess (+1 pt) - Bright joyful major chord arpeggio
  public playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.2);
    });
  }

  // Forehead Pop! Pass / Skip sound (gentle descending tone)
  public playPass() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  // Dramatic Drumroll / Tension pulse before reveal
  public playTensionPulse() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  // Imposter Caught / Buzzer
  public playBuzzer() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.setValueAtTime(130, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  // Fanfare / Celebration
  public playFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [
      { freq: 440, delay: 0 },
      { freq: 554.37, delay: 0.1 },
      { freq: 659.25, delay: 0.2 },
      { freq: 880, delay: 0.35 },
    ];

    chords.forEach(({ freq, delay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.45);
    });
  }

  // Authentic, massive cinematic explosion with detonation crack, sub-bass seismic punch, and roaring rumble
  public playExplosion() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Initial Detonation Crack (sharp TNT shockwave transient)
    try {
      const crackOsc = ctx.createOscillator();
      const crackGain = ctx.createGain();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.setValueAtTime(380, t);
      crackOsc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

      crackGain.gain.setValueAtTime(0.9, t);
      crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      crackOsc.connect(crackGain);
      crackGain.connect(ctx.destination);
      crackOsc.start(t);
      crackOsc.stop(t + 0.1);
    } catch {}

    // 2. Heavy Sub-Bass Seismic Punch (deep chest-thumping low end)
    try {
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(130, t);
      subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.9);

      subGain.gain.setValueAtTime(0.95, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 1.2);
    } catch {}

    // 3. Multi-stage Roaring Blast & Shockwave Noise
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 1.4);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      // Pink/brown noise algorithm for heavier, darker explosion body
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.025 * white) / 1.025;
        lastOut = data[i];
        data[i] *= 3.5; // Amplify for explosive impact
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Resonant sweep filter (blasts from high sizzle down to deep rumble)
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.Q.setValueAtTime(3.0, t);
      noiseFilter.frequency.setValueAtTime(2400, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(65, t + 1.1);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.9, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.35);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(t);
      noise.stop(t + 1.4);
    } catch {}

    // 4. Secondary low-frequency rumble tail (reverberation)
    try {
      const rumbleOsc = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumbleOsc.type = 'triangle';
      rumbleOsc.frequency.setValueAtTime(45, t + 0.15);
      rumbleOsc.frequency.linearRampToValueAtTime(25, t + 1.5);

      rumbleGain.gain.setValueAtTime(0.001, t);
      rumbleGain.gain.linearRampToValueAtTime(0.4, t + 0.2);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(ctx.destination);
      rumbleOsc.start(t + 0.15);
      rumbleOsc.stop(t + 1.5);
    } catch {}
  }

  // Airy swoosh for swipes, card flips, and slide transitions
  public playWhoosh() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.16);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
      filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.16);
      filter.Q.setValueAtTime(1.8, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.16);
    } catch {}
  }

  // Snappy dual-click camera shutter sound
  public playCameraShutter() {
    const ctx = this.getContext();
    if (!ctx) return;

    // First click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1200, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.035);

    // Second click (shutter release) after 45ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, ctx.currentTime + 0.045);
    osc2.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.09);
    gain2.gain.setValueAtTime(0.28, ctx.currentTime + 0.045);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.045);
    osc2.stop(ctx.currentTime + 0.1);
  }

  // Mystical cinematic shimmer when secrets, roles, or locations are revealed
  public playSecretReveal() {
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [
      { freq: 440, delay: 0 },       // A4
      { freq: 554.37, delay: 0.05 }, // C#5
      { freq: 659.25, delay: 0.1 },  // E5
      { freq: 830.61, delay: 0.16 }, // G#5
      { freq: 1108.73, delay: 0.22 },// C#6
    ];

    chords.forEach(({ freq, delay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.55);
    });
  }

  // Ominous dramatic sci-fi zap when sabotage is cast or spy strikes
  public playSabotage() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.45);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.45);

    // Dissonant sub-tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(311, ctx.currentTime); // D#4 (dissonant tritone)
    osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.45);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.45);
  }

  // Heroic, triumphant victory fanfare for mission success or round win
  public playVictory() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, time: 0, dur: 0.12 },     // C5
      { freq: 659.25, time: 0.12, dur: 0.12 },  // E5
      { freq: 783.99, time: 0.24, dur: 0.12 },  // G5
      { freq: 1046.5, time: 0.38, dur: 0.45 },  // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0.24, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  }

  // Joyful coin ding for score points
  public playCoin() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }
}

export const sound = new SoundEngine();
