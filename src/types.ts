export type Screen = 'home' | 'setup' | 'pass' | 'bonus' | 'reveal' | 'acting' | 'result' | 'scoreboard';
export type Mode = 'rapid' | 'classic' | 'difficult';
export type Category = 'movies' | 'songs' | 'series';
export type ResultType = 'guessed' | 'timeout' | 'foul' | 'split' | null;

export interface HouseRules {
  noSkip: boolean;
  timeoutPenalty: boolean;
  suddenDeath: boolean;
  suddenDeathTarget: number;
  allowProps: boolean;
}

export interface HistoryEntry {
  movie: string;
  actor: string;
  guessedBy: string | null;
  wasFoul: boolean;
  wasSplit: boolean;
  splitWith?: string;
  isRecycled?: boolean;
  bonusRound?: boolean;
  bonusValue?: number;
  overtimeDuration?: number;
}

export interface GameState {
  screen: Screen;
  players: string[];
  scores: Record<string, number>;
  categories: Category[];
  languages: { bollywood: boolean; hollywood: boolean };
  mode: Mode;
  houseRules: HouseRules;
  currentActorIndex: number;
  currentMovie: string;
  movieQueue: string[];
  movieQueueIndex: number;
  usedMovies: Set<string>;
  round: number;
  skipsRemaining: number;
  history: HistoryEntry[];
  lastResult: ResultType;
  lastGuesser: string | null;
  lastSplitGuesser: string | null;
  lastActorPoints: number;
  lastGuesserPoints: number;
  lastQuickGuessBonus: boolean;
  isRecycledMovie: boolean;
  // Bonus round
  pendingBonusRound: { value: number } | null;
  bonusRoundAccepted: boolean;
  bonusRoundValue: number;
  // Sudden death
  suddenDeathWinner: string | null;
  // Timer
  duration: number;
  actingStartTime: number | null;
}

export type GameAction =
  | { type: 'GO_TO_SCREEN'; screen: Screen }
  | { type: 'SET_PLAYERS'; players: string[] }
  | { type: 'SET_CATEGORIES'; categories: Category[] }
  | { type: 'SET_LANGUAGES'; languages: { bollywood: boolean; hollywood: boolean } }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_HOUSE_RULES'; rules: Partial<HouseRules> }
  | { type: 'START_GAME' }
  | { type: 'SKIP_MOVIE' }
  | { type: 'START_ACTING'; timestamp: number }
  | { type: 'ACCEPT_BONUS' }
  | { type: 'DECLINE_BONUS' }
  | { type: 'CORRECT_GUESS'; guesser: string; timestamp: number }
  | { type: 'SPLIT_GUESS'; guesser1: string; guesser2: string; timestamp: number }
  | { type: 'TIMEOUT' }
  | { type: 'FOUL' }
  | { type: 'NEXT_ROUND'; overtimeDuration?: number }
  | { type: 'RESET_GAME' };
