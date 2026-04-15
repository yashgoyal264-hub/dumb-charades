import type { GameState, GameAction, Mode, Category, HouseRules, Team } from './types';
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
  const actor = state.players[actorIndex];

  let actorScore: number;
  let avg: number;

  if (state.isTeamMode) {
    // Hidden individual actor scores — teams never see this logic
    const scores = state.individualActorScores;
    const vals = Object.values(scores);
    if (vals.length < 2) return { offer: false, value: 0 };
    avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    actorScore = scores[actor] || 0;
  } else {
    const players = state.players;
    if (players.length < 2) return { offer: false, value: 0 };
    avg = Object.values(state.scores).reduce((a, b) => a + b, 0) / players.length;
    actorScore = state.scores[actor] || 0;
  }

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
  lastSplitGuessers: [],
  lastActorPoints: 0,
  lastGuesserPoints: 0,
  lastQuickGuessBonus: false,
  isRecycledMovie: false,
  pendingBonusRound: null,
  bonusRoundAccepted: false,
  bonusRoundValue: 0,
  suddenDeathWinner: null,
  actingStartTime: null,
  sessionId: null,
  isTeamMode: false,
  teams: [],
  actingMode: 'random',
  currentTeamIndex: 0,
  teamActorCursors: {},
  teamScores: {},
  individualActorScores: {},
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
        lastSplitGuessers: [],
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

      const elapsed = action.timestamp - (state.actingStartTime ?? action.timestamp);
      const isQuickGuess = elapsed < state.duration * 1000 * 0.3;
      const quickBonus = isQuickGuess ? 1 : 0;
      const baseActorPts = state.bonusRoundAccepted ? state.bonusRoundValue : 1;
      const actorPts = baseActorPts + quickBonus;

      const historyEntry = {
        movie: state.currentMovie, actor,
        guessedBy: action.guesser, wasFoul: false, wasSplit: false,
        bonusRound: state.bonusRoundAccepted,
        bonusValue: state.bonusRoundAccepted ? state.bonusRoundValue : undefined,
      };

      if (state.isTeamMode) {
        const teamName = state.teams[state.currentTeamIndex].name;
        const newTeamScores = { ...state.teamScores, [teamName]: (state.teamScores[teamName] || 0) + actorPts };
        const newIndividual = { ...state.individualActorScores, [actor]: (state.individualActorScores[actor] || 0) + actorPts };
        return {
          ...state, screen: 'result',
          teamScores: newTeamScores, individualActorScores: newIndividual,
          lastResult: 'guessed', lastGuesser: action.guesser, lastSplitGuessers: [],
          lastActorPoints: actorPts, lastGuesserPoints: 0,
          lastQuickGuessBonus: isQuickGuess,
          suddenDeathWinner: checkSuddenDeath(newTeamScores, state.houseRules),
          history: [...state.history, historyEntry],
        };
      }

      const guesserPts = 1 + quickBonus;
      const newScores = { ...state.scores };
      newScores[actor] = (newScores[actor] || 0) + actorPts;
      newScores[action.guesser] = (newScores[action.guesser] || 0) + guesserPts;
      return {
        ...state, screen: 'result', scores: newScores,
        lastResult: 'guessed', lastGuesser: action.guesser, lastSplitGuessers: [],
        lastActorPoints: actorPts, lastGuesserPoints: guesserPts,
        lastQuickGuessBonus: isQuickGuess,
        suddenDeathWinner: checkSuddenDeath(newScores, state.houseRules),
        history: [...state.history, historyEntry],
      };
    }

    // ── Split guess ────────────────────────────────────────────────────────

    case 'SPLIT_GUESS': {
      const actor = state.players[state.currentActorIndex];
      const newScores = { ...state.scores };

      const duration = state.duration * 1000;
      const elapsed = action.timestamp - (state.actingStartTime ?? action.timestamp);
      const isQuickGuess = elapsed < duration * 0.3;
      // Split quick bonus is +0.5 per guesser (not +1)
      const splitQuickBonus = isQuickGuess ? 0.5 : 0;

      const baseActorPts = state.bonusRoundAccepted ? state.bonusRoundValue : 1;
      const actorPts = baseActorPts + (isQuickGuess ? 1 : 0);
      const guesserPts = 0.5 + splitQuickBonus;

      action.guessers.forEach(g => {
        newScores[g] = (newScores[g] || 0) + guesserPts;
      });
      newScores[actor] = (newScores[actor] || 0) + actorPts;

      const suddenDeathWinner = checkSuddenDeath(newScores, state.houseRules);

      return {
        ...state,
        screen: 'result',
        scores: newScores,
        lastResult: 'split',
        lastGuesser: action.guessers[0],
        lastSplitGuessers: action.guessers,
        lastActorPoints: actorPts,
        lastGuesserPoints: guesserPts,
        lastQuickGuessBonus: isQuickGuess,
        suddenDeathWinner,
        history: [...state.history, {
          movie: state.currentMovie,
          actor,
          guessedBy: action.guessers[0],
          wasFoul: false,
          wasSplit: true,
          splitWith: action.guessers.join(' & '),
          bonusRound: state.bonusRoundAccepted,
          bonusValue: state.bonusRoundAccepted ? state.bonusRoundValue : undefined,
        }],
      };
    }

    // ── Timeout ────────────────────────────────────────────────────────────

    case 'TIMEOUT': {
      const actor = state.players[state.currentActorIndex];
      const penalty = state.bonusRoundAccepted
        ? -state.bonusRoundValue
        : state.houseRules.timeoutPenalty ? -1 : 0;

      const historyEntry = {
        movie: state.currentMovie, actor, guessedBy: null, wasFoul: false, wasSplit: false,
        bonusRound: state.bonusRoundAccepted,
        bonusValue: state.bonusRoundAccepted ? state.bonusRoundValue : undefined,
      };

      if (state.isTeamMode) {
        const teamName = state.teams[state.currentTeamIndex].name;
        const newTeamScores = { ...state.teamScores, [teamName]: (state.teamScores[teamName] || 0) + penalty };
        const newIndividual = { ...state.individualActorScores, [actor]: (state.individualActorScores[actor] || 0) + penalty };
        return {
          ...state, screen: 'result',
          teamScores: newTeamScores, individualActorScores: newIndividual,
          lastResult: 'timeout', lastGuesser: null, lastSplitGuessers: [],
          lastActorPoints: penalty, lastQuickGuessBonus: false, suddenDeathWinner: null,
          history: [...state.history, historyEntry],
        };
      }

      const newScores = { ...state.scores };
      newScores[actor] = (newScores[actor] || 0) + penalty;
      return {
        ...state, screen: 'result', scores: newScores,
        lastResult: 'timeout', lastGuesser: null, lastSplitGuessers: [],
        lastActorPoints: penalty, lastQuickGuessBonus: false, suddenDeathWinner: null,
        history: [...state.history, historyEntry],
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
        lastSplitGuessers: [],
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
      if (state.suddenDeathWinner) return { ...state, screen: 'scoreboard' };

      const historyWithOvertime = action.overtimeDuration !== undefined && state.history.length > 0
        ? state.history.map((entry, i) =>
            i === state.history.length - 1 ? { ...entry, overtimeDuration: action.overtimeDuration } : entry
          )
        : state.history;

      const { movie, queue, queueIndex, isRecycled } = getNextMovie({ ...state });
      const roundBase = {
        currentMovie: movie, movieQueue: queue, movieQueueIndex: queueIndex,
        round: state.round + 1,
        skipsRemaining: state.houseRules.noSkip ? 0 : SKIP_COUNT,
        history: historyWithOvertime,
        lastResult: null as null, lastGuesser: null, lastSplitGuessers: [] as string[],
        lastActorPoints: 0, lastQuickGuessBonus: false,
        usedMovies: new Set([...state.usedMovies, movie]),
        isRecycledMovie: isRecycled,
        bonusRoundAccepted: false, bonusRoundValue: 0,
        suddenDeathWinner: null, actingStartTime: null,
      };

      if (state.isTeamMode) {
        const nextTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
        const nextTeam = state.teams[nextTeamIndex];

        if (state.actingMode === 'team_choice') {
          return { ...state, ...roundBase, screen: 'pass', currentTeamIndex: nextTeamIndex, pendingBonusRound: null };
        }
        // random: use cursor-based rotation
        const cursor = state.teamActorCursors[nextTeam.name] ?? 0;
        const nextActorName = nextTeam.members[cursor % nextTeam.members.length];
        const nextActorIndex = state.players.indexOf(nextActorName);
        const nextCursors = { ...state.teamActorCursors, [nextTeam.name]: cursor + 1 };
        const nextState = { ...state, ...roundBase, currentTeamIndex: nextTeamIndex, currentActorIndex: nextActorIndex, teamActorCursors: nextCursors };
        const bonusCheck = checkBonusRound(nextState, nextActorIndex);
        return { ...nextState, screen: 'pass', pendingBonusRound: bonusCheck.offer ? { value: bonusCheck.value } : null };
      }

      // Individual mode
      const nextActorIndex = (state.currentActorIndex + 1) % state.players.length;
      const bonusCheck = checkBonusRound({ ...state, ...roundBase }, nextActorIndex);
      return {
        ...state, ...roundBase, screen: 'pass',
        currentActorIndex: nextActorIndex,
        pendingBonusRound: bonusCheck.offer ? { value: bonusCheck.value } : null,
      };
    }

    // ── Reset ──────────────────────────────────────────────────────────────

    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.sessionId };

    case 'SET_TEAM_MODE':
      return { ...state, isTeamMode: action.isTeamMode };

    case 'SET_ACTING_MODE':
      return { ...state, actingMode: action.mode };

    // ── Team game start ────────────────────────────────────────────────────
    case 'START_TEAM_GAME': {
      const teams: Team[] = action.teams;
      const queue = buildContentQueue(state.categories, state.languages, state.mode);
      const teamScores: Record<string, number> = {};
      const individualActorScores: Record<string, number> = {};
      const teamActorCursors: Record<string, number> = {};
      teams.forEach(t => {
        teamScores[t.name] = 0;
        teamActorCursors[t.name] = 0;
        t.members.forEach(m => { individualActorScores[m] = 0; });
      });

      const { movie, queueIndex, isRecycled } = getNextMovie({ ...state, movieQueue: queue, movieQueueIndex: 0 });
      const firstTeam = teams[0];

      let currentActorIndex = 0;
      let cursors = { ...teamActorCursors };
      if (state.actingMode === 'random') {
        currentActorIndex = state.players.indexOf(firstTeam.members[0]);
        cursors[firstTeam.name] = 1;
      }

      return {
        ...state,
        screen: 'pass',
        teams,
        teamScores,
        individualActorScores,
        teamActorCursors: cursors,
        currentTeamIndex: 0,
        currentActorIndex,
        movieQueue: queue,
        movieQueueIndex: queueIndex,
        currentMovie: movie,
        round: 1,
        skipsRemaining: state.houseRules.noSkip ? 0 : SKIP_COUNT,
        scores: Object.fromEntries(state.players.map(p => [p, 0])),
        history: [],
        lastResult: null,
        lastGuesser: null,
        lastSplitGuessers: [],
        lastActorPoints: 0,
        lastQuickGuessBonus: false,
        usedMovies: new Set([movie]),
        isRecycledMovie: isRecycled,
        pendingBonusRound: null,
        bonusRoundAccepted: false,
        bonusRoundValue: 0,
        suddenDeathWinner: null,
        actingStartTime: null,
        sessionId: null,
      };
    }

    // ── Actor selection (team_choice mode) ─────────────────────────────────
    case 'SELECT_ACTOR': {
      const actorIndex = state.players.indexOf(action.actor);
      const newState = { ...state, currentActorIndex: actorIndex };
      const bonusCheck = checkBonusRound(newState, actorIndex);
      return {
        ...newState,
        screen: bonusCheck.offer ? 'bonus' : 'reveal',
        pendingBonusRound: bonusCheck.offer ? { value: bonusCheck.value } : null,
        bonusRoundAccepted: false,
        bonusRoundValue: 0,
      };
    }

    case 'RESET_GAME':
      return { ...initialState };

    default:
      return state;
  }
}
