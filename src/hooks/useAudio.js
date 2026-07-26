import { useRef, useCallback } from 'react';

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

export function useAudio() {
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const bellBufferRef = useRef(null);
  const activeResolveRef = useRef(null);

  // Initialize audio context
  const init = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
          bellBufferRef.current = createBellSound(audioContextRef.current);
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }, []);

  const stopAll = useCallback(() => {
    if (activeResolveRef.current) {
      const resolve = activeResolveRef.current;
      activeResolveRef.current = null;
      resolve();
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
      audioRef.current = null;
    }
  }, []);

  const playBell = useCallback(() => {
    return new Promise((resolve) => {
      try {
        init();
        const ctx = audioContextRef.current;
        if (!ctx || !bellBufferRef.current) {
          setTimeout(resolve, 1000);
          return;
        }
        const source = ctx.createBufferSource();
        source.buffer = bellBufferRef.current;
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
  }, [init]);

  const playAudio = useCallback((src) => {
    return new Promise((resolve) => {
      // Stop any currently playing audio first and resolve pending promise
      stopAll();
      init();

      const audio = new Audio(src);
      audioRef.current = audio;

      let doneCalled = false;
      let safetyTimeout = null;

      const done = () => {
        if (!doneCalled) {
          doneCalled = true;
          activeResolveRef.current = null;
          if (safetyTimeout) clearTimeout(safetyTimeout);
          audio.removeEventListener('ended', done);
          audio.removeEventListener('error', done);
          try {
            audio.pause();
          } catch (e) {}
          resolve();
        }
      };

      activeResolveRef.current = done;

      audio.addEventListener('ended', done);
      audio.addEventListener('error', (e) => {
        console.warn('Audio error on:', src, e);
        done();
      });

      // Safety timeout: fallback if metadata loads or fails
      audio.addEventListener('loadedmetadata', () => {
        const timeoutMs = (audio.duration || 10) * 1000 + 2000;
        safetyTimeout = setTimeout(done, Math.max(3000, timeoutMs));
      });
      safetyTimeout = setTimeout(done, 15000);

      audio.play().catch((e) => {
        console.warn('Audio play blocked/failed for:', src, e);
        done();
      });
    });
  }, [init, stopAll]);

  const getAudioDuration = useCallback((src) => {
    return new Promise((resolve) => {
      const audio = new Audio(src);
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => resolve(0);
    });
  }, []);

  const pauseAll = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {}
    }
  }, []);

  const resumeAll = useCallback(() => {
    if (audioRef.current && audioRef.current.paused && audioRef.current.currentTime > 0) {
      audioRef.current.play().catch(() => {});
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
