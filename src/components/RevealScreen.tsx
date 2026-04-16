import { useState } from 'react';
import type { GameState, GameAction } from '../types';
import { SKIP_COUNT } from '../gameReducer';
import { ScrambleTitle } from './ScrambleTitle';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const CATEGORY_LABEL: Record<string, string> = {
  movies: '🎬 Movie',
  songs: '🎵 Song',
  series: '📺 Series',
};

// Guess which category the current movie is from (best-effort for display)
import contentData from '../data/content.json';

function detectCategory(movie: string): string {
  const allMovies = [...contentData.movies.bollywood.easy, ...contentData.movies.bollywood.hard,
    ...contentData.movies.hollywood.easy, ...contentData.movies.hollywood.hard];
  const allSongs = [...contentData.songs.bollywood.easy, ...contentData.songs.bollywood.hard,
    ...contentData.songs.hollywood.easy, ...contentData.songs.hollywood.hard];

  if (allMovies.includes(movie)) return 'movies';
  if (allSongs.includes(movie)) return 'songs';
  return 'series';
}

export function RevealScreen({ state, dispatch }: Props) {
  const actor = state.players[state.currentActorIndex];
  const categoryKey   = detectCategory(state.currentMovie);
  const categoryLabel = CATEGORY_LABEL[categoryKey] ?? '🎭 Act';

  // IE-8: title starts blurred — tap once to reveal permanently for this round
  const [titleRevealed, setTitleRevealed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh px-6 py-10 screen-enter">
      {/* Warning banner */}
      <div className="w-full py-2.5 rounded-xl text-center text-sm font-bold"
        style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24' }}>
        🔒 Don't show this to anyone!
      </div>

      {/* Actor name */}
      <div className="text-center">
        <p className="text-gray-500 text-base mb-1">You're acting as</p>
        <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
          {actor}
        </p>
      </div>

      {/* Movie / song / series reveal */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 text-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-600">{categoryLabel}</span>
        </div>

        {/* IE-8: tap to reveal title; blurred until first tap */}
        <div
          className="cursor-pointer"
          onClick={() => setTitleRevealed(true)}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          {!titleRevealed && (
            <p className="text-xs text-gray-600 mb-2 animate-pulse">👁 Tap to reveal</p>
          )}
          <h1
            className="text-5xl font-black leading-tight transition-all duration-300"
            key={state.currentMovie}
            style={{
              fontFamily: 'Outfit, system-ui, sans-serif',
              filter: titleRevealed ? 'none' : 'blur(10px)',
              WebkitTouchCallout: 'none',
            }}
          >
            <ScrambleTitle text={state.currentMovie} />
          </h1>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {state.isRecycledMovie && (
            <span className="text-xs text-gray-600 bg-[#1a1a2e] px-3 py-1 rounded-full">
              ♻️ Recycled
            </span>
          )}
          {state.bonusRoundAccepted && (
            <span
              className="text-xs font-black px-3 py-1 rounded-full animate-pulse-urgent"
              style={{ background: 'rgba(255,60,111,0.2)', color: '#ff3c6f' }}
            >
              BONUS ROUND +{state.bonusRoundValue} pts
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={() => dispatch({ type: 'START_ACTING', timestamp: Date.now() })}
          className="w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 0 30px rgba(16,185,129,0.3)',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}
        >
          Start Acting ▶
        </button>

        {!state.houseRules.noSkip && state.skipsRemaining > 0 ? (
          <button
            onClick={() => dispatch({ type: 'SKIP_MOVIE' })}
            className="w-full py-4 rounded-2xl text-base font-bold text-gray-400 border border-[#2a2a3e] transition-all active:scale-95 cursor-pointer hover:border-gray-500"
          >
            Skip ({state.skipsRemaining}/{SKIP_COUNT} left)
          </button>
        ) : (
          <p className="text-center text-gray-600 text-sm py-2">
            {state.houseRules.noSkip ? 'No skips (house rule)' : 'No skips remaining'}
          </p>
        )}
      </div>
    </div>
  );
}
