/**
 * Gander Festival of Flight - Stage Soundboard Engine
 * Supports both MP3 soundboard tracks and Web Audio API synthesis for maximum reliability.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ringInterval = null;

    // Local MP3 soundboard tracks
    this.mp3Tracks = {
      open: new Audio('sounds/case_open.mp3'),
      ring: new Audio('sounds/phone_ring.mp3'),
      banker: new Audio('sounds/banker_offer.mp3'),
      deal: new Audio('sounds/deal.mp3'),
      noDeal: new Audio('sounds/no_deal.mp3'),
      win: new Audio('sounds/win.mp3'),
      theme: new Audio('sounds/theme.mp3')
    };

    // Pre-load audio
    Object.values(this.mp3Tracks).forEach(a => {
      a.preload = 'auto';
    });

    this.mp3Tracks.ring.loop = true;
    this.ambientNodes = [];
    this.ambientInterval = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopAll();
    }
    return this.muted;
  }

  stopAll() {
    this.stopAmbient();
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    Object.values(this.mp3Tracks).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  // Ambient Soundscapes Engine (Flight Deck Hum & Radar Atmospheric Chatter)
  startAmbient(type) {
    this.stopAmbient();
    if (this.muted || !type || type === 'none') return;
    this.initContext();
    if (!this.ctx) return;

    this.ambientNodes = [];
    const now = this.ctx.currentTime;

    if (type === 'flight-hum') {
      // Warm low cabin & jet hum using dual oscillators & lowpass filter
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(110, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);

      gain.gain.setValueAtTime(0.04, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      this.ambientNodes.push(osc1, osc2, gain);
    } else if (type === 'radar-pulse') {
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.03, now);
      gain.connect(this.ctx.destination);

      this.ambientInterval = setInterval(() => {
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.15);
        g.gain.setValueAtTime(0.04, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(g);
        g.connect(gain);
        osc.start(t);
        osc.stop(t + 0.15);
      }, 2500);
    }
  }

  stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientNodes) {
      this.ambientNodes.forEach(node => {
        try { if (node.stop) node.stop(); else if (node.disconnect) node.disconnect(); } catch (e) {}
      });
      this.ambientNodes = [];
    }
  }

  // Play explicit MP3 track with Web Audio synth fallback
  playMp3OrSynth(trackName, synthFallbackFn) {
    if (this.muted) return;
    const mp3 = this.mp3Tracks[trackName];
    if (mp3) {
      mp3.currentTime = 0;
      mp3.play().catch(err => {
        console.warn(`MP3 track '${trackName}' fallback to synth:`, err);
        if (synthFallbackFn) synthFallbackFn();
      });
    } else if (synthFallbackFn) {
      synthFallbackFn();
    }
  }

  // Hover / Selection Chime
  playSelect() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Case Open Sound
  playOpen() {
    this.playMp3OrSynth('open', () => {
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + (idx * 0.05);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    });
  }

  // Telephone Ringing Pattern
  startRing() {
    if (this.muted) return;
    this.mp3Tracks.ring.currentTime = 0;
    this.mp3Tracks.ring.play().catch(() => {
      this.initContext();
      if (!this.ctx || this.ringInterval) return;
      const ringBurst = () => {
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, t);
        osc2.frequency.setValueAtTime(480, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 1.2);
        osc2.stop(t + 1.2);
      };
      ringBurst();
      this.ringInterval = setInterval(ringBurst, 2000);
    });
  }

  stopRing() {
    this.mp3Tracks.ring.pause();
    this.mp3Tracks.ring.currentTime = 0;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  // Banker Tension Sound
  playBanker() {
    this.playMp3OrSynth('banker');
  }

  // Deal Accepted Sound
  playDeal() {
    this.stopRing();
    this.playMp3OrSynth('deal', () => {
      if (!this.ctx) return;
      const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      arpeggio.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + (i * 0.08);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    });
  }

  // No Deal Sound
  playNoDeal() {
    this.stopRing();
    this.playMp3OrSynth('noDeal', () => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    });
  }

  // Victory Fanfare Sound
  playFanfare() {
    this.stopRing();
    this.playMp3OrSynth('win');
  }

  // Stage Theme Background Music
  playTheme() {
    this.playMp3OrSynth('theme');
  }
}

const sounds = new SoundEngine();
