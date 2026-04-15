import { useRef, useCallback } from 'react';

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ctx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const beep = useCallback((freq: number, duration: number, delay = 0, vol = 0.3) => {
    try {
      const c = ctx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + duration + 0.05);
    } catch (_) { /* audio not available */ }
  }, [ctx]);

  // 3 rapid high beeps — last 3 seconds of timer
  const playTick = useCallback((second: number) => {
    // Pitch rises as urgency increases: 3s=660, 2s=880, 1s=1100
    const freq = second === 3 ? 660 : second === 2 ? 880 : 1100;
    beep(freq, 0.12, 0, 0.25);
  }, [beep]);

  // Harsh buzzer at timeout — sawtooth wave burst
  const playBuzzer = useCallback(() => {
    try {
      const c = ctx();
      // Three descending saw bursts for harshness
      [0, 0.18, 0.36].forEach((delay, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sawtooth';
        osc.frequency.value = 180 - i * 20;
        gain.gain.setValueAtTime(0.35, c.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 0.35);
        osc.start(c.currentTime + delay);
        osc.stop(c.currentTime + delay + 0.4);
      });
    } catch (_) { /* audio not available */ }
  }, [ctx]);

  // Correct guess ding — pleasant ascending chord
  const playCorrect = useCallback(() => {
    beep(523, 0.12, 0,    0.2);  // C5
    beep(659, 0.12, 0.1,  0.2);  // E5
    beep(784, 0.22, 0.2,  0.2);  // G5
  }, [beep]);

  return { playTick, playBuzzer, playCorrect };
}
