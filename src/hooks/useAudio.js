import { useRef, useCallback } from 'react';

// Shared Web Audio API Context and decoded audio buffer cache
let globalAudioContext = null;
let globalBellBuffer = null;
const audioBufferCache = new Map();
let globalAudioElement = null;

// Synthesize a meditation bell sound using Web Audio API
function createBellSound(audioContext) {
  const duration = 2.5;
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  // Bell frequencies (fundamental + overtones)
  const frequencies = [
    { freq: 528, amp: 0.6, decay: 1.8 },   // Fundamental (C5, Solfeggio)
    { freq: 1056, amp: 0.3, decay: 1.2 },  // Octave
    { freq: 1584, amp: 0.15, decay: 0.8 }, // Fifth
    { freq: 2112, amp: 0.08, decay: 0.5 }, // Double octave
  ];

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const { freq, amp, decay } of frequencies) {
      sample += amp * Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / decay);
    }
    // Soft attack
    const attack = Math.min(1, t / 0.005);
    data[i] = sample * attack * 0.4;
  }

  return buffer;
}

// Unlock audio synchronously during user gesture on iOS/Desktop
export function unlockAudioOnIOS() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      if (!globalAudioContext) {
        globalAudioContext = new AudioCtx();
        globalBellBuffer = createBellSound(globalAudioContext);
      }
      if (globalAudioContext.state === 'suspended') {
        globalAudioContext.resume();
      }
    }

    if (!globalAudioElement) {
      globalAudioElement = new Audio();
    }
    // Attempt silent unlock
    globalAudioElement.play().then(() => {
      globalAudioElement.pause();
    }).catch(() => {});
  } catch (e) {
    console.warn('iOS audio unlock error:', e);
  }
}

// Helper to fetch & decode audio file into WebAudio AudioBuffer
async function loadAudioBuffer(src) {
  if (audioBufferCache.has(src)) {
    return audioBufferCache.get(src);
  }
  try {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const AudioCtx = globalAudioContext || new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await AudioCtx.decodeAudioData(arrayBuffer);
    audioBufferCache.set(src, decoded);
    return decoded;
  } catch (e) {
    console.warn('Failed to decode audio via WebAudio:', src, e);
    return null;
  }
}

export function useAudio() {
  const activeResolveRef = useRef(null);
  const activeSourceRef = useRef(null);

  const init = useCallback(() => {
    unlockAudioOnIOS();
  }, []);

  const stopAll = useCallback(() => {
    if (activeResolveRef.current) {
      const resolve = activeResolveRef.current;
      activeResolveRef.current = null;
      resolve();
    }
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
        activeSourceRef.current.disconnect();
      } catch (e) {}
      activeSourceRef.current = null;
    }
    if (globalAudioElement) {
      try {
        globalAudioElement.pause();
        globalAudioElement.currentTime = 0;
      } catch (e) {}
    }
  }, []);

  const playBell = useCallback(() => {
    return new Promise((resolve) => {
      try {
        unlockAudioOnIOS();
        const ctx = globalAudioContext;
        if (!ctx || !globalBellBuffer) {
          setTimeout(resolve, 1000);
          return;
        }
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const source = ctx.createBufferSource();
        source.buffer = globalBellBuffer;
        source.connect(ctx.destination);

        let doneCalled = false;
        const done = () => {
          if (!doneCalled) {
            doneCalled = true;
            resolve();
          }
        };

        source.onended = done;
        source.start(0);
        setTimeout(done, 2600);
      } catch (e) {
        console.warn('Bell playback failed:', e);
        resolve();
      }
    });
  }, []);

  const playAudio = useCallback((src) => {
    return new Promise(async (resolve) => {
      stopAll();
      unlockAudioOnIOS();

      let doneCalled = false;
      let safetyTimeout = null;

      const done = () => {
        if (!doneCalled) {
          doneCalled = true;
          activeResolveRef.current = null;
          activeSourceRef.current = null;
          if (safetyTimeout) clearTimeout(safetyTimeout);
          resolve();
        }
      };

      activeResolveRef.current = done;

      // Primary Method: Web Audio API BufferSource (100% immune to iOS WebKit re-locking!)
      try {
        const ctx = globalAudioContext;
        if (ctx && ctx.state === 'suspended') {
          await ctx.resume();
        }

        const buffer = await loadAudioBuffer(src);
        if (buffer && ctx && ctx.state === 'running') {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          activeSourceRef.current = source;
          source.onended = done;

          const timeoutMs = (buffer.duration || 10) * 1000 + 2000;
          safetyTimeout = setTimeout(done, Math.max(3000, timeoutMs));

          source.start(0);
          return;
        }
      } catch (e) {
        console.warn('WebAudio buffer play failed, falling back to HTML5 Audio:', src, e);
      }

      // Fallback Method: HTML5 Audio Element
      try {
        const audio = globalAudioElement || new Audio();
        globalAudioElement = audio;

        audio.pause();
        audio.src = src;
        try { audio.load(); } catch (e) {}
        audio.currentTime = 0;

        audio.addEventListener('ended', done);
        audio.addEventListener('error', done);

        audio.addEventListener('loadedmetadata', () => {
          const timeoutMs = (audio.duration || 10) * 1000 + 2000;
          safetyTimeout = setTimeout(done, Math.max(3000, timeoutMs));
        });
        safetyTimeout = setTimeout(done, 15000);

        audio.play().catch((e) => {
          console.warn('HTML5 Audio play failed:', src, e);
          done();
        });
      } catch (e) {
        console.warn('HTML5 Audio fallback failed:', src, e);
        done();
      }
    });
  }, [stopAll]);

  const getAudioDuration = useCallback((src) => {
    return new Promise((resolve) => {
      const audio = new Audio(src);
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => resolve(0);
    });
  }, []);

  const pauseAll = useCallback(() => {
    stopAll();
  }, [stopAll]);

  const resumeAll = useCallback(() => {
    if (globalAudioContext && globalAudioContext.state === 'suspended') {
      globalAudioContext.resume().catch(() => {});
    }
  }, []);

  return {
    init,
    playBell,
    playAudio,
    getAudioDuration,
    stopAll,
    pauseAll,
    resumeAll,
  };
}
