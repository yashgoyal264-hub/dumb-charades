import type { GameState } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=representation',
};

async function dbInsert(table: string, data: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const rows = await res.json() as Array<{ id: string }>;
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

function dbUpdate(table: string, id: string, data: Record<string, unknown>): void {
  fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  }).catch(() => { /* silent — logging failure must never break gameplay */ });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createSession(state: GameState): Promise<string | null> {
  return dbInsert('sessions', {
    player_count: state.players.length,
    players: state.players,
    categories: state.categories,
    mode: state.mode,
    timer_seconds: state.duration,
    house_rules: state.houseRules,
  });
}

export function logRound(sessionId: string, state: GameState): void {
  const durationMs = state.actingStartTime ? Date.now() - state.actingStartTime : null;
  dbInsert('rounds', {
    session_id: sessionId,
    round_number: state.round,
    actor: state.players[state.currentActorIndex],
    movie: state.currentMovie,
    result: state.lastResult,
    guesser: state.lastGuesser,
    split_guesser: state.lastSplitGuessers.length > 0 ? state.lastSplitGuessers.join(', ') : null,
    actor_points: state.lastActorPoints,
    guesser_points: state.lastGuesserPoints,
    quick_guess: state.lastQuickGuessBonus,
    bonus_round: state.bonusRoundAccepted,
    bonus_value: state.bonusRoundAccepted ? state.bonusRoundValue : null,
    round_duration_ms: durationMs,
  });
}

export function closeSession(sessionId: string, state: GameState): void {
  dbUpdate('sessions', sessionId, {
    ended_at: new Date().toISOString(),
    total_rounds: state.round,
    final_scores: state.scores,
    winner: state.suddenDeathWinner,
    ended_by: state.suddenDeathWinner ? 'sudden_death' : 'end_game',
  });
}
