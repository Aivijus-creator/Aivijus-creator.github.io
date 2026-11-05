/** Vollearn logo: a ball whose curved panels form a "V", with a flight arc and spark. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="logo-mark">
      <defs>
        <radialGradient id="lg-shade" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="70%" stopColor="#f1ece6" />
          <stop offset="100%" stopColor="#d9d2ca" />
        </radialGradient>
        <clipPath id="lg-clip">
          <circle cx="18" cy="21" r="15" />
        </clipPath>
      </defs>
      {/* flight arc */}
      <path d="M 4 9 Q 20 -2 35 6" fill="none" stroke="#FFC72C" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 4.2" />
      <circle cx="18" cy="21" r="15" fill="url(#lg-shade)" />
      <g clipPath="url(#lg-clip)">
        {/* two curved panels meeting at the bottom → V */}
        <path d="M 2 8 C 8 9 13 18 17.5 37 L 12 37 C 9 24 6 17 1 14 Z" fill="#E0283F" />
        <path d="M 34 8 C 28 9 23 18 18.5 37 L 24 37 C 27 24 30 17 35 14 Z" fill="#E0283F" />
        <path d="M 2 8 C 8 9 13 18 17.5 37" fill="none" stroke="#7A0E1F" strokeWidth="0.8" opacity="0.5" />
        <path d="M 34 8 C 28 9 23 18 18.5 37" fill="none" stroke="#7A0E1F" strokeWidth="0.8" opacity="0.5" />
        {/* top seam */}
        <path d="M 4 12 C 12 7 24 7 32 12" fill="none" stroke="#16161A" strokeWidth="0.9" opacity="0.35" />
      </g>
      <circle cx="18" cy="21" r="15" fill="none" stroke="#16161A" strokeWidth="1.6" />
      {/* spark */}
      <path d="M 35 2.5 L 36.2 5.3 L 39 6.5 L 36.2 7.7 L 35 10.5 L 33.8 7.7 L 31 6.5 L 33.8 5.3 Z" fill="#FFC72C" />
    </svg>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-word">
        VOL<span className="logo-learn">LEARN</span>
      </span>
    </span>
  );
}
