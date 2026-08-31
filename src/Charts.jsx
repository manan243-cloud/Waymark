import React from "react";

export function StatusDonut({ counts, total }) {
  const size = 108;
  const stroke = 15;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segments = [
    { key: "done", color: "#4F6B52", value: counts.done },
    { key: "doing", color: "#B8843C", value: counts.doing },
    { key: "failed", color: "#A2452F", value: counts.failed || 0 },
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
