import { useState, useRef } from 'react';
import type { GameState, GameAction, Mode, Category } from '../types';
import { DURATIONS } from '../gameReducer';
import { WheelPicker } from './WheelPicker';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: 'rapid',    label: 'Rapid Fire', desc: 'Easy & popular only'  },
  { id: 'classic',  label: 'Classic',    desc: 'Mixed difficulty'     },
  { id: 'difficult',label: 'Difficult',  desc: 'Obscure & hard only'  },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'movies', label: 'Movies'  },
  { id: 'songs',  label: 'Songs'   },
  { id: 'series', label: 'Series'  },
];

// 5 s steps, 5 → 120
const TIME_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);

function getLangLabels(cats: Category[]) {
  const hasMedia  = cats.includes('movies') || cats.includes('songs');
  const hasSeries = cats.includes('series');
  if (hasMedia && hasSeries) return ['Bollywood / Indian', 'Hollywood / Intl'];
  if (hasSeries)             return ['Indian',             'International'];
  return                            ['Bollywood',           'Hollywood'];
}

export function SetupScreen({ state, dispatch }: Props) {
  const [nameInput,      setNameInput]      = useState('');
  const [showHouseRules, setShowHouseRules] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addPlayer = () => {
    const name = nameInput.trim().slice(0, 12);
    if (!name || state.players.includes(name) || state.players.length >= 10) return;
    dispatch({ type: 'SET_PLAYERS', players: [...state.players, name] });
    setNameInput('');
    inputRef.current?.focus();
  };

  const removePlayer = (name: string) =>
    dispatch({ type: 'SET_PLAYERS', players: state.players.filter(p => p !== name) });

  const toggleCategory = (cat: Category) => {
    const next = state.categories.includes(cat)
      ? state.categories.filter(c => c !== cat)
      : [...state.categories, cat];
    if (next.length === 0) return;
    dispatch({ type: 'SET_CATEGORIES', categories: next });
  };

  const toggleLang = (lang: 'bollywood' | 'hollywood') => {
    const next = { ...state.languages, [lang]: !state.languages[lang] };
    if (!next.bollywood && !next.hollywood) return;
    dispatch({ type: 'SET_LANGUAGES', languages: next });
  };

  const langLabels = getLangLabels(state.categories);
  const canStart   = state.players.length >= 2 && state.categories.length > 0
                  && (state.languages.bollywood || state.languages.hollywood);

  return (
    <div className="flex flex-col min-h-dvh px-5 py-8 screen-enter overflow-y-auto">
      <button
        onClick={() => dispatch({ type: 'GO_TO_SCREEN', screen: 'home' })}
        className="text-gray-500 text-left mb-6 text-sm cursor-pointer hover:text-gray-300 transition-colors w-fit"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-black text-white mb-8"
        style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
        Set Up Game
      </h2>

      {/* ── Players ──────────────────────────────────────────── */}
      <section className="mb-8">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Players ({state.players.length}/10)
        </label>
        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value.slice(0, 12))}
            onKeyDown={e => e.key === 'Enter' && addPlayer()}
            placeholder="Enter name..."
            maxLength={12}
            className="flex-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base outline-none focus:border-[#7c3aed] transition-colors"
          />
          <button
            onClick={addPlayer}
            disabled={!nameInput.trim() || state.players.length >= 10}
            className="px-5 py-3 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            style={{ background: '#7c3aed' }}
          >
            Add
          </button>
        </div>
        {state.players.length === 0
          ? <p className="text-gray-600 text-sm">Add at least 2 players</p>
          : (
            <div className="flex flex-wrap gap-2">
              {state.players.map(name => (
                <div key={name}
                  className="flex items-center gap-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-full px-4 py-2 text-sm text-white">
                  <span>{name}</span>
                  <button onClick={() => removePlayer(name)}
                    className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer text-base leading-none">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Categories
        </label>
        <div className="flex gap-2">
          {CATEGORIES.map(cat => {
            const active = state.categories.includes(cat.id);
            return (
              <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer border-2 ${
                  active ? 'text-white' : 'text-gray-500 border-transparent bg-[#1a1a2e]'
                }`}
                style={active ? { background: 'rgba(124,58,237,0.15)', borderColor: '#7c3aed' } : {}}>
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Region ───────────────────────────────────────────── */}
      <section className="mb-8">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Region
        </label>
        <div className="flex gap-3">
          {(['bollywood', 'hollywood'] as const).map((lang, i) => (
            <button key={lang} onClick={() => toggleLang(lang)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer border-2 ${
                state.languages[lang]
                  ? 'text-white border-[#ff3c6f]'
                  : 'text-gray-500 border-transparent bg-[#1a1a2e]'
              }`}
              style={state.languages[lang] ? { background: 'rgba(255,60,111,0.1)' } : {}}>
              {langLabels[i]}
            </button>
          ))}
        </div>
      </section>

      {/* ── Mode + Timer ─────────────────────────────────────── */}
      <section className="mb-8">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Mode
        </label>
        <div className="flex flex-col gap-2 mb-6">
          {MODES.map(m => (
            <button key={m.id} onClick={() => dispatch({ type: 'SET_MODE', mode: m.id })}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] cursor-pointer ${
                state.mode === m.id ? 'border-[#7c3aed] text-white' : 'border-transparent bg-[#1a1a2e] text-gray-400'
              }`}
              style={state.mode === m.id ? { background: 'rgba(124,58,237,0.12)' } : {}}>
              <div className="flex-1">
                <div className="font-bold text-base">{m.label}</div>
                <div className="text-xs text-gray-500">{m.desc}</div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{
                  background: state.mode === m.id ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                  color: state.mode === m.id ? '#c084fc' : '#4b5563',
                  fontFamily: 'Space Mono, monospace',
                }}>
                {DURATIONS[m.id]}s
              </span>
            </button>
          ))}
        </div>

        {/* Timer duration wheel */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0f0e1a', border: '1px solid #2a2a3e' }}>
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-bold">Timer Duration</p>
              <p className="text-gray-600 text-xs">Scroll to customize</p>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace' }}
              className="text-2xl font-black text-white">
              {state.duration}<span className="text-base text-gray-500 ml-0.5">s</span>
            </div>
          </div>
          <WheelPicker
            values={TIME_VALUES}
            selected={state.duration}
            onChange={d => dispatch({ type: 'SET_DURATION', duration: d })}
          />
        </div>
      </section>

      {/* ── House Rules ──────────────────────────────────────── */}
      <section className="mb-10">
        <button
          onClick={() => setShowHouseRules(!showHouseRules)}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-[#2a2a3e] cursor-pointer text-left hover:border-gray-600 transition-colors"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">House Rules</span>
            {(state.houseRules.noSkip || state.houseRules.timeoutPenalty ||
              state.houseRules.suddenDeath || state.houseRules.allowProps) && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(124,58,237,0.3)', color: '#c084fc' }}>
                ON
              </span>
            )}
          </div>
          <span className="text-gray-500 text-sm">{showHouseRules ? '▲' : '▼'}</span>
        </button>

        {showHouseRules && (
          <div className="mt-3 flex flex-col gap-2 animate-slide-up">
            {([
              { key: 'noSkip'         as const, label: 'No Skips',         desc: 'Actor must act every movie'      },
              { key: 'timeoutPenalty' as const, label: 'Timeout Penalty',  desc: 'Actor loses 1 pt on timeout'    },
              { key: 'allowProps'     as const, label: 'Allow Props',      desc: 'Actor can use nearby objects'    },
            ] as const).map(rule => (
              <div key={rule.key} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="text-white text-sm font-bold">{rule.label}</p>
                  <p className="text-gray-500 text-xs">{rule.desc}</p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'SET_HOUSE_RULES', rules: { [rule.key]: !state.houseRules[rule.key] } })}
                  className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                    state.houseRules[rule.key] ? 'bg-[#7c3aed]' : 'bg-[#2a2a3e]'
                  }`}>
                  <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                    style={{ left: state.houseRules[rule.key] ? '26px' : '4px' }} />
                </button>
              </div>
            ))}

            {/* Sudden Death */}
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white text-sm font-bold">Sudden Death</p>
                  <p className="text-gray-500 text-xs">First to reach target score wins</p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'SET_HOUSE_RULES', rules: { suddenDeath: !state.houseRules.suddenDeath } })}
                  className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                    state.houseRules.suddenDeath ? 'bg-[#ff3c6f]' : 'bg-[#2a2a3e]'
                  }`}>
                  <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                    style={{ left: state.houseRules.suddenDeath ? '26px' : '4px' }} />
                </button>
              </div>
              {state.houseRules.suddenDeath && (
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-gray-400 text-sm">Target:</span>
                  <div className="flex items-center gap-2">
                    {[5, 8, 10, 15, 20].map(n => (
                      <button key={n}
                        onClick={() => dispatch({ type: 'SET_HOUSE_RULES', rules: { suddenDeathTarget: n } })}
                        className="w-9 h-9 rounded-lg text-sm font-bold transition-all cursor-pointer"
                        style={state.houseRules.suddenDeathTarget === n
                          ? { background: 'rgba(255,60,111,0.25)', color: '#ff3c6f' }
                          : { background: '#1a1a2e', color: '#6b7280' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <span className="text-gray-500 text-sm">pts</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Play in Teams ────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#2a2a3e]"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <p className="text-white font-bold text-sm">Play in Teams</p>
            <p className="text-gray-500 text-xs">Team scores · bonus round logic stays hidden</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_TEAM_MODE', isTeamMode: !state.isTeamMode })}
            className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
              state.isTeamMode ? 'bg-[#7c3aed]' : 'bg-[#2a2a3e]'
            }`}>
            <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
              style={{ left: state.isTeamMode ? '26px' : '4px' }} />
          </button>
        </div>
      </section>

      {/* ── Start ────────────────────────────────────────────── */}
      <button
        onClick={() => {
          if (!canStart) return;
          if (state.isTeamMode) {
            dispatch({ type: 'GO_TO_SCREEN', screen: 'team_setup' });
          } else {
            dispatch({ type: 'START_GAME' });
          }
        }}
        disabled={!canStart}
        className="w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mb-4"
        style={{
          background: canStart ? 'linear-gradient(135deg, #ff3c6f, #7c3aed)' : '#1a1a2e',
          boxShadow: canStart ? '0 0 30px rgba(255,60,111,0.25)' : 'none',
          fontFamily: 'Outfit, system-ui, sans-serif',
        }}>
        {state.isTeamMode ? 'Set Up Teams →' : 'Start Game'}
      </button>
    </div>
  );
}
