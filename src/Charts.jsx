import React from "react";
import { goalProgress } from "./utils.js";

export function ElevationHero({ goals }) {
  const slotW = 130;
  const pad = 20;
  const width = goals.length * slotW + pad * 2;
  const height = 170;
  const baseY = height - 30;

  const points = goals.map((g, i) => {
    const prog = goalProgress(g);
    const peakBoost = g.timeframe === "long" ? 95 : 55;
    const peakY = baseY - peakBoost * (0.22 + (prog / 100) * 0.78);
    const x = pad + i * slotW + slotW / 2;
    return { x, y: peakY, g, prog };
  });

  const start = { x: pad, y: baseY };
  const end = { x: width - pad, y: baseY };
  const all = [start, ...points, end];
  let d = `M ${all[0].x},${all[0].y}`;
  for (let i = 0; i < all.length - 1; i++) {
    const cur = all[i];
    const next = all[i + 1];
    const mid = { x: (cur.x + next.x) / 2, y: (cur.y + next.y) / 2 };
    d += ` Q ${cur.x},${cur.y} ${mid.x},${mid.y}`;
  }
  d += ` T ${end.x},${end.y}`;
  const areaPath = `${d} L ${end.x},${baseY} L ${start.x},${baseY} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="skyline" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F6B52" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#4F6B52" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <line x1={pad} y1={baseY} x2={width - pad} y2={baseY} stroke="#9C9585" strokeWidth="1" />
      <path d={areaPath} fill="url(#skyline)" />
      <path d={d} fill="none" stroke="#26313A" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.prog === 100 ? 5 : 4}
            fill={p.prog === 100 ? "#4F6B52" : "#F7F4EC"}
            stroke="#26313A"
            strokeWidth="1.5"
          />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono" fill="#26313A">
            {p.prog}%
          </text>
          <text x={p.x} y={height - 10} textAnchor="middle" fontSize="9" fontFamily="IBM Plex Sans" fill="#26313A">
            {p.g.title.length > 16 ? p.g.title.slice(0, 15) + "…" : p.g.title}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function StatusDonut({ counts, total }) {
  const size = 108;
  const stroke = 15;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segments = [
    { key: "done", color: "#4F6B52", value: counts.done },
    { key: "doing", color: "#B8843C", value: counts.doing },
    { key: "todo", color: "#C9C2AF", value: counts.todo },
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4DFD1" strokeWidth={stroke} />
        {segments.map((seg) => {
          const frac = total ? seg.value / total : 0;
          const len = frac * c;
          const el = (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </g>
      <text x={size / 2} y={size / 2 - 3} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="20" fill="#26313A">
        {total}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontFamily="IBM Plex Sans" fontSize="9" fill="#6b6355">
        tasks
      </text>
    </svg>
  );
}

export function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: color }} />
      {label}
    </div>
  );
}

export function CategoryTag({ category }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#6b6355" }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: category ? category.color : "#C9C2AF" }} />
      {category ? category.name : "Unsorted"}
    </span>
  );
}
