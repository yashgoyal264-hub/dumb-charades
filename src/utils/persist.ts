import type { GameState } from '../types';

const KEY = 'dumb-charades-v1';

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      ...state,
      usedMovies: [...state.usedMovies],
    }));
  } catch (_) { /* storage unavailable */ }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      usedMovies: new Set<string>(parsed.usedMovies ?? []),
    };
  } catch (_) {
    return null;
  }
}
