import React from "react";

export default function FastExecutionIcon({ size = 48, className = "", title = "FastExecutionIcon" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <style>{`.bg { fill: #070812; }
  .ring { fill: none; stroke: url(#neon); stroke-width: 5; filter: url(#glow); }
  .line { fill: none; stroke: #23e6ff; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; filter: url(#glow); }
  .line2 { fill: none; stroke: #ff4fd8; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; filter: url(#glow); }
  .fill { fill: #23e6ff; filter: url(#glow); }
  .fill2 { fill: #ff4fd8; filter: url(#glow); }
  .txt { font-family: Orbitron, Arial, sans-serif; font-weight: 700; fill: #e9fbff; letter-spacing: 2px; }`}</style>
<defs>
  <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#23e6ff"/>
    <stop offset="50%" stop-color="#915cff"/>
    <stop offset="100%" stop-color="#ff4fd8"/>
  </linearGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
    <feMerge>
      <feMergeNode in="coloredBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</defs>


<circle className="ring" cx="256" cy="256" r="168"/>
<path className="line2" d="M282 86L138 282h104l-30 144 162-218H268z"/>
    </svg>
  );
}
