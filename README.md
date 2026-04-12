# Dumb Charades PWA

> Act it out. Guess it fast. No teams needed.

A fully offline-first Progressive Web App for playing Dumb Charades at house parties. No backend, no accounts, no internet required after the first load. Built to be handed around a room on a single phone.

Live: [dumb-charades.vercel.app](https://dumb-charades.vercel.app)

---

## The Problem This Solves

Every group playing dumb charades hits the same three walls:

1. **Blank minds** — nobody can think of a movie name on the spot
2. **Odd numbers** — classic team format breaks with 3, 5, or 7 people
3. **Score disputes** — someone always "forgets" the count

This app removes all three. It feeds the movie to the actor, works with any group size (2–10), and tracks scores automatically. The phone does the admin; the people do the fun.

---

## Core Design Ideology

**Party-first, not feature-first.** Every decision was measured against one question: does this make the room more alive? Anything that added friction, required reading, or needed internet was cut.

**One phone, shared.** The app is designed around a single device being passed around. Each screen is purpose-built for who's holding it at that moment — the actor sees something different from what the guessers see. The "Pass the Phone" screen exists specifically so others look away before the movie is revealed.

**Dark, dramatic, tactile.** Party games need energy. The design uses deep dark backgrounds, bold typography, large tap targets (min 48px — actor is standing, one-handed), color-coded urgency on the timer, and a scramble animation on movie reveal to create a "drum roll" moment.

**Zero persistence by design.** No login, no database, no cloud sync. State lives in React's `useReducer`. When the game ends, it's gone. That's the right call for a party game — nobody wants to sign in to play charades.

---

## Screen Flow

```
Home → Setup → Pass Phone → [Bonus Round?] → Reveal → Acting → Result → Scoreboard
                                                ↑                           ↓
                                           (loops back via Next Round) ←───┘
```

### Screen-by-screen logic

**Home** — Single CTA, abstract geometric logo, no clutter.

**Setup** — Players (2–10, chip UI), Categories (Movies / Songs / Series, multi-select), Region (Bollywood/Indian · Hollywood/International), Mode (Rapid / Classic / Difficult), Timer wheel (custom duration, Apple drum-roll style picker in 5s steps), House Rules (collapsible).

**Pass Phone** — Shows actor's name in huge text. Everyone else looks away. The CTA is deliberately large and labeled for the actor only.

**Bonus Round** (conditional) — Appears between Pass Phone and Reveal, but only for players below the group average score, and only at random (40% chance per eligible round). A random bonus value (1.5 / 2 / 2.5 / 3 / 3.5 pts) is offered. Actor has 10 seconds to accept or skip. Risk is explicit: "+X if guessed / −X if time runs out." Foul is always neutral.

**Reveal** — Actor-only screen. Movie title scrambles in character-by-character (750ms, symbols lock into real letters left to right). Shows bonus round badge if active, recycled badge if movie has looped.

**Acting** — Circular countdown timer changes green → yellow → red. Whole screen flushes red at <5s. Guesser names shown as large tappable buttons. Split mode for simultaneous guesses. Foul button (small, bottom). Timer uses the custom duration set in setup.

**Result** — Shows outcome (guessed / timeout / foul / split), exact points for each player, quick guess badge if applicable, bonus round breakdown if active. Sudden Death winner gets a full-screen takeover.

**Scoreboard** — Ranked with score bars, game history toggle (newest first), Continue / End Game (with confirm step).

---

## Scoring System

| Event | Actor | Guesser |
|---|---|---|
| Correct guess | +1 | +1 |
| Correct guess (quick, <30% of timer) | +2 | +2 |
| Split guess (two simultaneous) | +1 | +0.5 each |
| Timeout (no house rule) | 0 | — |
| Timeout (house rule on) | −1 | — |
| Bonus round accepted + guessed | +bonus value | +1 |
| Bonus round accepted + timeout | −bonus value | — |
| Bonus round accepted + foul | 0 | — |
| Foul | 0 | — |
| Skip | 0 | — |

Scores are floats (`number` type), not integers — split guesses and bonus values like 1.5 / 2.5 require this. Display uses `score % 1 === 0 ? String(score) : score.toFixed(1)`.

Scores can go **negative** (bonus round loss, timeout penalty). No floor.

---

## Bonus Round — Design Rationale

The bonus round exists to keep losing players in the game emotionally. Once someone falls behind, charades can feel like a foregone conclusion. The bonus round gives the bottom players a shot at a dramatic comeback — but with genuine risk. The actor chooses to gamble, making it a game-within-the-game moment.

Key design decisions:
- **Only offered to below-average players** — not the leader, not random. Targeted help.
- **Random trigger (40%)** — not every round, so it feels like a surprise, not a mechanic.
- **Actor chooses the risk** — not forced. Auto-skips after 10 seconds if they freeze.
- **Foul is neutral** — punishing a foul on top of a bonus loss would feel unfair.
- **Guesser always gets standard +1** — the bonus is the actor's gamble, not the guesser's.

---

## Movie / Content Queue Logic

```
buildContentQueue(categories, languages, mode)
  → pools selected category × region × difficulty buckets
  → shuffle the combined array
  → iterate sequentially through the queue
  → on exhaust: reshuffle, mark subsequent movies as "recycled"
```

Anti-repeat is guaranteed within one pass through the queue. The ♻️ badge shows on recycled movies so the room knows.

Mode maps to difficulty:
- Rapid Fire → `easy` bucket only
- Classic → `easy` + `hard`
- Difficult → `hard` bucket only

Language maps to content type:
- Bollywood / Indian → `bollywood` (movies/songs) or `indian` (series)
- Hollywood / International → `hollywood` (movies/songs) or `international` (series)

Content counts (approximate):
| Category | Region | Easy | Hard |
|---|---|---|---|
| Movies | Bollywood | ~95 | ~50 |
| Movies | Hollywood | ~75 | ~60 |
| Songs | Bollywood | ~55 | ~35 |
| Songs | Hollywood | ~65 | ~25 |
| Series | Indian | ~45 | ~35 |
| Series | International | ~45 | ~45 |

---

## Timer & Quick Guess

The timer is fully customizable via an Apple-style scroll wheel picker (5s steps, 5s–120s). Selecting a mode pre-fills the default (15 / 30 / 60s), but it can be freely adjusted. The chosen `duration` is stored in game state and used everywhere — the circular timer, the progress bar, and the quick guess threshold calculation.

**Quick guess threshold**: elapsed time < 30% of total duration. For a 30s timer, any guess within the first 9 seconds qualifies. Both actor and guesser get +1 bonus.

`actingStartTime` is set via `Date.now()` passed in the `START_ACTING` action (not generated inside the reducer, to keep the reducer pure). The `CORRECT_GUESS` action also carries `timestamp: Date.now()` so elapsed is computed as `guessTimestamp - actingStartTime`.

---

## House Rules

| Rule | Effect |
|---|---|
| No Skips | `skipsRemaining` forced to 0 at round start; skip button hidden |
| Timeout Penalty | Actor −1 on timeout (can go negative) |
| Allow Props | Display-only reminder shown on Pass Phone screen |
| Sudden Death | First player to reach target score wins; triggers a winner screen mid-result |

Sudden death target is configurable: 5 / 8 / 10 / 15 / 20 pts. Winner is checked after every `CORRECT_GUESS` and `SPLIT_GUESS`. `suddenDeathWinner` is stored in state and ResultScreen renders a full-screen takeover before going to the scoreboard.

---

## State Architecture

All game state lives in a single `useReducer` at the `App` level. No context, no external store. Components receive `state` and `dispatch` as props.

```typescript
type GameState = {
  screen: Screen;              // current screen
  players: string[];           // player names
  scores: Record<string, number>;
  categories: Category[];      // movies | songs | series (multi)
  languages: { bollywood: boolean; hollywood: boolean };
  mode: Mode;                  // rapid | classic | difficult
  duration: number;            // actual timer duration (customizable)
  houseRules: HouseRules;
  currentActorIndex: number;
  currentMovie: string;
  movieQueue: string[];
  movieQueueIndex: number;
  round: number;
  skipsRemaining: number;
  history: HistoryEntry[];
  // result tracking
  lastResult: ResultType;
  lastGuesser: string | null;
  lastSplitGuesser: string | null;
  lastActorPoints: number;
  lastGuesserPoints: number;
  lastQuickGuessBonus: boolean;
  // bonus round
  pendingBonusRound: { value: number } | null;
  bonusRoundAccepted: boolean;
  bonusRoundValue: number;
  // sudden death
  suddenDeathWinner: string | null;
  // acting
  actingStartTime: number | null;
  isRecycledMovie: boolean;
}
```

The `usedMovies: Set<string>` field exists in the reducer but isn't serializable — fine for this use case (session-only, no persistence needed).

---

## Component Map

```
App.tsx                   — screen switcher, owns reducer
├── HomeScreen            — logo + CTA
├── SetupScreen           — player/category/mode/timer/house rules config
│   └── WheelPicker       — Apple-style drum scroll timer selector
├── PassPhoneScreen       — actor handoff
├── BonusRoundScreen      — bonus round offer (conditional)
├── RevealScreen          — movie reveal with scramble animation
│   └── ScrambleTitle     — character scramble effect
├── ActingScreen          — countdown timer + guesser buttons
│   └── Timer             — SVG circular ring timer
├── ResultScreen          — round outcome + points breakdown
└── ScoreboardScreen      — rankings + history
```

Custom hooks:
- `useTimer(duration, onComplete)` — interval-based countdown, returns `{ timeLeft, progress, color, isUrgent, start, stop, reset }`

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + Vite 8 | Fast HMR, minimal config |
| Language | TypeScript | Strict types on game state prevent scoring bugs |
| Styling | Tailwind CSS v4 | Utility-first, no CSS files to maintain |
| PWA | vite-plugin-pwa (Workbox) | Auto service worker, offline cache, installable |
| Analytics | @vercel/analytics/react | Zero-config page view tracking |
| Fonts | Outfit (display) + Space Mono (timer/scores) | Outfit for energy, Space Mono for precision |
| State | useReducer | Game logic is a state machine — reducer is the right fit |
| Persistence | None | Party game, single session by design |

Bundle size: ~242KB JS (75KB gzipped), ~20KB CSS (5KB gzipped).

---

## Development

```bash
npm install
npm run dev       # localhost:5173
npm run build     # output → dist/
```

## Deployment

Deployed on Vercel. Every push to `main` auto-deploys.

```bash
git add .
git commit -m "your message"
git push
```

---

## What's Not Built (intentionally)

- No multiplayer / online mode
- No sound effects
- No user accounts or history persistence
- No analytics beyond page views
- No animations library (CSS transitions only)
- No backend of any kind
