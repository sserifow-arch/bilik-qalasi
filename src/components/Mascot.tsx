/** Brainy — tətbiqin maskotu: mehriban robot */
export type Mood = 'happy' | 'think' | 'cheer' | 'sad';

export function Mascot({ size = 120, mood = 'happy', className = '' }: { size?: number; mood?: Mood; className?: string }) {
  const mouth =
    mood === 'sad' ? 'M44 78 Q60 70 76 78' : mood === 'think' ? 'M48 76 L72 76' : mood === 'cheer' ? 'M42 72 Q60 92 78 72 Z' : 'M44 74 Q60 88 76 74';
  return (
    <svg viewBox="0 0 120 130" width={size} height={size * 1.08} className={`bk-float ${className}`} aria-hidden>
      <defs>
        <linearGradient id="bkHead" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b6cff" />
          <stop offset="1" stopColor="#5b8cff" />
        </linearGradient>
        <linearGradient id="bkFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9fbff" />
          <stop offset="1" stopColor="#c9f2ff" />
        </linearGradient>
      </defs>
      {/* antena */}
      <line x1="60" y1="18" x2="60" y2="6" stroke="#5b8cff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="6" r="6" fill="#ffc83d" className="bk-glow" />
      {/* qulaqlar */}
      <rect x="4" y="44" width="12" height="26" rx="6" fill="#26c6da" />
      <rect x="104" y="44" width="12" height="26" rx="6" fill="#26c6da" />
      {/* baş */}
      <rect x="12" y="18" width="96" height="84" rx="34" fill="url(#bkHead)" />
      <rect x="22" y="30" width="76" height="60" rx="26" fill="url(#bkFace)" />
      {/* gözlər */}
      <g className="bk-blink">
        <ellipse cx="45" cy="56" rx="8" ry={mood === 'cheer' ? 5 : 9} fill="#2b2d42" />
        <ellipse cx="75" cy="56" rx="8" ry={mood === 'cheer' ? 5 : 9} fill="#2b2d42" />
        <circle cx="48" cy="52" r="3" fill="#fff" />
        <circle cx="78" cy="52" r="3" fill="#fff" />
      </g>
      {/* yanaqlar */}
      <circle cx="33" cy="72" r="5" fill="#ff8fb1" opacity=".6" />
      <circle cx="87" cy="72" r="5" fill="#ff8fb1" opacity=".6" />
      <path d={mouth} stroke="#2b2d42" strokeWidth="4" fill={mood === 'cheer' ? '#ff6b8a' : 'none'} strokeLinecap="round" />
      {/* bədən */}
      <rect x="34" y="102" width="52" height="24" rx="12" fill="#26c6da" />
      <circle cx="60" cy="114" r="6" fill="#ffc83d" />
      {mood === 'think' && <text x="98" y="22" fontSize="22">💭</text>}
      {mood === 'cheer' && <text x="92" y="24" fontSize="20">✨</text>}
    </svg>
  );
}

/** Loqo: maskot + ad */
export function Logo({ size = 110 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <Mascot size={size} mood="cheer" />
      <div className="mt-1 text-center font-black leading-none tracking-tight" style={{ fontSize: size * 0.32 }}>
        <span className="bg-gradient-to-r from-violet-600 via-sky-500 to-teal-500 bg-clip-text text-transparent">BRAINY</span>{' '}
        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">KIDS</span>
      </div>
    </div>
  );
}
