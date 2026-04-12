import { useState, useEffect } from 'react';

const SYMBOLS = '@#$%&*!?^~≈∆◊§';
const DURATION_MS = 750;
const INTERVAL_MS = 35;

interface Props {
  text: string;
}

export function ScrambleTitle({ text }: Props) {
  const totalSteps = Math.ceil(DURATION_MS / INTERVAL_MS);
  const [displayChars, setDisplayChars] = useState<string[]>(
    text.split('').map(c => (c === ' ' ? ' ' : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]))
  );

  useEffect(() => {
    // Reset on text change
    setDisplayChars(
      text.split('').map(c => (c === ' ' ? ' ' : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]))
    );

    let step = 0;
    const chars = text.split('');
    const interval = setInterval(() => {
      step++;
      setDisplayChars(
        chars.map((c, i) => {
          if (c === ' ') return ' ';
          const lockAt = Math.floor((i / chars.length) * totalSteps * 0.85);
          if (step >= lockAt) return c;
          return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        })
      );
      if (step >= totalSteps) clearInterval(interval);
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [text, totalSteps]);

  return (
    <span>
      {displayChars.map((char, i) => {
        const isLocked = char === text[i] || text[i] === ' ';
        return (
          <span
            key={i}
            style={{
              color: isLocked ? '#ffffff' : 'rgba(255,60,111,0.6)',
              transition: 'color 0.1s',
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}
