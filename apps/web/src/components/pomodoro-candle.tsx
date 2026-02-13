"use client";

import { useId, type CSSProperties } from "react";

type PomodoroCandleProps = {
  progress: number;
  paused?: boolean;
};

const WAX_TRAVEL_PX = 100;

export default function PomodoroCandle({
  progress,
  paused = false
}: PomodoroCandleProps) {
  const svgId = useId().replace(/:/g, "");
  const ids = {
    glass: `pomodoro-jar-glass-${svgId}`,
    glassEdge: `pomodoro-jar-glass-edge-${svgId}`,
    wax: `pomodoro-jar-wax-${svgId}`,
    waxDepth: `pomodoro-jar-wax-depth-${svgId}`,
    pool: `pomodoro-jar-pool-${svgId}`,
    flame: `pomodoro-jar-flame-${svgId}`,
    innerClip: `pomodoro-jar-clip-${svgId}`,
    softGlow: `pomodoro-jar-soft-glow-${svgId}`,
    flameBlur: `pomodoro-jar-flame-blur-${svgId}`,
    glassBlur: `pomodoro-jar-glass-blur-${svgId}`
  } as const;

  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const clampedProgress = Math.min(1, Math.max(0, safeProgress));

  const waxScale = Math.max(0, 1 - clampedProgress);
  const meltY = Math.round(WAX_TRAVEL_PX * clampedProgress);
  const finished = waxScale <= 0.04;

  const poolScale = 0.55 + clampedProgress * 0.45;
  const poolOpacity = 0.22 + clampedProgress * 0.74;
  const flameOpacity = finished ? 0 : paused ? 0.55 : 1;
  const ambientOpacity = finished ? 0 : paused ? 0.32 : 0.95;
  const waxOpacity = waxScale <= 0.12 ? waxScale / 0.12 : 1;
  const waveOpacity =
    finished ? 0 : paused ? 0.12 : 0.16 + clampedProgress * 0.28;

  const style = {
    "--melt-y": `${meltY}px`,
    "--wax-scale": `${waxScale}`,
    "--wax-opacity": `${waxOpacity}`,
    "--pool-scale": `${poolScale}`,
    "--pool-opacity": `${poolOpacity}`,
    "--flame-opacity": `${flameOpacity}`,
    "--ambient-opacity": `${ambientOpacity}`,
    "--wave-opacity": `${waveOpacity}`
  } as CSSProperties;

  const className = [
    "pomodoro-candle-scene",
    paused ? "is-paused" : "",
    finished ? "is-finished" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} style={style} aria-hidden="true">
      <div className="pomodoro-candle-ambient" />
      <svg
        className="pomodoro-candle-svg"
        width="172"
        height="168"
        viewBox="0 0 172 168"
        role="presentation"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={ids.glass}
            x1="44"
            y1="18"
            x2="136"
            y2="162"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="0.32" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="0.62" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.12)" />
          </linearGradient>
          <linearGradient
            id={ids.glassEdge}
            x1="40"
            y1="20"
            x2="132"
            y2="20"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="0.5" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
          <linearGradient
            id={ids.wax}
            x1="54"
            y1="58"
            x2="120"
            y2="150"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#f7e8cf" />
            <stop offset="0.3" stopColor="#fff6e6" />
            <stop offset="0.6" stopColor="#f0d3ad" />
            <stop offset="1" stopColor="#d7ab7f" />
          </linearGradient>
          <linearGradient
            id={ids.waxDepth}
            x1="52"
            y1="70"
            x2="122"
            y2="150"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="rgba(255,255,255,0.38)" />
            <stop offset="0.42" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="1" stopColor="rgba(114,70,34,0.14)" />
          </linearGradient>
          <radialGradient
            id={ids.pool}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(76 62) rotate(18) scale(64 16)"
          >
            <stop offset="0" stopColor="rgba(255,255,255,0.88)" />
            <stop offset="0.32" stopColor="rgba(252,235,212,0.95)" />
            <stop offset="0.68" stopColor="rgba(235,191,127,0.86)" />
            <stop offset="1" stopColor="rgba(200,132,72,0.55)" />
          </radialGradient>
          <radialGradient
            id={ids.flame}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(86 30) rotate(90) scale(30 18)"
          >
            <stop offset="0" stopColor="rgba(255,255,255,0.94)" />
            <stop offset="0.22" stopColor="rgba(255,246,210,0.92)" />
            <stop offset="0.54" stopColor="rgba(255,191,107,0.9)" />
            <stop offset="1" stopColor="rgba(255,106,92,0.52)" />
          </radialGradient>

          <clipPath id={ids.innerClip} clipPathUnits="userSpaceOnUse">
            <path d="M68 12H110C114 12 117 15 117 19V130C117 142 107 150 98 150H80C71 150 61 142 61 130V19C61 15 64 12 68 12Z" />
          </clipPath>

          <filter id={ids.softGlow} x="-50%" y="-60%" width="200%" height="240%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0"
            />
          </filter>
          <filter
            id={ids.flameBlur}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter
            id={ids.glassBlur}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
        </defs>

        <ellipse cx="86" cy="162" rx="54" ry="9" fill="rgba(17,24,39,0.22)" />
        <g className="pomodoro-candle-plate">
          <ellipse
            cx="86"
            cy="156"
            rx="52"
            ry="13"
            fill="rgba(255,255,255,0.12)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="86"
            cy="156"
            rx="40"
            ry="9"
            fill="rgba(17,24,39,0.22)"
            opacity="0.52"
          />
          <path
            d="M46 156 C62 144, 110 144, 126 156"
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.6"
            opacity="0.9"
          />
        </g>

        <g clipPath={`url(#${ids.innerClip})`}>
          <g className="pomodoro-jar-wax-solid">
            <path
              d="M66 44H112C116 44 118 47 118 50V130C118 142 108 150 98 150H80C70 150 60 142 60 130V50C60 47 62 44 66 44Z"
              fill={`url(#${ids.wax})`}
            />
            <path
              d="M66 44H112C116 44 118 47 118 50V130C118 142 108 150 98 150H80C70 150 60 142 60 130V50C60 47 62 44 66 44Z"
              fill={`url(#${ids.waxDepth})`}
              opacity="0.9"
            />
            <path
              d="M72 56 C80 48, 102 48, 108 56"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.5"
            />
          </g>

          <g className="pomodoro-jar-wax-pool">
            <path
              d="M66 48 C76 36, 106 36, 114 48 C106 58, 74 58, 66 48 Z"
              fill={`url(#${ids.pool})`}
              stroke="rgba(136,86,46,0.14)"
            />
            <path
              className="pomodoro-jar-wax-wave"
              d="M70 48 C78 42, 100 42, 108 48 C100 52, 80 52, 70 48 Z"
              fill="rgba(255,255,255,0.2)"
            />
          </g>
        </g>

        <g className="pomodoro-candle-wick-group">
          <path
            d="M86 38 C84 44 84 48 86 54 C88 48 88 44 86 38 Z"
            fill="rgba(34,18,10,0.92)"
          />
          <rect
            x="84.8"
            y="50"
            width="2.4"
            height="10"
            rx="1.2"
            fill="rgba(22,12,6,0.92)"
          />
        </g>

        <g className="pomodoro-candle-glow-group">
          <circle
            className="pomodoro-candle-glow"
            cx="86"
            cy="24"
            r="26"
            fill="rgba(255,189,104,0.18)"
            filter={`url(#${ids.softGlow})`}
          />
        </g>

        <g className="pomodoro-candle-wick-group">
          <path
            d="M86 38 C84 44 84 48 86 54 C88 48 88 44 86 38 Z"
            fill="rgba(34,18,10,0.92)"
          />
          <rect
            x="84.8"
            y="50"
            width="2.4"
            height="10"
            rx="1.2"
            fill="rgba(22,12,6,0.92)"
          />
        </g>

        <g className="pomodoro-candle-glow-group">
          <circle
            className="pomodoro-candle-glow"
            cx="86"
            cy="24"
            r="26"
            fill="rgba(255,189,104,0.18)"
            filter={`url(#${ids.softGlow})`}
          />
        </g>

        <g className="pomodoro-candle-flame-group">
          <g className="pomodoro-jar-aroma">
            <path
              className="pomodoro-jar-aroma-line aroma-a"
              d="M70 20 C60 10 60 -2 70 -12"
            />
            <path
              className="pomodoro-jar-aroma-line aroma-b"
              d="M86 18 C76 8 78 -4 90 -16"
            />
            <path
              className="pomodoro-jar-aroma-line aroma-c"
              d="M102 22 C112 12 112 0 102 -12"
            />
          </g>
          <g className="pomodoro-candle-flame-flicker">
            <path
              d="M86 22
                C78 34 80 46 86 56
                C92 46 94 34 86 22
                Z"
              fill={`url(#${ids.flame})`}
              filter={`url(#${ids.flameBlur})`}
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
