import { useState, useEffect, useRef } from 'react';
import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

function formatScore(score: number) {
  return score % 1 === 0 ? String(score) : score.toFixed(1);
}

const CONFETTI_COLORS = ['#ff3c6f', '#7c3aed', '#fbbf24', '#10b981', '#3b82f6'];

export function ScoreboardScreen({ state, dispatch }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [confirmEnd,  setConfirmEnd]  = useState(false);

  // VP-5: animate score bars in on entry
  const [barsAnimated, setBarsAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBarsAnimated(true), 60);
    return () => clearTimeout(t);
  }, []);

  // IE-4: detect leader change and fire confetti
  const prevLeaderRef = useRef<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const isTeam = state.isTeamMode;
  const entries: { name: string; score: number }[] = isTeam
    ? state.teams.map(t => ({ name: t.name, score: state.teamScores[t.name] || 0 }))
        .sort((a, b) => b.score - a.score)
    : [...state.players].sort((a, b) => (state.scores[b] || 0) - (state.scores[a] || 0))
        .map(p => ({ name: p, score: state.scores[p] || 0 }));
  const topScore = entries[0]?.score || 0;
  const currentLeader = entries[0]?.name ?? null;

  useEffect(() => {
    if (
      prevLeaderRef.current !== null &&
      prevLeaderRef.current !== currentLeader &&
      currentLeader !== null
    ) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1200);
      return () => clearTimeout(t);
    }
    prevLeaderRef.current = currentLeader;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLeader]);

  const rankEmoji = (i: number) => ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;

  const handleEndGame = () => {
    if (confirmEnd) {
      dispatch({ type: 'RESET_GAME' });
    } else {
      setConfirmEnd(true);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh px-5 py-8 screen-enter overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
          Scoreboard
        </h2>
        <div
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(124,58,237,0.2)',
            color: '#c084fc',
            fontFamily: 'Space Mono, monospace',
          }}
        >
          {state.round - 1} rounds
        </div>
      </div>

      {/* Scores */}
      <div className="flex flex-col gap-2 mb-8 relative">
        {/* IE-4: confetti burst on leader change */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti-burst"
                style={{
                  left: `${8 + (i * 6) % 84}%`,
                  top:  `${5 + (i * 11) % 35}%`,
                  animationDelay: `${(i * 0.06).toFixed(2)}s`,
                  width:  i % 3 === 0 ? 10 : 7,
                  height: i % 3 === 0 ? 10 : 7,
                  borderRadius: i % 2 === 0 ? '50%' : '2px',
                  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                }}
              />
            ))}
          </div>
        )}

        {entries.map((entry, i) => {
          const { name: player, score } = entry;
          const isTop = score === topScore && topScore > 0;
          const pct   = topScore > 0 ? (score / topScore) * 100 : 0;

          return (
            <div
              key={player}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                i === 0 && topScore > 0 ? 'ring-1' : ''
              }`}
              style={{
                background: i === 0 && topScore > 0
                  ? 'rgba(255,60,111,0.1)'
                  : 'rgba(255,255,255,0.04)',
                borderColor: i === 0 && topScore > 0 ? 'rgba(255,60,111,0.3)' : undefined,
                boxShadow:   i === 0 && topScore > 0 ? '0 0 20px rgba(255,60,111,0.12)' : undefined,
              }}
            >
              <span className={`text-2xl w-8 text-center ${i === 0 && topScore > 0 ? 'animate-bounce-in' : ''}`}>
                {rankEmoji(i)}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-white font-bold truncate text-base"
                  style={{ color: isTop ? '#ff3c6f' : 'white' }}
                >
                  {player}
                </p>
                {/* VP-5: score bar animates in with staggered delay */}
                <div className="mt-1 h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: barsAnimated ? `${pct}%` : '0%',
                      background: isTop ? '#ff3c6f' : '#7c3aed',
                      transition: 'width 0.6s ease-out',
                      transitionDelay: `${i * 0.08}s`,
                    }}
                  />
                </div>
              </div>
              <span
                className="text-2xl font-black min-w-[3ch] text-right"
                style={{
                  color: isTop ? '#ff3c6f' : '#e5e7eb',
                  fontFamily: 'Space Mono, monospace',
                }}
              >
                {formatScore(score)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Continue Playing */}
      <button
        onClick={() => dispatch({ type: 'NEXT_ROUND' })}
        className="w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 cursor-pointer mb-8"
        style={{
          background: 'linear-gradient(135deg, #ff3c6f, #7c3aed)',
          boxShadow: '0 0 30px rgba(255,60,111,0.2)',
          fontFamily: 'Outfit, system-ui, sans-serif',
        }}
      >
        Continue Playing
      </button>

      {/* History toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full py-3 text-gray-500 text-sm font-bold border border-[#2a2a3e] rounded-xl cursor-pointer mb-4 hover:text-gray-400 transition-colors"
        style={{ background: 'transparent' }}
      >
        {showHistory ? '▲ Hide History' : '▼ Game History'}
      </button>

      {showHistory && (
        <div className="flex flex-col gap-2 pb-4">
          {state.history.length === 0 ? (
            <p className="text-gray-600 text-sm text-center">No rounds played yet</p>
          ) : (
            [...state.history].reverse().map((entry, i) => (
              <div
                key={i}
                className="p-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-white font-bold">{entry.movie}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    entry.wasFoul  ? 'bg-red-900/40 text-red-400'   :
                    entry.guessedBy ? 'bg-green-900/40 text-green-400' :
                    'bg-gray-800 text-gray-500'
                  }`}>
                    {entry.wasFoul ? '🚫 Foul' : entry.guessedBy ? '✓ Guessed' : '⏰ Timeout'}
                  </span>
                </div>
                <div className="text-gray-500 text-xs">
                  Actor: {entry.actor}
                  {entry.guessedBy && !entry.wasFoul && (
                    <> · {entry.wasSplit ? `Split: ${entry.splitWith}` : `Guessed by: ${entry.guessedBy}`}</>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* P1-7: End Game moved below history — destructive action requires deliberate scroll */}
      <div className="flex flex-col gap-3 py-6 border-t border-[#1a1a2e] mt-2">
        <button
          onClick={handleEndGame}
          className={`w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-95 cursor-pointer border ${
            confirmEnd
              ? 'border-red-500 text-red-400'
              : 'border-[#2a2a3e] text-gray-500'
          }`}
          style={{ background: confirmEnd ? 'rgba(239,68,68,0.1)' : 'transparent' }}
        >
          {confirmEnd ? '⚠️ Confirm End Game' : 'End Game'}
        </button>
        {confirmEnd && (
          <button
            onClick={() => setConfirmEnd(false)}
            className="text-gray-600 text-sm text-center cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
