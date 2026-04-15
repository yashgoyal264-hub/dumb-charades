import type { GameState } from '../types';

interface Props {
  state: GameState;
  onNext: () => void;
}

export function PassPhoneScreen({ state, onNext }: Props) {
  const isTeam = state.isTeamMode;
  const team = isTeam ? state.teams[state.currentTeamIndex] : null;
  const actor = state.players[state.currentActorIndex];
  // In random mode we already know the actor; in team_choice mode, team decides on next screen
  const showActor = isTeam ? state.actingMode === 'random' : true;
  const displayName = isTeam ? team?.name ?? '' : actor;
  const ctaLabel = isTeam && state.actingMode === 'team_choice' ? 'Pick Our Actor →' : 'Tap to See Movie';
  const hint = isTeam
    ? state.actingMode === 'team_choice'
      ? `Only ${team?.name} should tap this`
      : `Only ${actor} should tap this`
    : `Only ${actor} should tap this button`;

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh px-6 py-10 screen-enter">
      <div className="text-center">
        <div
          className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
          style={{ background: 'rgba(124,58,237,0.2)', color: '#c084fc', fontFamily: 'Space Mono, monospace' }}>
          Round {state.round}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-6">📱</div>
        <p className="text-gray-400 text-lg mb-4">Pass the phone to</p>
        <h1 className="text-6xl font-black text-white mb-4 leading-tight"
          style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
          {displayName}
        </h1>
        {showActor && isTeam && (
          <p className="text-gray-400 text-base mb-2">{actor} is acting</p>
        )}
        <p className="text-gray-500 text-base">Everyone else, look away! 👀</p>
      </div>

      <div className="w-full">
        <p className="text-center text-gray-600 text-sm mb-4">{hint}</p>
        <button
          onClick={onNext}
          className="w-full py-6 rounded-2xl text-xl font-black text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #ff3c6f, #7c3aed)',
            boxShadow: '0 0 40px rgba(255, 60, 111, 0.3)',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}>
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
