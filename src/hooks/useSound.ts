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

  // Clock tick — sharp uniform click, same pitch every second
  const playTick = useCallback((_second: number) => {
    beep(900, 0.03, 0, 0.28);
  }, [beep]);

  // Bell ring at timeout — sustained "tinnnnn" with bell harmonics
  const playBuzzer = useCallback(() => {
    try {
      const c = ctx();
      const now = c.currentTime;

      // Fundamental: 880 Hz, rings for ~2.5s
      const osc1 = c.createOscillator();
      const gain1 = c.createGain();
      osc1.connect(gain1);
      gain1.connect(c.destination);
      osc1.type = 'sine';
      osc1.frequency.value = 880;
      gain1.gain.setValueAtTime(0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc1.start(now);
      osc1.stop(now + 2.6);

      // Bell harmonic: ~2427 Hz (880 × 2.76), decays faster
      const osc2 = c.createOscillator();
      const gain2 = c.createGain();
      osc2.connect(gain2);
      gain2.connect(c.destination);
      osc2.type = 'sine';
      osc2.frequency.value = 2427;
      gain2.gain.setValueAtTime(0.15, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc2.start(now);
      osc2.stop(now + 1.1);

      // Slight shimmer: 883 Hz beating against fundamental
      const osc3 = c.createOscillator();
      const gain3 = c.createGain();
      osc3.connect(gain3);
      gain3.connect(c.destination);
      osc3.type = 'sine';
      osc3.frequency.value = 883;
      gain3.gain.setValueAtTime(0.12, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      osc3.start(now);
      osc3.stop(now + 2.1);
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
