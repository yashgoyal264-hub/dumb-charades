interface Props {
  onStart: () => void;
}

// Abstract geometric logo — overlapping rhombuses with gradient
function AppLogo() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff3c6f" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="g2" x1="96" y1="0" x2="0" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ff3c6f" stopOpacity="0.5" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer ring */}
      <circle cx="48" cy="48" r="46" stroke="url(#g1)" strokeWidth="1.5" strokeOpacity="0.3" />

      {/* Main diamond */}
      <polygon
        points="48,10 82,48 48,86 14,48"
        fill="url(#g1)"
        opacity="0.15"
      />
      <polygon
        points="48,10 82,48 48,86 14,48"
        stroke="url(#g1)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Rotated inner diamond */}
      <polygon
        points="48,22 74,48 48,74 22,48"
        fill="url(#g2)"
        opacity="0.12"
      />
      <polygon
        points="48,22 74,48 48,74 22,48"
        stroke="url(#g2)"
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />

      {/* Center gem facets */}
      <polygon points="48,30 62,48 48,66 34,48" fill="url(#g1)" opacity="0.35" filter="url(#glow)" />

      {/* Highlight lines — top facet */}
      <line x1="48" y1="30" x2="62" y2="48" stroke="white" strokeWidth="0.8" strokeOpacity="0.25" />
      <line x1="48" y1="30" x2="34" y2="48" stroke="white" strokeWidth="0.8" strokeOpacity="0.15" />

      {/* Corner dots */}
      <circle cx="48" cy="10" r="2" fill="#ff3c6f" opacity="0.8" />
      <circle cx="82" cy="48" r="2" fill="#7c3aed" opacity="0.8" />
      <circle cx="48" cy="86" r="2" fill="#ff3c6f" opacity="0.6" />
      <circle cx="14" cy="48" r="2" fill="#7c3aed" opacity="0.6" />
    </svg>
  );
}

export function HomeScreen({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center screen-enter">
      {/* Logo */}
      <div className="mb-5 animate-bounce-in">
        <AppLogo />
      </div>

      <h1
        className="text-5xl font-black tracking-tight mb-3 text-white animate-fade-in-scale"
        style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
      >
        Dumb Charades
      </h1>

      <p className="text-base text-gray-500 mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        Act it out. Guess it fast. No teams needed.
      </p>

      <button
        onClick={onStart}
        className="w-full py-5 rounded-2xl text-xl font-bold text-white animate-slide-up cursor-pointer transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #ff3c6f, #7c3aed)',
          animationDelay: '0.2s',
          boxShadow: '0 0 48px rgba(255, 60, 111, 0.28)',
          fontFamily: 'Outfit, system-ui, sans-serif',
        }}
      >
        Start Game
      </button>

      <p className="mt-10 text-xs text-gray-700 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        works offline · no signup · free forever
      </p>
    </div>
  );
}
