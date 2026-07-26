import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((duration, onComplete) => {
    clearTimer();
    setTotalTime(duration);
    setTimeLeft(duration);
    setIsRunning(true);
    setIsPaused(false);
    onCompleteRef.current = onComplete;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          if (onCompleteRef.current) onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      clearTimer();
      setIsPaused(true);
    }
  }, [isRunning, isPaused, clearTimer]);

  const resume = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsRunning(false);
            if (onCompleteRef.current) onCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    clearTimer();
    setTimeLeft(0);
    setTotalTime(0);
    setIsRunning(false);
    setIsPaused(false);
    onCompleteRef.current = null;
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  return {
    timeLeft,
    totalTime,
    isRunning,
    isPaused,
    progress,
    start,
    pause,
    resume,
    stop,
  };
}
