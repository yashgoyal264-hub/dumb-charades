import { useEffect, useState } from 'react';
import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const COUNTDOWN = 10;

export function BonusRoundScreen({ state, dispatch }: Props) {
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN);
  const value = state.pendingBonusRound?.value ?? 0;
  const actor = state.players[state.currentActorIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          dispatch({ type: 'DECLINE_BONUS' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const progress = (timeLeft / COUNTDOWN) * 100;

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh px-6 py-10 screen-enter"
      style={{ background: 'radial-gradient(ellipse at center, rgba(255,60,111,0.07) 0%, #0a0a0f 70%)' }}>

      <div className="text-center">
        <p className="text-gray-500 text-sm">{actor}, this is for you</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center w-full gap-6">

        <div className="animate-fade-in-scale">
          <p className="text-xs font-black uppercase tracking-[0.3em] mb-4"
            style={{ color: '#ff3c6f' }}>
            Bonus Round Unlocked
          </p>
          <h1 className="text-8xl font-black text-white leading-none mb-1"
            style={{
              fontFamily: 'Outfit, system-ui, sans-serif',
              textShadow: '0 0 60px rgba(255,60,111,0.4)',
            }}>
            {value}
            <span className="text-4xl text-gray-500 ml-2">pts</span>
          </h1>
          <p className="text-gray-500 text-sm mt-3">if your team guesses it</p>
        </div>

        {/* Risk / reward */}
        <div className="w-full grid grid-cols-2 gap-3 animate-slide-up">
          <div className="p-4 rounded-2xl text-center"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-2xl font-black text-green-400"
              style={{ fontFamily: 'Space Mono, monospace' }}>
              +{value}
            </p>
            <p className="text-xs text-gray-500 mt-1">if guessed</p>
          </div>
          <div className="p-4 rounded-2xl text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-2xl font-black text-red-400"
              style={{ fontFamily: 'Space Mono, monospace' }}>
              −{value}
            </p>
            <p className="text-xs text-gray-500 mt-1">if time runs out</p>
          </div>
        </div>

        <p className="text-gray-600 text-xs">Foul = neutral &nbsp;·&nbsp; Guesser gets standard +1</p>
      </div>

      {/* Auto-skip countdown */}
      <div className="w-full mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Auto-skip in</span>
          <span className="font-bold"
            style={{
              color: timeLeft <= 2 ? '#ef4444' : '#fbbf24',
              fontFamily: 'Space Mono, monospace',
            }}>
            {timeLeft}s
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progress}%`,
              background: timeLeft <= 2 ? '#ef4444' : '#fbbf24',
            }} />
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={() => dispatch({ type: 'ACCEPT_BONUS' })}
          className="w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #ff3c6f, #7c3aed)',
            boxShadow: '0 0 40px rgba(255,60,111,0.3)',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}>
          Accept Bonus — +{value} pts
        </button>

        <button
          onClick={() => dispatch({ type: 'DECLINE_BONUS' })}
          className="w-full py-4 rounded-2xl text-base font-bold text-gray-500 border border-[#2a2a3e] transition-all active:scale-95 cursor-pointer"
          style={{ background: 'transparent' }}>
          Skip, play normal
        </button>
      </div>
    </div>
  );
}
