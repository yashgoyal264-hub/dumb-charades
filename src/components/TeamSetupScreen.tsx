import { useState } from 'react';
import type { GameState, GameAction, Team, ActingMode } from '../types';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const TEAM_COLORS = ['#7c3aed', '#ff3c6f', '#10b981', '#fbbf24', '#3b82f6'];

function buildTeams(names: string[], count: number, assignment: Record<string, number>): Team[] {
  const teams: Team[] = Array.from({ length: count }, (_, i) => ({
    name: `Team ${i + 1}`,
    members: [],
  }));
  names.forEach(p => {
    const idx = assignment[p];
    if (idx !== undefined && idx >= 0 && idx < count) {
      teams[idx].members.push(p);
    }
  });
  return teams;
}

function randomizeAssignment(players: string[], count: number): Record<string, number> {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const result: Record<string, number> = {};
  shuffled.forEach((p, i) => { result[p] = i % count; });
  return result;
}

export function TeamSetupScreen({ state, dispatch }: Props) {
  const [teamCount, setTeamCount] = useState(2);
  const [actingMode, setActingMode] = useState<ActingMode>('random');
  const [assignment, setAssignment] = useState<Record<string, number>>(() =>
    randomizeAssignment(state.players, 2)
  );

  const assign = (player: string, teamIdx: number) =>
    setAssignment(prev => ({ ...prev, [player]: teamIdx }));

  const randomize = () =>
    setAssignment(randomizeAssignment(state.players, teamCount));

  const changeCount = (n: number) => {
    setTeamCount(n);
    setAssignment(randomizeAssignment(state.players, n));
  };

  const teams = buildTeams(state.players, teamCount, assignment);
  const allAssigned = state.players.every(p => assignment[p] !== undefined);
  const allTeamsHaveMembers = teams.every(t => t.members.length > 0);
  const canStart = allAssigned && allTeamsHaveMembers;

  return (
    <div className="flex flex-col min-h-dvh px-5 py-8 screen-enter overflow-y-auto">
      {/* VP-9: standardized back button */}
      <button
        onClick={() => dispatch({ type: 'GO_TO_SCREEN', screen: 'setup' })}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 text-sm font-bold cursor-pointer hover:text-white transition-colors mb-6 w-fit"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        ← Back
      </button>

      <h2 className="text-2xl font-black text-white mb-8"
        style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
        Set Up Teams
      </h2>

      {/* Number of teams */}
      <section className="mb-8">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Number of Teams
        </label>
        <div className="flex gap-2">
          {[2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => changeCount(n)}
              className="flex-1 py-3 rounded-xl font-black text-lg transition-all active:scale-95 cursor-pointer border-2"
              style={teamCount === n
                ? { background: 'rgba(124,58,237,0.15)', borderColor: '#7c3aed', color: '#c084fc' }
                : { background: '#1a1a2e', borderColor: 'transparent', color: '#6b7280' }}>
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* Acting mode */}
      <section className="mb-8">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Who Picks the Actor?
        </label>
        <div className="flex flex-col gap-2">
          {([
            { id: 'random' as ActingMode, label: 'App picks (rotates)', desc: 'App assigns actors in order — shown after phone is passed' },
            { id: 'team_choice' as ActingMode, label: 'Team decides', desc: 'Team privately picks who acts each round' },
          ]).map(opt => (
            <button key={opt.id} onClick={() => setActingMode(opt.id)}
              className="flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] cursor-pointer"
              style={actingMode === opt.id
                ? { background: 'rgba(124,58,237,0.12)', borderColor: '#7c3aed' }
                : { background: '#1a1a2e', borderColor: 'transparent' }}>
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${actingMode === opt.id ? 'border-[#7c3aed]' : 'border-gray-600'}`}
                style={actingMode === opt.id ? { background: '#7c3aed' } : {}} />
              <div>
                <p className="text-white font-bold text-sm">{opt.label}</p>
                <p className="text-gray-500 text-xs">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Player assignment */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Assign Players
          </label>
          <button onClick={randomize}
            className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#c084fc' }}>
            Randomize
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {state.players.map(player => (
            <div key={player}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-white font-bold text-sm">{player}</span>
              <div className="flex gap-2">
                {teams.map((team, i) => {
                  const active = assignment[player] === i;
                  // P1-8: always show team color even when inactive
                  return (
                    <button key={team.name} onClick={() => assign(player, i)}
                      className="px-3 py-1 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer"
                      style={{
                        background: active ? `${TEAM_COLORS[i]}25` : `${TEAM_COLORS[i]}0d`,
                        border: `1.5px solid ${active ? TEAM_COLORS[i] : TEAM_COLORS[i] + '40'}`,
                        color: active ? TEAM_COLORS[i] : TEAM_COLORS[i] + '80',
                      }}>
                      T{i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team preview */}
      <div className="flex gap-3 mb-8">
        {teams.map((team, i) => (
          <div key={team.name} className="flex-1 rounded-xl p-3"
            style={{ background: `${TEAM_COLORS[i]}12`, border: `1px solid ${TEAM_COLORS[i]}40` }}>
            <p className="text-xs font-black uppercase tracking-widest mb-2"
              style={{ color: TEAM_COLORS[i] }}>
              {team.name}
            </p>
            {team.members.length === 0
              ? <p className="text-gray-600 text-xs">Empty</p>
              : team.members.map(m => (
                  <p key={m} className="text-white text-sm font-bold leading-snug">{m}</p>
                ))}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          if (!canStart) return;
          dispatch({ type: 'SET_ACTING_MODE', mode: actingMode });
          dispatch({ type: 'START_TEAM_GAME', teams });
        }}
        disabled={!canStart}
        className="w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: canStart ? 'linear-gradient(135deg, #ff3c6f, #7c3aed)' : '#1a1a2e',
          boxShadow: canStart ? '0 0 30px rgba(255,60,111,0.25)' : 'none',
          fontFamily: 'Outfit, system-ui, sans-serif',
        }}>
        Start Team Game
      </button>
    </div>
  );
}
