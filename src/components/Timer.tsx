interface Props {
  timeLeft: number;
  duration: number;
  color: string;
  isUrgent: boolean;
}

export function Timer({ timeLeft, duration, color, isUrgent }: Props) {
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / duration;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={`relative flex items-center justify-center ${isUrgent ? 'animate-pulse-urgent' : ''}`}>
      <svg width={size} height={size}
        style={isUrgent ? { filter: 'drop-shadow(0 0 14px rgba(239,68,68,0.55))' } : undefined}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a1a2e"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="timer-ring"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      {/* Time display */}
      <div
        className="absolute text-4xl font-black"
        style={{
          color,
          fontFamily: 'Space Mono, monospace',
          transition: 'color 0.5s ease',
        }}
      >
        {timeLeft}
      </div>
    </div>
  );
}
