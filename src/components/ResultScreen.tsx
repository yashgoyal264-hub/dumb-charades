import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function ResultScreen({ state, dispatch }: Props) {
  const { lastResult, lastGuesser, lastSplitGuesser, currentMovie, lastActorPoints,
    lastGuesserPoints, lastQuickGuessBonus, bonusRoundAccepted, bonusRoundValue, suddenDeathWinner } = state;
  const actor = state.players[state.currentActorIndex];

  // Sudden death win overrides everything
  if (suddenDeathWinner) {
    return (
      <div className="flex flex-col items-center justify-between min-h-dvh px-6 py-10 screen-enter">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="animate-bounce-in text-8xl">👑</div>
          <h1
            className="text-5xl font-black text-white"
            style={{ fontFamily: 'Outfit, system-ui, sans-serif', textShadow: '0 0 40px rgba(255,60,111,0.5)' }}
          >
            {suddenDeathWinner} wins!
          </h1>
          <p className="text-gray-400 text-lg">Sudden Death — game over!</p>
          <div className="text-sm text-gray-600">The movie was: <span className="text-white font-bold">{currentMovie}</span></div>
        </div>
        <button
          onClick={() => dispatch({ type: 'GO_TO_SCREEN', screen: 'scoreboard' })}
          className="w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #ff3c6f, #7c3aed)',
            boxShadow: '0 0 40px rgba(255,60,111,0.3)',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}
        >
          See Final Scoreboard 🏆
        </button>
      </div>
    );
  }

  const config = {
    guessed: {
      emoji: '🎉',
      title: `${lastGuesser} got it!`,
      subtitle: `${lastGuesser} +${lastGuesserPoints}  ·  ${actor} +${lastActorPoints}`,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      borderColor: 'rgba(16,185,129,0.25)',
    },
    split: {
      emoji: '⚡',
      title: `Split guess!`,
      subtitle: `${lastGuesser} & ${lastSplitGuesser} +${lastGuesserPoints} each  ·  ${actor} +${lastActorPoints}`,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.1)',
      borderColor: 'rgba(251,191,36,0.25)',
    },
    timeout: {
      emoji: bonusRoundAccepted ? '💸' : '⏰',
      title: bonusRoundAccepted ? `Bonus lost!` : `Time's Up!`,
      subtitle: bonusRoundAccepted
        ? `${actor} −${bonusRoundValue} pts`
        : state.houseRules.timeoutPenalty ? `${actor} −1 pt (house rule)` : 'No points this round',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      borderColor: 'rgba(239,68,68,0.25)',
    },
    foul: {
      emoji: '🚫',
      title: 'Foul!',
      subtitle: 'Round cancelled — no points',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      borderColor: 'rgba(239,68,68,0.25)',
    },
  };

  const c = lastResult ? config[lastResult] : config.timeout;

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh px-6 py-10 screen-enter">
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full gap-4">
        <div className="animate-bounce-in text-7xl mb-2">{c.emoji}</div>

        {/* Main result card */}
        <div
          className="w-full rounded-2xl p-5 animate-fade-in-scale"
          style={{ background: c.bg, border: `1px solid ${c.borderColor}` }}
        >
          <h2
            className="text-3xl font-black mb-1"
            style={{ color: c.color, fontFamily: 'Outfit, system-ui, sans-serif' }}
          >
            {c.title}
          </h2>
          <p className="text-gray-400 text-sm">{c.subtitle}</p>
        </div>

        {/* Badges row */}
        <div className="flex gap-2 flex-wrap justify-center">
          {lastQuickGuessBonus && lastResult === 'guessed' && (
            <div
              className="px-3 py-1.5 rounded-full text-xs font-black animate-slide-up"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
            >
              ⚡ Quick guess! +1 bonus each
            </div>
          )}
          {bonusRoundAccepted && lastResult === 'guessed' && (
            <div
              className="px-3 py-1.5 rounded-full text-xs font-black animate-slide-up"
              style={{ background: 'rgba(255,60,111,0.15)', color: '#ff3c6f', border: '1px solid rgba(255,60,111,0.3)' }}
            >
              🎯 Bonus round: +{bonusRoundValue} to {actor}
            </div>
          )}
        </div>

        {/* Movie name */}
        <div className="w-full rounded-xl p-4 animate-slide-up" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">The answer was</p>
          <p
            className="text-white text-2xl font-black"
            style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
          >
            {currentMovie}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={() => dispatch({ type: 'NEXT_ROUND' })}
          className="w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #ff3c6f, #7c3aed)',
            boxShadow: '0 0 30px rgba(255,60,111,0.2)',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}
        >
          Next Round →
        </button>
        <button
          onClick={() => dispatch({ type: 'GO_TO_SCREEN', screen: 'scoreboard' })}
          className="w-full py-4 rounded-2xl text-base font-bold text-gray-400 border border-[#2a2a3e] transition-all active:scale-95 cursor-pointer"
        >
          View Scoreboard
        </button>
      </div>
    </div>
  );
}
