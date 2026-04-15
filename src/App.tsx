import { useCallback, useEffect, useReducer, useRef } from 'react';
import { gameReducer, initialState } from './gameReducer';
import { saveState, loadState } from './utils/persist';
import { createSession, logRound, closeSession } from './utils/logger';
import type { GameState, GameAction } from './types';
import { HomeScreen } from './components/HomeScreen';
import { SetupScreen } from './components/SetupScreen';
import { TeamSetupScreen } from './components/TeamSetupScreen';
import { PassPhoneScreen } from './components/PassPhoneScreen';
import { ActorSelectionScreen } from './components/ActorSelectionScreen';
import { BonusRoundScreen } from './components/BonusRoundScreen';
import { RevealScreen } from './components/RevealScreen';
import { ActingScreen } from './components/ActingScreen';
import { ResultScreen } from './components/ResultScreen';
import { ScoreboardScreen } from './components/ScoreboardScreen';

function loadInitialState(): GameState {
  const saved = loadState();
  if (!saved) return initialState;
  // Redirect mid-round transient screens back to pass so the timer restarts cleanly
  const screen = (['acting', 'bonus', 'actor_select'] as const).includes(saved.screen as 'acting' | 'bonus' | 'actor_select')
    ? 'pass'
    : saved.screen;
  return { ...saved, screen, actingStartTime: null };
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadInitialState);

  // Persist state to localStorage after every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Track the last round we logged so we never double-log
  const lastLoggedRound = useRef(0);

  // Wrapped dispatch: fires Supabase side-effects before/after key actions
  const wrappedDispatch = useCallback((action: GameAction) => {
    if (action.type === 'START_GAME') {
      lastLoggedRound.current = 0;
      dispatch(action);
      createSession(state).then(sessionId => {
        if (sessionId) dispatch({ type: 'SET_SESSION_ID', sessionId });
      });
      return;
    }
    if (action.type === 'RESET_GAME' && state.sessionId) {
      closeSession(state.sessionId, state);
    }
    dispatch(action);
  }, [state]) as React.Dispatch<GameAction>;

  // Log each completed round when the result screen appears
  useEffect(() => {
    if (
      state.screen === 'result' &&
      state.sessionId &&
      state.lastResult &&
      state.round > lastLoggedRound.current
    ) {
      lastLoggedRound.current = state.round;
      logRound(state.sessionId, state);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.screen, state.round, state.sessionId]);

  // After PassPhone — in team_choice mode go to actor select; otherwise bonus/reveal
  const handlePassPhoneNext = () => {
    if (state.isTeamMode && state.actingMode === 'team_choice') {
      wrappedDispatch({ type: 'GO_TO_SCREEN', screen: 'actor_select' });
    } else if (state.pendingBonusRound) {
      wrappedDispatch({ type: 'GO_TO_SCREEN', screen: 'bonus' });
    } else {
      wrappedDispatch({ type: 'GO_TO_SCREEN', screen: 'reveal' });
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col items-center justify-start">
      <div className="w-full max-w-[450px] min-h-dvh flex flex-col">
        {state.screen === 'home' && (
          <HomeScreen onStart={() => wrappedDispatch({ type: 'GO_TO_SCREEN', screen: 'setup' })} />
        )}
        {state.screen === 'setup' && (
          <SetupScreen state={state} dispatch={wrappedDispatch} />
        )}
        {state.screen === 'team_setup' && (
          <TeamSetupScreen state={state} dispatch={wrappedDispatch} />
        )}
        {state.screen === 'pass' && (
          <PassPhoneScreen state={state} onNext={handlePassPhoneNext} />
        )}
        {state.screen === 'actor_select' && (
          <ActorSelectionScreen state={state} dispatch={wrappedDispatch} />
        )}
        {state.screen === 'bonus' && (
          <BonusRoundScreen state={state} dispatch={wrappedDispatch} />
        )}
        {state.screen === 'reveal' && (
          <RevealScreen state={state} dispatch={wrappedDispatch} />
        )}
        {state.screen === 'acting' && (
          <ActingScreen state={state} dispatch={wrappedDispatch} />
        )}
        {state.screen === 'result' && (
          <ResultScreen state={state} dispatch={wrappedDispatch} />
        )}
        {state.screen === 'scoreboard' && (
          <ScoreboardScreen state={state} dispatch={wrappedDispatch} />
        )}
      </div>
    </div>
  );
}

export default App;
