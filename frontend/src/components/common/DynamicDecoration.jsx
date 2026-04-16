import React, { useEffect, useMemo, useState } from 'react';

const EFFECTS = {
  snow:      { count: 45, chars: ['❄', '❅', '❆', '✻'], sizes: [10, 22], dur: [8, 16], rising: false },
  noel:      { count: 40, chars: ['🎄', '❄', '🎁', '⭐', '🔔'], sizes: [14, 28], dur: [9, 17], rising: false },
  tet:       { count: 40, chars: ['🌸', '🧧', '🏮', '🎋'], sizes: [16, 30], dur: [8, 15], rising: false },
  firework:  { count: 30, chars: ['✦', '✧', '🎆', '💫'], sizes: [8, 18], dur: [3, 7],  rising: true },
  hearts:    { count: 35, chars: ['♥', '💕', '❤️'], sizes: [12, 22], dur: [7, 13], rising: false },
  rose:      { count: 35, chars: ['🌹', '🥀', '💐', '🌷'], sizes: [14, 24], dur: [8, 14], rising: false },
  confetti:  { count: 45, chars: ['●', '■', '▲', '★', '◆'], sizes: [6, 14], dur: [5, 10], rising: false,
               colors: ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#00d2d3'] },
  sakura:    { count: 40, chars: ['🌸', '🌺', '💮'], sizes: [14, 24], dur: [9, 16], rising: false },
  lantern:   { count: 14, chars: ['🏮'], sizes: [22, 38], dur: [10, 18], rising: true },
  teacher:   { count: 30, chars: ['📚', '✏️', '📖', '🎓', '✒️'], sizes: [14, 24], dur: [7, 13], rising: false },
  book:      { count: 30, chars: ['📕', '📗', '📘', '📙'], sizes: [14, 22], dur: [8, 14], rising: false },
  leaves:    { count: 35, chars: ['🍂', '🍁', '🍃'], sizes: [14, 26], dur: [8, 15], rising: false },
};

function rand(a, b) { return Math.random() * (b - a) + a; }

function makeParticle(cfg, idx) {
  return {
    id: `p-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    left: rand(0, 100),
    delay: rand(0, 10),
    duration: rand(cfg.dur[0], cfg.dur[1]),
    size: rand(cfg.sizes[0], cfg.sizes[1]),
    opacity: rand(0.35, 0.9),
    char: cfg.chars[idx % cfg.chars.length],
    color: cfg.colors ? cfg.colors[idx % cfg.colors.length] : undefined,
    swayDur: rand(3, 7),
  };
}

const DynamicDecoration = ({ type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!!type && type !== 'none' && !!EFFECTS[type]);
  }, [type]);

  const cfg = EFFECTS[type] || null;

  const particles = useMemo(() => {
    if (!cfg) return [];
    return Array.from({ length: cfg.count }, (_, i) => makeParticle(cfg, i));
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible || !particles.length) return null;

  const rising = cfg.rising;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes bk-fall {
          0%   { transform: translateY(-12vh) rotate(0deg); opacity: var(--po); }
          75%  { opacity: var(--po); }
          100% { transform: translateY(108vh) rotate(360deg); opacity: 0; }
        }
        @keyframes bk-rise {
          0%   { transform: translateY(108vh) scale(0.6); opacity: 0; }
          20%  { opacity: var(--po); }
          80%  { opacity: var(--po); }
          100% { transform: translateY(-12vh) scale(1.15); opacity: 0; }
        }
        @keyframes bk-sway {
          0%,100% { margin-left: 0; }
          50%     { margin-left: 22px; }
        }
      `}</style>
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: rising ? 'auto' : '-6%',
            bottom: rising ? '-6%' : 'auto',
            fontSize: p.size,
            color: p.color || 'inherit',
            opacity: p.opacity,
            '--po': p.opacity,
            animation: `${rising ? 'bk-rise' : 'bk-fall'} ${p.duration}s linear ${p.delay}s infinite, bk-sway ${p.swayDur}s ease-in-out ${p.delay}s infinite`,
            willChange: 'transform, opacity',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
};

export default React.memo(DynamicDecoration);
