import { useRef, useEffect, useCallback } from 'react';

const ITEM_H = 52;
const VISIBLE = 5;
const PAD = ITEM_H * Math.floor(VISIBLE / 2); // 2 items above/below center

interface Props {
  values: number[];
  selected: number;
  onChange: (value: number) => void;
  unit?: string;
}

export function WheelPicker({ values, selected, onChange, unit = 's' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const programmatic = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const CONTAINER_H = ITEM_H * VISIBLE;

  // Scroll to index without triggering onChange
  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    const el = ref.current;
    if (!el) return;
    programmatic.current = true;
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
    // Release the programmatic lock after scroll settles
    setTimeout(() => { programmatic.current = false; }, 400);
  }, []);

  // Sync scroll position when `selected` changes externally (mode switch)
  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0) scrollToIndex(idx, false);
  }, [selected, values, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (programmatic.current) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const idx = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_H)));
      scrollToIndex(idx);
      onChange(values[idx]);
    }, 120);
  }, [values, onChange, scrollToIndex]);

  return (
    <div className="relative select-none" style={{ height: CONTAINER_H }}>

      {/* Top fade */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: PAD, background: 'linear-gradient(to bottom, #0f0e1a 0%, transparent 100%)' }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: PAD, background: 'linear-gradient(to top, #0f0e1a 0%, transparent 100%)' }}
      />

      {/* Selection band */}
      <div
        className="absolute inset-x-0 pointer-events-none z-20"
        style={{
          top: PAD,
          height: ITEM_H,
          borderTop: '1px solid rgba(124,58,237,0.45)',
          borderBottom: '1px solid rgba(124,58,237,0.45)',
          background: 'rgba(124,58,237,0.1)',
        }}
      />

      {/* Scroll drum */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="no-scrollbar relative overflow-y-scroll"
        style={{
          height: CONTAINER_H,
          scrollSnapType: 'y mandatory',
          paddingTop: PAD,
          paddingBottom: PAD,
        }}
      >
        {values.map(val => {
          const isSelected = val === selected;
          return (
            <div
              key={val}
              style={{
                height: ITEM_H,
                scrollSnapAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={() => {
                const idx = values.indexOf(val);
                scrollToIndex(idx);
                onChange(val);
              }}
            >
              <span
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: isSelected ? '26px' : '17px',
                  fontWeight: isSelected ? 700 : 400,
                  color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.22)',
                  letterSpacing: isSelected ? '-0.5px' : '0',
                  transition: 'font-size 0.18s ease, color 0.18s ease',
                }}
              >
                {val}
                <span
                  style={{
                    fontSize: isSelected ? '14px' : '11px',
                    color: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.14)',
                    marginLeft: '3px',
                  }}
                >
                  {unit}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
