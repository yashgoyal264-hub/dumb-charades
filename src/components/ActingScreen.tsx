import { useState, useEffect, useRef } from 'react';
import type { GameState, GameAction } from '../types';
import { useTimer } from '../hooks/useTimer';
import { useSound } from '../hooks/useSound';
import { Timer } from './Timer';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

function vibrate(pattern: number | number[]) {
  try { navigator.vibrate(pattern); } catch (_) {}
}

export function ActingScreen({ state, dispatch }: Props) {
  const duration = state.duration;
  const actor    = state.players[state.currentActorIndex];
  const guessers = state.isTeamMode
    ? (state.teams[state.currentTeamIndex]?.members ?? []).filter(m => m !== actor)
    : state.players.filter((_, i) => i !== state.currentActorIndex);

  const [splitMode, setSplitMode]   = useState(false);
  const [splitList, setSplitList]   = useState<string[]>([]);

  // P0-3: 3-2-1-Go countdown before timer starts
  const [countdownText, setCountdownText] = useState<string>('3');
  const [countdownDone, setCountdownDone] = useState(false);

  // P0-2: blurred movie title peek
  const [peekVisible, setPeekVisible] = useState(false);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // P0-1: foul hold-to-confirm
  const [foulProgress, setFoulProgress] = useState(0);
  const [foulHolding, setFoulHolding]   = useState(false);
  const foulHoldRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const foulProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // P1-5: one-time split discovery hint
  const [showSplitHint, setShowSplitHint] = useState(false);

  const { playTick } = useSound();

  const { timeLeft, isRunning, progress, color, isUrgent, start } = useTimer({
    duration,
    onComplete: () => dispatch({ type: 'TIMEOUT' }),
    autoStart: false,
  });

  // P0-3: 3 → 2 → 1 → GO! then start timer
  useEffect(() => {
    setCountdownText('3');
    const t1 = setTimeout(() => setCountdownText('2'),  900);
    const t2 = setTimeout(() => setCountdownText('1'),  1800);
    const t3 = setTimeout(() => { setCountdownText('GO!'); start(); }, 2700);
    const t4 = setTimeout(() => setCountdownDone(true), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // P1-5: show split hint once per device lifetime
  useEffect(() => {
    if (state.isTeamMode || guessers.length < 2) return;
    if (localStorage.getItem('dumb-charades-split-hint')) return;
    const t = setTimeout(() => {
      setShowSplitHint(true);
      const hide = setTimeout(() => {
        setShowSplitHint(false);
        localStorage.setItem('dumb-charades-split-hint', '1');
      }, 4000);
      return () => clearTimeout(hide);
    }, 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timeLeft <= 3 && timeLeft > 0 && isRunning) playTick(timeLeft);
  }, [timeLeft, isRunning, playTick]);

  const handleGuess = (guesser: string) => {
    if (splitMode) {
      setSplitList(prev =>
        prev.includes(guesser) ? prev.filter(g => g !== guesser) : [...prev, guesser]
      );
    } else {
      vibrate(80); // IE-1
      dispatch({ type: 'CORRECT_GUESS', guesser, timestamp: Date.now() });
    }
  };

  const confirmSplit = () => {
    if (splitList.length >= 2) {
      vibrate(80); // IE-1
      dispatch({ type: 'SPLIT_GUESS', guessers: splitList, timestamp: Date.now() });
    }
  };

  // P0-1: hold-to-foul
  const startFoulHold = () => {
    setFoulHolding(true);
    setFoulProgress(0);
    const startTime = Date.now();
    const HOLD_MS = 1500;

    foulProgressRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - startTime) / HOLD_MS) * 100, 100);
      setFoulProgress(pct);
    }, 30);

    foulHoldRef.current = setTimeout(() => {
      if (foulProgressRef.current) clearInterval(foulProgressRef.current);
      setFoulHolding(false);
      setFoulProgress(0);
      vibrate([80, 50, 80]); // IE-1
      dispatch({ type: 'FOUL' });
    }, HOLD_MS);
  };

  const cancelFoulHold = () => {
    if (foulHoldRef.current)     clearTimeout(foulHoldRef.current);
    if (foulProgressRef.current) clearInterval(foulProgressRef.current);
    foulHoldRef.current     = null;
    foulProgressRef.current = null;
    setFoulHolding(false);
    setFoulProgress(0);
  };

  // P0-2: peek at movie title for 2s then re-blur
  const handlePeek = () => {
    setPeekVisible(true);
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    peekTimerRef.current = setTimeout(() => setPeekVisible(false), 2000);
  };

  return (
    // VP-3: removed red background tint — urgency is communicated by timer glow + pulse alone
    <div className="flex flex-col items-center min-h-dvh px-5 py-6 screen-enter relative">

      {/* P0-3: fullscreen countdown overlay */}
      {!countdownDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]">
          <span
            key={countdownText}
            className="animate-countdown-pop font-black select-none"
            style={{
              fontFamily: 'Outfit, system-ui, sans-serif',
              fontSize: countdownText === 'GO!' ? '80px' : '120px',
              background: 'linear-gradient(135deg, #ff3c6f, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {countdownText}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest">Round {state.round}</p>
          <p className="text-white font-bold">
            {actor} is acting
            {state.bonusRoundAccepted && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,60,111,0.2)', color: '#ff3c6f' }}>
                Bonus +{state.bonusRoundValue}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* P0-2: blurred movie title peek pill */}
      <button
        onPointerDown={handlePeek}
        className="w-full mb-3 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="text-gray-500 text-xs flex-shrink-0">👁</span>
        <span
          className="text-sm font-bold transition-all duration-300 truncate"
          style={{
            filter:     peekVisible ? 'none'                     : 'blur(7px)',
            color:      peekVisible ? 'white'                    : 'rgba(255,255,255,0.25)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {state.currentMovie}
        </span>
        {!peekVisible && (
          <span className="text-gray-600 text-xs flex-shrink-0">tap</span>
        )}
      </button>

      {/* Timer */}
      <div className="my-4">
        <Timer timeLeft={timeLeft} duration={duration} color={color} isUrgent={isUrgent} />
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#1a1a2e] rounded-full mb-5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%`, background: color }} />
      </div>

      {/* P1-5: one-time split discovery hint */}
      {showSplitHint && (
        <div className="w-full mb-3 px-4 py-2 rounded-xl text-center animate-slide-up"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <p className="text-xs font-bold" style={{ color: '#fbbf24' }}>
            ⚡ Two people guessed at once? Use the Split button below
          </p>
        </div>
      )}

      {/* Instruction */}
      <p className="text-gray-500 text-sm mb-4 text-center">
        {splitMode
          ? splitList.length === 0
            ? 'Tap everyone who guessed'
            : `${splitList.length} selected — tap more or confirm`
          : 'Tap the player who guesses correctly'}
      </p>

      {/* Guesser buttons */}
      <div className="w-full flex flex-col gap-3 mb-auto">
        {guessers.map(guesser => {
          const inSplit = splitList.includes(guesser);
          return (
            <button key={guesser} onClick={() => handleGuess(guesser)}
              className={`w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 cursor-pointer ${
                inSplit ? 'ring-2 ring-yellow-400' : ''
              }`}
              style={{
                background: inSplit
                  ? 'rgba(251,191,36,0.15)'
                  : 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))',
                border: inSplit ? '2px solid #fbbf24' : '2px solid rgba(16,185,129,0.25)',
                fontFamily: 'Outfit, system-ui, sans-serif',
              }}>
              {guesser}
            </button>
          );
        })}
      </div>

      {/* Confirm split */}
      {splitMode && splitList.length >= 2 && (
        <button
          onClick={confirmSplit}
          className="w-full mt-4 py-4 rounded-2xl text-base font-black text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,191,36,0.15))',
            border: '2px solid rgba(251,191,36,0.5)',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}>
          {splitList.length > 2
            ? `Confirm Split (${splitList.length} players)`
            : `Confirm Split — ${splitList.join(' & ')}`}
        </button>
      )}

      {/* Bottom controls */}
      <div className="w-full mt-4 flex gap-3">
        {guessers.length >= 2 && !state.isTeamMode && (
          <button
            onClick={() => { setSplitMode(!splitMode); setSplitList([]); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer border ${
              splitMode ? 'border-yellow-500 text-yellow-400' : 'border-[#2a2a3e] text-gray-500'
            }`}
            style={{ background: splitMode ? 'rgba(251,191,36,0.08)' : 'transparent' }}>
            {splitMode ? 'Cancel Split' : 'Split'}
          </button>
        )}

        {/* P0-1: hold-to-foul with progress indicator and nudge label */}
        <div className="flex-1 relative overflow-hidden rounded-xl">
          <button
            onPointerDown={startFoulHold}
            onPointerUp={cancelFoulHold}
            onPointerLeave={cancelFoulHold}
            className="w-full py-3 rounded-xl text-sm font-bold border border-red-900 transition-colors cursor-pointer select-none"
            style={{
              background: foulHolding ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.05)',
              color: foulHolding ? '#f87171' : '#ef4444',
            }}
          >
            {foulHolding ? 'Hold…' : 'Hold to Foul'}
          </button>
          {/* Hold progress bar */}
          {foulHolding && (
            <div
              className="absolute bottom-0 left-0 h-[3px] bg-red-500 rounded-b-xl"
              style={{ width: `${foulProgress}%`, transition: 'none' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
