import { useEffect, useReducer } from 'react';
import { gameReducer, initialState } from './gameReducer';
import { saveState, loadState } from './utils/persist';
import type { GameState } from './types';
import { HomeScreen } from './components/HomeScreen';
import { SetupScreen } from './components/SetupScreen';
import { PassPhoneScreen } from './components/PassPhoneScreen';
import { BonusRoundScreen } from './components/BonusRoundScreen';
import { RevealScreen } from './components/RevealScreen';
import { ActingScreen } from './components/ActingScreen';
import { ResultScreen } from './components/ResultScreen';
import { ScoreboardScreen } from './components/ScoreboardScreen';

function loadInitialState(): GameState {
  const saved = loadState();
  if (!saved) return initialState;
  // Redirect mid-round transient screens back to pass so the timer restarts cleanly
  const screen = (saved.screen === 'acting' || saved.screen === 'bonus')
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

  // After PassPhone, check if there's a pending bonus round
  const handlePassPhoneNext = () => {
    if (state.pendingBonusRound) {
      dispatch({ type: 'GO_TO_SCREEN', screen: 'bonus' });
    } else {
      dispatch({ type: 'GO_TO_SCREEN', screen: 'reveal' });
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col items-center justify-start">
      <div className="w-full max-w-[450px] min-h-dvh flex flex-col">
        {state.screen === 'home' && (
          <HomeScreen onStart={() => dispatch({ type: 'GO_TO_SCREEN', screen: 'setup' })} />
        )}
        {state.screen === 'setup' && (
          <SetupScreen state={state} dispatch={dispatch} />
        )}
        {state.screen === 'pass' && (
          <PassPhoneScreen state={state} onNext={handlePassPhoneNext} />
        )}
        {state.screen === 'bonus' && (
          <BonusRoundScreen state={state} dispatch={dispatch} />
        )}
        {state.screen === 'reveal' && (
          <RevealScreen state={state} dispatch={dispatch} />
        )}
        {state.screen === 'acting' && (
          <ActingScreen state={state} dispatch={dispatch} />
        )}
        {state.screen === 'result' && (
          <ResultScreen state={state} dispatch={dispatch} />
        )}
        {state.screen === 'scoreboard' && (
          <ScoreboardScreen state={state} dispatch={dispatch} />
        )}
      </div>
    </div>
  );
}

export default App;
