// components/Logo.tsx
interface LogoProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export default function Logo({ width = 180, height = 56, className }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 640 200" 
      width={width} 
      height={height} 
      className={className}
    >
      <defs>
        <linearGradient id="apexPeakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4FA3C4" />
          <stop offset="100%" stopColor="#2E7A9C" />
        </linearGradient>
      </defs>

      {/* Graphical Mark */}
      <g transform="translate(40, 40)">
        <path 
          d="M 60 0 L 118 120 L 96 120 L 60 46 L 24 120 L 2 120 Z" 
          fill="url(#apexPeakGrad)"
        />
        <path 
          d="M 8 84 L 46 84 L 60 56 L 74 84 L 112 84" 
          fill="none" 
          stroke="#00D68A" 
          strokeWidth={6} 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </g>

      {/* Typography Scale linked to global CSS variables */}
      <text 
        x="182" 
        y="92" 
        fontFamily="'Barlow Condensed', 'DM Sans', system-ui, sans-serif" 
        fontSize="54" 
        fontWeight="800" 
        letterSpacing="4" 
        fill="var(--ink)"
      >
        APEX
      </text>
      <text 
        x="182" 
        y="124" 
        fontFamily="'Barlow Condensed', 'DM Sans', system-ui, sans-serif" 
        fontSize="26" 
        fontWeight="500" 
        letterSpacing="11" 
        fill="var(--ink-dim)"
      >
        MARKETS
      </text>

      {/* Structural Accent Rule */}
      <line 
        x1="182" 
        y1="140" 
        x2="480" 
        y2="140" 
        stroke="var(--line-strong)" 
        strokeWidth="1.5"
      />
    </svg>
  );
}
