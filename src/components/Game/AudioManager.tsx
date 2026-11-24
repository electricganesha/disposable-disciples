import { useEffect, useRef } from "react";
import { useStore } from "../../store";

// ── Web Audio System for One-Shots (Low Latency, Zero Stutter) ────────────────

class WebAudioSystem {
  private ctx: AudioContext | null = null;
  private buffers: { [url: string]: AudioBuffer } = {};
  private loading: { [url: string]: boolean } = {};

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  async preload(url: string) {
    if (this.buffers[url] || this.loading[url]) return;
    this.loading[url] = true;

    try {
      this.initContext();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      }

      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers[url] = audioBuffer;
    } catch (e) {
      console.error("Failed to preload audio:", url, e);
    } finally {
      this.loading[url] = false;
    }
  }

  play(url: string, volume = 1) {
    this.initContext();
    const buffer = this.buffers[url];
    if (!buffer || !this.ctx) {
      // Fallback to standard Audio if buffer is not loaded yet
      const temp = new Audio(url);
      temp.volume = volume;
      temp.play().catch(() => {});
      return;
    }

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      source.start(0);
    } catch (e) {
      console.error("Failed to play Web Audio:", url, e);
    }
  }
}

const webAudioSystem = new WebAudioSystem();

const oneShot = (url: string, vol = 1) => {
  webAudioSystem.play(url, vol);
};

const createLoop = (url: string, vol = 1): HTMLAudioElement => {
  const a = new Audio(url);
  a.loop = true;
  a.volume = vol;
  return a;
};

const fadeIn = (audio: HTMLAudioElement, target: number, ms = 1500) => {
  audio.volume = 0;
  audio.play().catch(() => {});
  const step = target / (ms / 50);
  const id = setInterval(() => {
    const next = Math.min(audio.volume + step, target);
    audio.volume = next;
    if (next >= target) clearInterval(id);
  }, 50);
  return id;
};

const fadeOut = (audio: HTMLAudioElement, ms = 1000) => {
  const start = audio.volume;
  const step = start / (ms / 50);
  const id = setInterval(() => {
    const next = Math.max(audio.volume - step, 0);
    audio.volume = next;
    if (next <= 0) {
      audio.pause();
      audio.currentTime = 0;
      clearInterval(id);
    }
  }, 50);
  return id;
};

// ── Component ────────────────────────────────────────────────────────────────

export const AudioManager = () => {
  const gameStarted = useStore((s) => s.gameStarted);
  const weavingCount = useStore((s) => s.weavingCount);

  // Loop refs — created once, persist for component lifetime
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const gateRef = useRef<HTMLAudioElement | null>(null);
  const altarRef = useRef<HTMLAudioElement | null>(null);
  const weavingRef = useRef<HTMLAudioElement | null>(null);
  const fadeIdsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearFade = (id: ReturnType<typeof setInterval>) => {
    clearInterval(id);
    fadeIdsRef.current = fadeIdsRef.current.filter((f) => f !== id);
  };

  // ── Create loop tracks once ────────────────────────────────────────────────
  useEffect(() => {
    webAudioSystem.preload("/audio/spawn.mp3");
    webAudioSystem.preload("/audio/success.mp3");
    webAudioSystem.preload("/audio/death.mp3");

    ambientRef.current = createLoop("/audio/ambient.mp3", 0.3);
    gateRef.current = createLoop("/audio/gate_hum.mp3", 0.45);
    altarRef.current = createLoop("/audio/altar_pulse.mp3", 0.4);
    weavingRef.current = createLoop("/audio/weaving.mp3", 0.55);

    return () => {
      // Cleanup on unmount
      [ambientRef, gateRef, altarRef, weavingRef].forEach((r) => {
        if (r.current) {
          r.current.pause();
          r.current.src = "";
        }
      });
      fadeIdsRef.current.forEach(clearInterval);
    };
  }, []);

  // ── Ambient + gate + altar: start when game starts ─────────────────────────
  useEffect(() => {
    if (!gameStarted) return;
    const ids = [
      ambientRef.current && fadeIn(ambientRef.current, 0.3, 2000),
      gateRef.current && fadeIn(gateRef.current, 0.45, 1500),
      altarRef.current && fadeIn(altarRef.current, 0.4, 3000),
    ].filter(Boolean) as ReturnType<typeof setInterval>[];
    fadeIdsRef.current.push(...ids);

    return () => ids.forEach((id) => clearFade(id));
  }, [gameStarted]);

  // ── Weaving sound: on/off based on active weavers ─────────────────────────
  useEffect(() => {
    if (!weavingRef.current) return;
    if (weavingCount > 0) {
      const id = fadeIn(weavingRef.current, 0.55, 600);
      fadeIdsRef.current.push(id);
    } else {
      const id = fadeOut(weavingRef.current, 800);
      fadeIdsRef.current.push(id);
    }
  }, [weavingCount]);

  // ── One-shot: spawn / success / death ─────────────────────────────────────
  useEffect(() => {
    if (!gameStarted) return;
    let lastSpawned = 0;
    let lastSaved = 0;
    let lastLost = 0;

    return useStore.subscribe((state) => {
      if (state.totalSpawned > lastSpawned) {
        oneShot("/audio/spawn.mp3", 0.7);
        lastSpawned = state.totalSpawned;
      }
      if (state.savedCount > lastSaved) {
        oneShot("/audio/success.mp3", 0.9);
        lastSaved = state.savedCount;
      }
      if (state.lostCount > lastLost) {
        oneShot("/audio/death.mp3", 0.8);
        lastLost = state.lostCount;
      }
    });
  }, [gameStarted]);

  return null;
};
