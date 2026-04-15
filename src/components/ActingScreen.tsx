import { useState, useEffect } from 'react';
import type { GameState, GameAction } from '../types';
import { useTimer } from '../hooks/useTimer';
import { useSound } from '../hooks/useSound';
import { Timer } from './Timer';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function ActingScreen({ state, dispatch }: Props) {
  const duration = state.duration;
  const actor    = state.players[state.currentActorIndex];
  const guessers = state.players.filter((_, i) => i !== state.currentActorIndex);

  const [splitMode, setSplitMode] = useState(false);
  const [splitList, setSplitList] = useState<string[]>([]);

  const { playTick } = useSound();

  const { timeLeft, isRunning, progress, color, isUrgent, start } = useTimer({
    duration,
    onComplete: () => dispatch({ type: 'TIMEOUT' }),
    autoStart: false,
  });

  useEffect(() => {
    const t = setTimeout(() => start(), 300);
    return () => clearTimeout(t);
  }, [start]);

  // Tick sounds for the last 3 seconds
  useEffect(() => {
    if (timeLeft <= 3 && timeLeft > 0 && isRunning) {
      playTick(timeLeft);
    }
  }, [timeLeft, isRunning, playTick]);

  const handleGuess = (guesser: string) => {
    if (splitMode) {
      // Toggle guesser in/out of split list
      setSplitList(prev =>
        prev.includes(guesser) ? prev.filter(g => g !== guesser) : [...prev, guesser]
      );
    } else {
      dispatch({ type: 'CORRECT_GUESS', guesser, timestamp: Date.now() });
    }
  };

  const confirmSplit = () => {
    if (splitList.length >= 2) {
      dispatch({ type: 'SPLIT_GUESS', guessers: splitList, timestamp: Date.now() });
    }
  };

  return (
    <div
      className="flex flex-col items-center min-h-dvh px-5 py-6 screen-enter transition-colors duration-500"
      style={{ background: isUrgent ? 'rgba(239,68,68,0.07)' : 'transparent' }}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
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
        {!isRunning && timeLeft === duration && (
          <button onClick={start}
            className="text-xs text-gray-500 border border-[#2a2a3e] px-3 py-1.5 rounded-lg cursor-pointer">
            Resume
          </button>
        )}
      </div>

      {/* Timer */}
      <div className="my-4">
        <Timer timeLeft={timeLeft} duration={duration} color={color} isUrgent={isUrgent} />
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#1a1a2e] rounded-full mb-6 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%`, background: color }} />
      </div>

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
                border: inSplit
                  ? '2px solid #fbbf24'
                  : '2px solid rgba(16,185,129,0.25)',
                fontFamily: 'Outfit, system-ui, sans-serif',
              }}>
              {guesser}
            </button>
          );
        })}
      </div>

      {/* Confirm split — appears once 2+ are selected */}
      {splitMode && splitList.length >= 2 && (
        <button
          onClick={confirmSplit}
          className="w-full mt-4 py-4 rounded-2xl text-base font-black text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,191,36,0.15))',
            border: '2px solid rgba(251,191,36,0.5)',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}>
          Confirm Split — {splitList.join(' & ')}
        </button>
      )}

      {/* Bottom controls */}
      <div className="w-full mt-4 flex gap-3">
        {guessers.length >= 2 && (
          <button
            onClick={() => { setSplitMode(!splitMode); setSplitList([]); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer border ${
              splitMode ? 'border-yellow-500 text-yellow-400' : 'border-[#2a2a3e] text-gray-500'
            }`}
            style={{ background: splitMode ? 'rgba(251,191,36,0.08)' : 'transparent' }}>
            {splitMode ? 'Cancel Split' : 'Split'}
          </button>
        )}
        <button
          onClick={() => dispatch({ type: 'FOUL' })}
          className="flex-1 py-3 rounded-xl text-sm font-bold border border-red-900 text-red-500 transition-all active:scale-95 cursor-pointer"
          style={{ background: 'rgba(239,68,68,0.05)' }}>
          Foul
        </button>
      </div>
    </div>
  );
}
