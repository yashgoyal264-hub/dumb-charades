import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  duration: number;
  onComplete: () => void;
  autoStart?: boolean;
}

export function useTimer({ duration, onComplete, autoStart = false }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    clear();
  }, [clear]);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(duration);
  }, [stop, duration]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clear();
          setIsRunning(false);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clear;
  }, [isRunning, clear]);

  const progress = timeLeft / duration; // 1 = full, 0 = empty

  const color =
    progress > 0.5 ? '#10b981' :
    progress > 0.25 ? '#fbbf24' :
    '#ef4444';

  const isUrgent = timeLeft <= 5 && isRunning;

  return { timeLeft, isRunning, progress, color, isUrgent, start, stop, reset };
}
