import { useState, useRef } from 'react';
import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function ActorSelectionScreen({ state, dispatch }: Props) {
  const team = state.teams[state.currentTeamIndex];

  // IE-6: slot-machine shuffle for random pick
  const [shuffling, setShuffling]     = useState(false);
  const [shuffleText, setShuffleText] = useState<string | null>(null);
  const shuffleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRandomPick = () => {
    if (!team?.members.length || shuffling) return;
    setShuffling(true);
    const members = team.members;
    let count = 0;
    const TOTAL = 10;

    shuffleRef.current = setInterval(() => {
      count++;
      setShuffleText(members[Math.floor(Math.random() * members.length)]);
      if (count >= TOTAL) {
        clearInterval(shuffleRef.current!);
        const winner = members[Math.floor(Math.random() * members.length)];
        setShuffleText(winner);
        setShuffling(false);
        // Brief pause so the winner name is seen, then dispatch
        setTimeout(() => {
          dispatch({ type: 'SELECT_ACTOR', actor: winner });
        }, 700);
      }
    }, 75);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh px-6 py-10 screen-enter"
      style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.07) 0%, #0a0a0f 70%)' }}>

      <div className="text-center">
        <div
          className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{ background: 'rgba(124,58,237,0.2)', color: '#c084fc', fontFamily: 'Space Mono, monospace' }}>
          Round {state.round}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center w-full gap-6">
        <div>
          <p className="text-gray-500 text-sm mb-2">Only {team?.name} should see this</p>
          <h1 className="text-4xl font-black text-white"
            style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Who's acting?
          </h1>
        </div>

        {/* IE-6: slot-machine result display */}
        {shuffleText && (
          <div
            className="w-full py-5 rounded-2xl text-2xl font-black text-center animate-fade-in-scale"
            style={{
              background: shuffling
                ? 'rgba(124,58,237,0.12)'
                : 'linear-gradient(135deg, rgba(255,60,111,0.2), rgba(124,58,237,0.15))',
              border: `2px solid ${shuffling ? 'rgba(124,58,237,0.4)' : 'rgba(255,60,111,0.5)'}`,
              color: shuffling ? '#c084fc' : '#ff3c6f',
              fontFamily: 'Outfit, system-ui, sans-serif',
              transition: 'background 0.3s, border-color 0.3s, color 0.3s',
            }}
          >
            {shuffleText}
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          {team?.members.map(member => (
            <button
              key={member}
              onClick={() => dispatch({ type: 'SELECT_ACTOR', actor: member })}
              disabled={shuffling}
              className="w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.08))',
                border: '2px solid rgba(124,58,237,0.3)',
                fontFamily: 'Outfit, system-ui, sans-serif',
              }}>
              {member}
            </button>
          ))}
        </div>

        {/* IE-6: random pick button */}
        <button
          onClick={handleRandomPick}
          disabled={shuffling}
          className="w-full py-3 rounded-xl text-sm font-bold border border-[#2a2a3e] text-gray-400 hover:text-white hover:border-gray-500 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {shuffling ? '🎲 Picking…' : '🎲 Random pick'}
        </button>
      </div>

      <p className="text-gray-600 text-xs text-center">
        Other teams look away while {team?.name} picks
      </p>
    </div>
  );
}
