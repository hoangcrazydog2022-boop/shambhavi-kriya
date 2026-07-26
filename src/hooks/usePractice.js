import { useState, useRef, useCallback, useEffect } from 'react';
import { buildSteps, STEP_TYPES, COMPLETION_AUDIO } from '../lib/steps';
import { useTimer } from './useTimer';
import { useAudio } from './useAudio';

// Practice states
export const PRACTICE_STATES = {
  IDLE: 'idle',
  PLAYING_BELL: 'playing_bell',
  PLAYING_INTRO: 'playing_intro',
  COUNTING: 'counting',
  AUM_PLAYING: 'aum_playing',
  AUM_SILENCE: 'aum_silence',
  COMPLETING: 'completing',
  COMPLETED: 'completed',
};

export function usePractice({ onComplete }) {
  const [practiceState, setPracticeState] = useState(PRACTICE_STATES.IDLE);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [aumCount, setAumCount] = useState(0);

  const timer = useTimer();
  const audio = useAudio();

  // Use refs for values that the async flow needs to avoid stale closures
  const stepsRef = useRef([]);
  const settingsRef = useRef(null);
  const startedAtRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const isPausedRef = useRef(false);
  const isStoppedRef = useRef(false);
  const stepRunIdRef = useRef(0);
  const aumSilenceTimeoutRef = useRef(null);
  const pausedAumSilenceRemaining = useRef(null);
  const aumSilenceStartTime = useRef(null);

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const currentStep = stepsRef.current[currentStepIndex] || null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppedRef.current = true;
      stepRunIdRef.current++;
      if (aumSilenceTimeoutRef.current) {
        clearTimeout(aumSilenceTimeoutRef.current);
      }
    };
  }, []);

  // Start AUM silence gap with pause support
  const startAumSilence = useCallback((duration, onDone, runId) => {
    setPracticeState(PRACTICE_STATES.AUM_SILENCE);
    aumSilenceStartTime.current = Date.now();
    pausedAumSilenceRemaining.current = duration * 1000;

    aumSilenceTimeoutRef.current = setTimeout(() => {
      aumSilenceTimeoutRef.current = null;
      if (!isStoppedRef.current && !isPausedRef.current && (runId === undefined || stepRunIdRef.current === runId)) {
        onDone();
      }
    }, duration * 1000);
  }, []);

  // Run a single AUM cycle (play audio + silence gap)
  const runAumCycle = useCallback(async (step, cycleIndex, runId) => {
    if (isStoppedRef.current || stepRunIdRef.current !== runId) return;

    // Wait if paused
    while (isPausedRef.current && !isStoppedRef.current && stepRunIdRef.current === runId) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (isStoppedRef.current || stepRunIdRef.current !== runId) return;

    setAumCount(cycleIndex + 1);
    setPracticeState(PRACTICE_STATES.AUM_PLAYING);

    // Play AUM audio
    await audio.playAudio(step.aumAudio);

    if (isStoppedRef.current || stepRunIdRef.current !== runId) return;

    // If this is the last cycle, don't add silence gap
    if (cycleIndex >= step.aumRepetitions - 1) return;

    // Wait if paused
    while (isPausedRef.current && !isStoppedRef.current && stepRunIdRef.current === runId) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (isStoppedRef.current || stepRunIdRef.current !== runId) return;

    // Silence gap (inhale)
    await new Promise((resolve) => {
      startAumSilence(step.aumSilenceGap, resolve, runId);
    });
  }, [audio, startAumSilence]);

  // Run a single step - reads steps from ref to avoid stale closures
  const runStep = useCallback(async (stepIndex) => {
    const steps = stepsRef.current;
    if (isStoppedRef.current || stepIndex >= steps.length) return;

    const runId = ++stepRunIdRef.current;
    const step = steps[stepIndex];
    setCurrentStepIndex(stepIndex);

    // 1. Play bell
    setPracticeState(PRACTICE_STATES.PLAYING_BELL);
    await audio.playBell();
    if (isStoppedRef.current || stepRunIdRef.current !== runId) return;

    // 2. Main step action & countdown / AUM cycles
    if (step.type === STEP_TYPES.TIMED) {
      // For TIMED steps, play voice intro in background while countdown runs
      if (step.audioIntro) {
        audio.playAudio(step.audioIntro);
      }
      setPracticeState(PRACTICE_STATES.COUNTING);
      await new Promise((resolve) => {
        timer.start(step.duration, resolve);
      });
    } else if (step.type === STEP_TYPES.AUM) {
      // For AUM step, play voice intro (07_phatamaum.m4a) FIRST
      if (step.audioIntro) {
        setPracticeState(PRACTICE_STATES.PLAYING_INTRO);
        await audio.playAudio(step.audioIntro);
        if (isStoppedRef.current || stepRunIdRef.current !== runId) return;
      }

      // 4-second Inhale (Hít vào...) gap before starting 1st AUM repetition
      await new Promise((resolve) => {
        startAumSilence(step.aumSilenceGap || 4, resolve, runId);
      });
      if (isStoppedRef.current || stepRunIdRef.current !== runId) return;

      // 21 AUM repetitions
      for (let i = 0; i < step.aumRepetitions; i++) {
        if (isStoppedRef.current || stepRunIdRef.current !== runId) return;
        await runAumCycle(step, i, runId);
      }
    }

    if (isStoppedRef.current || stepRunIdRef.current !== runId) return;

    // Move to next step
    if (stepIndex + 1 < steps.length) {
      await runStep(stepIndex + 1);
    } else {
      // All steps completed
      setPracticeState(PRACTICE_STATES.COMPLETING);
      await audio.playBell();
      await audio.playAudio(COMPLETION_AUDIO);
      setPracticeState(PRACTICE_STATES.COMPLETED);

      const settings = settingsRef.current;
      const startedAt = startedAtRef.current;
      if (onCompleteRef.current && startedAt) {
        const completedAt = new Date();
        const totalDuration = Math.round((completedAt - startedAt) / 1000);
        onCompleteRef.current({
          started_at: startedAt.toISOString(),
          completed_at: completedAt.toISOString(),
          total_duration: totalDuration,
          aum_variant: settings?.aumVariant || 5,
          cat_stretch_duration: settings?.catStretchDuration || 270,
          bandha_duration: settings?.bandhaDuration || 150,
        });
      }
    }
  }, [audio, timer, runAumCycle]);

  // Start the practice session
  const startPractice = useCallback((practiceSettings) => {
    isStoppedRef.current = true;
    stepRunIdRef.current++;
    timer.stop();
    audio.stopAll();

    const builtSteps = buildSteps(practiceSettings);
    stepsRef.current = builtSteps;
    settingsRef.current = practiceSettings;
    startedAtRef.current = new Date();
    setCurrentStepIndex(0);
    setAumCount(0);
    isStoppedRef.current = false;
    isPausedRef.current = false;
    audio.init();

    // Start immediately - steps are in ref, no need to wait for state update
    runStep(0);
  }, [audio, timer, runStep]);

  // Pause practice
  const pausePractice = useCallback(() => {
    isPausedRef.current = true;
    timer.pause();
    audio.pauseAll();

    // Handle AUM silence pause
    if (aumSilenceTimeoutRef.current) {
      clearTimeout(aumSilenceTimeoutRef.current);
      const elapsed = Date.now() - aumSilenceStartTime.current;
      pausedAumSilenceRemaining.current = Math.max(0, pausedAumSilenceRemaining.current - elapsed);
    }

    setPracticeState(prev => prev); // Force re-render
  }, [timer, audio]);

  // Resume practice
  const resumePractice = useCallback(() => {
    isPausedRef.current = false;
    timer.resume();
    audio.resumeAll();

    // Resume AUM silence if it was paused
    if (pausedAumSilenceRemaining.current > 0 && aumSilenceTimeoutRef.current === null) {
      aumSilenceStartTime.current = Date.now();
      aumSilenceTimeoutRef.current = setTimeout(() => {
        aumSilenceTimeoutRef.current = null;
        pausedAumSilenceRemaining.current = null;
      }, pausedAumSilenceRemaining.current);
    }
  }, [timer, audio]);

  // Skip to next step
  const skipStep = useCallback(() => {
    stepRunIdRef.current++; // Increment run ID to instantly invalidate active async loop
    timer.stop();
    audio.stopAll();
    if (aumSilenceTimeoutRef.current) {
      clearTimeout(aumSilenceTimeoutRef.current);
      aumSilenceTimeoutRef.current = null;
    }
    isPausedRef.current = false;

    const steps = stepsRef.current;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      runStep(nextIndex);
    } else {
      // Skip on last step = complete
      setPracticeState(PRACTICE_STATES.COMPLETED);
    }
  }, [timer, audio, currentStepIndex, runStep]);

  // Stop practice entirely
  const stopPractice = useCallback(() => {
    isStoppedRef.current = true;
    stepRunIdRef.current++;
    isPausedRef.current = false;
    timer.stop();
    audio.stopAll();
    if (aumSilenceTimeoutRef.current) {
      clearTimeout(aumSilenceTimeoutRef.current);
      aumSilenceTimeoutRef.current = null;
    }
    setCurrentStepIndex(0);
    setAumCount(0);
    startedAtRef.current = null;
    setPracticeState(PRACTICE_STATES.IDLE);
  }, [timer, audio]);

  return {
    // State
    practiceState,
    currentStep,
    currentStepIndex,
    totalSteps: stepsRef.current.length,
    aumCount,
    aumTotal: currentStep?.aumRepetitions || 21,
    timeLeft: timer.timeLeft,
    totalTime: timer.totalTime,
    progress: timer.progress,
    isPaused: isPausedRef.current,
    isActive: practiceState !== PRACTICE_STATES.IDLE && practiceState !== PRACTICE_STATES.COMPLETED,

    // Actions
    startPractice,
    pausePractice,
    resumePractice,
    skipStep,
    stopPractice,
  };
}
