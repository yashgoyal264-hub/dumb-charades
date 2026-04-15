import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function ActorSelectionScreen({ state, dispatch }: Props) {
  const team = state.teams[state.currentTeamIndex];

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh px-6 py-10 screen-enter"
      style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.07) 0%, #0a0a0f 70%)' }}>

      <div className="text-center">
        <div
          className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{ background: 'rgba(124,58,237,0.2)', color: '#c084fc', fontFamily: 'Space Mono, monospace' }}>
          Round {state.round}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center w-full gap-6">
        <div>
          <p className="text-gray-500 text-sm mb-2">Only {team?.name} should see this</p>
          <h1 className="text-4xl font-black text-white"
            style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Who's acting?
          </h1>
        </div>

        <div className="w-full flex flex-col gap-3">
          {team?.members.map(member => (
            <button
              key={member}
              onClick={() => dispatch({ type: 'SELECT_ACTOR', actor: member })}
              className="w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.08))',
                border: '2px solid rgba(124,58,237,0.3)',
                fontFamily: 'Outfit, system-ui, sans-serif',
              }}>
              {member}
            </button>
          ))}
        </div>
      </div>

      <p className="text-gray-600 text-xs text-center">
        Other teams look away while {team?.name} picks
      </p>
    </div>
  );
}
