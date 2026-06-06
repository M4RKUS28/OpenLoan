import type { RiskGrade } from "@/lib/api";
import { gradeColor } from "@/lib/utils";

/** Circular TradeFlow Score gauge (0–100), coloured by grade. */
export function ScoreGauge({
  score,
  grade,
  size = 132,
}: {
  score: number;
  grade?: RiskGrade | null;
  size?: number;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = gradeColor(grade);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECE1CB" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-3xl font-semibold leading-none nums" style={{ color }}>
          {score}
        </span>
        <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-widest2 text-ink-muted">
          Score
        </span>
      </div>
    </div>
  );
}
