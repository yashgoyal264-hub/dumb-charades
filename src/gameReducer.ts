import type { GameState, GameAction, Mode, Category, HouseRules } from './types';
import contentData from './data/content.json';

// ─── Helpers ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const DURATIONS: Record<Mode, number> = { rapid: 15, classic: 30, difficult: 60 };
export const SKIP_COUNT = 1;
const BONUS_VALUES = [1.5, 2, 2.5, 3, 3.5];
const BONUS_TRIGGER_CHANCE = 0.4; // 40% chance per eligible round

function buildContentQueue(
  categories: Category[],
  languages: { bollywood: boolean; hollywood: boolean },
  mode: Mode
): string[] {
  const pool: string[] = [];

  const addFromPool = (easy: string[], hard: string[]) => {
    if (mode === 'rapid') pool.push(...easy);
    else if (mode === 'difficult') pool.push(...hard);
    else { pool.push(...easy, ...hard); }
  };

  for (const cat of categories) {
    if (cat === 'movies') {
      if (languages.bollywood) addFromPool(contentData.movies.bollywood.easy, contentData.movies.bollywood.hard);
      if (languages.hollywood) addFromPool(contentData.movies.hollywood.easy, contentData.movies.hollywood.hard);
    } else if (cat === 'songs') {
      if (languages.bollywood) addFromPool(contentData.songs.bollywood.easy, contentData.songs.bollywood.hard);
      if (languages.hollywood) addFromPool(contentData.songs.hollywood.easy, contentData.songs.hollywood.hard);
    } else if (cat === 'series') {
      // bollywood → indian, hollywood → international
      if (languages.bollywood) addFromPool(contentData.series.indian.easy, contentData.series.indian.hard);
      if (languages.hollywood) addFromPool(contentData.series.international.easy, contentData.series.international.hard);
    }
  }

  return shuffle(pool);
}

function getNextMovie(state: GameState): { movie: string; queue: string[]; queueIndex: number; isRecycled: boolean } {
  let idx = state.movieQueueIndex;
  let queue = state.movieQueue;
  let isRecycled = false;

  if (idx >= queue.length) {
    queue = shuffle([...queue]);
    idx = 0;
    isRecycled = true;
  }

  return { movie: queue[idx], queue, queueIndex: idx + 1, isRecycled };
}

function checkBonusRound(state: GameState, actorIndex: number): { offer: boolean; value: number } {
  const players = state.players;
  if (players.length < 2) return { offer: false, value: 0 };

  const actor = players[actorIndex];
  const scores = state.scores;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const avg = total / players.length;
  const actorScore = scores[actor] || 0;

  if (actorScore >= avg) return { offer: false, value: 0 };
  if (Math.random() > BONUS_TRIGGER_CHANCE) return { offer: false, value: 0 };

  const value = BONUS_VALUES[Math.floor(Math.random() * BONUS_VALUES.length)];
  return { offer: true, value };
}

function checkSuddenDeath(scores: Record<string, number>, rules: HouseRules): string | null {
  if (!rules.suddenDeath) return null;
  const winner = Object.entries(scores).find(([, s]) => s >= rules.suddenDeathTarget);
  return winner ? winner[0] : null;
}

// ─── Initial State ───────────────────────────────────────────────────────────

export const initialState: GameState = {
  screen: 'home',
  players: [],
  scores: {},
  categories: ['movies'],
  languages: { bollywood: true, hollywood: false },
  mode: 'classic',
  houseRules: {
    noSkip: false,
    timeoutPenalty: false,
    suddenDeath: false,
    suddenDeathTarget: 10,
    allowProps: false,
  },
  duration: 30,
  currentActorIndex: 0,
  currentMovie: '',
  movieQueue: [],
  movieQueueIndex: 0,
  usedMovies: new Set(),
  round: 0,
  skipsRemaining: SKIP_COUNT,
  history: [],
  lastResult: null,
  lastGuesser: null,
  lastSplitGuesser: null,
  lastActorPoints: 0,
  lastGuesserPoints: 0,
  lastQuickGuessBonus: false,
  isRecycledMovie: false,
  pendingBonusRound: null,
  bonusRoundAccepted: false,
  bonusRoundValue: 0,
  suddenDeathWinner: null,
  actingStartTime: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'GO_TO_SCREEN':
      return { ...state, screen: action.screen };

    case 'SET_PLAYERS':
      return { ...state, players: action.players };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.categories };

    case 'SET_LANGUAGES':
      return { ...state, languages: action.languages };

    case 'SET_MODE':
      return { ...state, mode: action.mode, duration: DURATIONS[action.mode] };

    case 'SET_DURATION':
      return { ...state, duration: action.duration };

    case 'SET_HOUSE_RULES':
      return { ...state, houseRules: { ...state.houseRules, ...action.rules } };

    // ── Game start ─────────────────────────────────────────────────────────

    case 'START_GAME': {
      const queue = buildContentQueue(state.categories, state.languages, state.mode);
      const scores: Record<string, number> = {};
      state.players.forEach(p => { scores[p] = 0; });
      const { movie, queueIndex, isRecycled } = getNextMovie({ ...state, movieQueue: queue, movieQueueIndex: 0 });
      const bonusCheck = checkBonusRound({ ...state, scores, round: 1 }, 0);
      return {
        ...state,
        screen: 'pass',
        scores,
        movieQueue: queue,
        movieQueueIndex: queueIndex,
        currentMovie: movie,
        currentActorIndex: 0,
        round: 1,
        skipsRemaining: state.houseRules.noSkip ? 0 : SKIP_COUNT,
        history: [],
        lastResult: null,
        lastGuesser: null,
        lastSplitGuesser: null,
        lastActorPoints: 0,
        lastQuickGuessBonus: false,
        usedMovies: new Set([movie]),
        isRecycledMovie: isRecycled,
        pendingBonusRound: bonusCheck.offer ? { value: bonusCheck.value } : null,
        bonusRoundAccepted: false,
        bonusRoundValue: 0,
        suddenDeathWinner: null,
        actingStartTime: null,
      };
    }

    // ── Skip ───────────────────────────────────────────────────────────────

    case 'SKIP_MOVIE': {
      if (state.skipsRemaining <= 0 || state.houseRules.noSkip) return state;
      const { movie, queue, queueIndex, isRecycled } = getNextMovie({ ...state });
      return {
        ...state,
        currentMovie: movie,
        movieQueue: queue,
        movieQueueIndex: queueIndex,
        skipsRemaining: state.skipsRemaining - 1,
        usedMovies: new Set([...state.usedMovies, movie]),
        isRecycledMovie: isRecycled,
      };
    }

    // ── Bonus round ────────────────────────────────────────────────────────

    case 'ACCEPT_BONUS':
      return {
        ...state,
        screen: 'reveal',
        bonusRoundAccepted: true,
        bonusRoundValue: state.pendingBonusRound?.value ?? 0,
        pendingBonusRound: null,
      };

    case 'DECLINE_BONUS':
      return {
        ...state,
        screen: 'reveal',
        bonusRoundAccepted: false,
        bonusRoundValue: 0,
        pendingBonusRound: null,
      };

    // ── Acting ─────────────────────────────────────────────────────────────

    case 'START_ACTING':
      return { ...state, screen: 'acting', actingStartTime: action.timestamp };

    // ── Correct guess ──────────────────────────────────────────────────────

    case 'CORRECT_GUESS': {
      const actor = state.players[state.currentActorIndex];
      const newScores = { ...state.scores };

      // Quick guess check (< 30% of total duration elapsed)
      const duration = state.duration * 1000;
      const elapsed = action.timestamp - (state.actingStartTime ?? action.timestamp);
      const isQuickGuess = elapsed < duration * 0.3;
      const quickBonus = isQuickGuess ? 1 : 0;

      // Actor points: bonus round value OR base 1, plus quick bonus
      const baseActorPts = state.bonusRoundAccepted ? state.bonusRoundValue : 1;
      const actorPts = baseActorPts + quickBonus;
      const guesserPts = 1 + quickBonus;

      newScores[actor] = (newScores[actor] || 0) + actorPts;
      newScores[action.guesser] = (newScores[action.guesser] || 0) + guesserPts;

      const suddenDeathWinner = checkSuddenDeath(newScores, state.houseRules);

      return {
        ...state,
        screen: 'result',
        scores: newScores,
        lastResult: 'guessed',
        lastGuesser: action.guesser,
        lastSplitGuesser: null,
        lastActorPoints: actorPts,
        lastGuesserPoints: guesserPts,
        lastQuickGuessBonus: isQuickGuess,
        suddenDeathWinner,
        history: [...state.history, {
          movie: state.currentMovie,
          actor,
          guessedBy: action.guesser,
          wasFoul: false,
          wasSplit: false,
          bonusRound: state.bonusRoundAccepted,
          bonusValue: state.bonusRoundAccepted ? state.bonusRoundValue : undefined,
        }],
      };
    }

    // ── Split guess ────────────────────────────────────────────────────────

    case 'SPLIT_GUESS': {
      const actor = state.players[state.currentActorIndex];
      const newScores = { ...state.scores };

      const duration = DURATIONS[state.mode] * 1000;
      const elapsed = action.timestamp - (state.actingStartTime ?? action.timestamp);
      const isQuickGuess = elapsed < duration * 0.3;
      const quickBonus = isQuickGuess ? 1 : 0;

      const baseActorPts = state.bonusRoundAccepted ? state.bonusRoundValue : 1;
      const actorPts = baseActorPts + quickBonus;

      newScores[action.guesser1] = (newScores[action.guesser1] || 0) + 0.5 + quickBonus;
      newScores[action.guesser2] = (newScores[action.guesser2] || 0) + 0.5 + quickBonus;
      newScores[actor] = (newScores[actor] || 0) + actorPts;

      const suddenDeathWinner = checkSuddenDeath(newScores, state.houseRules);

      return {
        ...state,
        screen: 'result',
        scores: newScores,
        lastResult: 'split',
        lastGuesser: action.guesser1,
        lastSplitGuesser: action.guesser2,
        lastActorPoints: actorPts,
        lastGuesserPoints: 0.5 + quickBonus,
        lastQuickGuessBonus: isQuickGuess,
        suddenDeathWinner,
        history: [...state.history, {
          movie: state.currentMovie,
          actor,
          guessedBy: action.guesser1,
          wasFoul: false,
          wasSplit: true,
          splitWith: action.guesser2,
          bonusRound: state.bonusRoundAccepted,
          bonusValue: state.bonusRoundAccepted ? state.bonusRoundValue : undefined,
        }],
      };
    }

    // ── Timeout ────────────────────────────────────────────────────────────

    case 'TIMEOUT': {
      const actor = state.players[state.currentActorIndex];
      const newScores = { ...state.scores };

      if (state.bonusRoundAccepted) {
        // Accepted bonus + failed = lose bonus points
        newScores[actor] = (newScores[actor] || 0) - state.bonusRoundValue;
      } else if (state.houseRules.timeoutPenalty) {
        // House rule: -1 for actor on timeout
        newScores[actor] = (newScores[actor] || 0) - 1;
      }

      return {
        ...state,
        screen: 'result',
        scores: newScores,
        lastResult: 'timeout',
        lastGuesser: null,
        lastSplitGuesser: null,
        lastActorPoints: state.bonusRoundAccepted ? -state.bonusRoundValue : (state.houseRules.timeoutPenalty ? -1 : 0),
        lastQuickGuessBonus: false,
        suddenDeathWinner: null,
        history: [...state.history, {
          movie: state.currentMovie,
          actor,
          guessedBy: null,
          wasFoul: false,
          wasSplit: false,
          bonusRound: state.bonusRoundAccepted,
          bonusValue: state.bonusRoundAccepted ? state.bonusRoundValue : undefined,
        }],
      };
    }

    // ── Foul ───────────────────────────────────────────────────────────────

    case 'FOUL': {
      const actor = state.players[state.currentActorIndex];
      return {
        ...state,
        screen: 'result',
        lastResult: 'foul',
        lastGuesser: null,
        lastSplitGuesser: null,
        lastActorPoints: 0,
        lastQuickGuessBonus: false,
        suddenDeathWinner: null,
        history: [...state.history, {
          movie: state.currentMovie,
          actor,
          guessedBy: null,
          wasFoul: true,
          wasSplit: false,
        }],
      };
    }

    // ── Next round ─────────────────────────────────────────────────────────

    case 'NEXT_ROUND': {
      // If sudden death winner exists, go to scoreboard
      if (state.suddenDeathWinner) {
        return { ...state, screen: 'scoreboard' };
      }

      const nextActorIndex = (state.currentActorIndex + 1) % state.players.length;
      const { movie, queue, queueIndex, isRecycled } = getNextMovie({ ...state });
      const bonusCheck = checkBonusRound({ ...state, round: state.round + 1 }, nextActorIndex);

      return {
        ...state,
        screen: 'pass',
        currentActorIndex: nextActorIndex,
        currentMovie: movie,
        movieQueue: queue,
        movieQueueIndex: queueIndex,
        round: state.round + 1,
        skipsRemaining: state.houseRules.noSkip ? 0 : SKIP_COUNT,
        lastResult: null,
        lastGuesser: null,
        lastSplitGuesser: null,
        lastActorPoints: 0,
        lastQuickGuessBonus: false,
        usedMovies: new Set([...state.usedMovies, movie]),
        isRecycledMovie: isRecycled,
        pendingBonusRound: bonusCheck.offer ? { value: bonusCheck.value } : null,
        bonusRoundAccepted: false,
        bonusRoundValue: 0,
        suddenDeathWinner: null,
        actingStartTime: null,
      };
    }

    // ── Reset ──────────────────────────────────────────────────────────────

    case 'RESET_GAME':
      return { ...initialState };

    default:
      return state;
  }
}
