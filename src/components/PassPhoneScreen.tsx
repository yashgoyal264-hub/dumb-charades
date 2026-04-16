import { useState, useRef } from 'react';
import type { GameState } from '../types';

interface Props {
  state: GameState;
  onNext: () => void;
}

export function PassPhoneScreen({ state, onNext }: Props) {
  const isTeam = state.isTeamMode;
  const team   = isTeam ? state.teams[state.currentTeamIndex] : null;
  const actor  = state.players[state.currentActorIndex];

  const showActor  = isTeam ? state.actingMode === 'random' : true;
  const displayName = isTeam ? team?.name ?? '' : actor;
  const ctaLabel    = isTeam && state.actingMode === 'team_choice' ? 'Pick Our Actor' : 'Tap to See Movie';
  const hint        = isTeam
    ? state.actingMode === 'team_choice'
      ? `Only ${team?.name} should swipe`
      : `Only ${actor} should swipe`
    : `Only ${actor} should swipe`;

  // P1-4: swipe-right-to-proceed
  const [swipeProgress, setSwipeProgress]   = useState(0);
  const [swipeTriggered, setSwipeTriggered] = useState(false);
  const touchRef = useRef<{ startX: number; startY: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const deltaX = e.touches[0].clientX - touchRef.current.startX;
    const deltaY = Math.abs(e.touches[0].clientY - touchRef.current.startY);
    // Only track horizontal swipe (not scroll)
    if (deltaX > 0 && deltaX > deltaY) {
      setSwipeProgress(Math.min(deltaX / 220, 1));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const deltaX  = e.changedTouches[0].clientX - touchRef.current.startX;
    const elapsed = Date.now() - touchRef.current.time;
    touchRef.current = null;
    setSwipeProgress(0);
    if (deltaX > 80 && elapsed < 600 && !swipeTriggered) {
      setSwipeTriggered(true);
      onNext();
    }
  };

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

        {/* P1-4: swipe-right zone with progress fill */}
        <div className="relative overflow-hidden rounded-2xl"
          style={{ height: '72px' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Swipe fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-2xl"
            style={{
              width: `${swipeProgress * 100}%`,
              background: 'linear-gradient(135deg, rgba(255,60,111,0.35), rgba(124,58,237,0.25))',
              transition: swipeProgress === 0 ? 'width 0.2s ease-out' : 'none',
            }}
          />
          {/* Button face */}
          <div
            className="absolute inset-0 flex items-center justify-center gap-3 text-white font-black text-lg select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,60,111,0.18), rgba(124,58,237,0.12))',
              border: '2px solid rgba(255,60,111,0.3)',
              borderRadius: '1rem',
              fontFamily: 'Outfit, system-ui, sans-serif',
              transform: `translateX(${swipeProgress * 24}px)`,
              transition: swipeProgress === 0 ? 'transform 0.2s ease-out' : 'none',
            }}
          >
            <span className="animate-pulse">→</span>
            <span>{ctaLabel}</span>
            <span style={{ opacity: 0.5 }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}
