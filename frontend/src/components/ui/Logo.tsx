import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** OpenLoan wordmark. `tone` switches text colour for dark backgrounds. */
export function Logo({
  tone = "ink",
  className,
}: {
  tone?: "ink" | "paper";
  className?: string;
}) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-brand shadow-card">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M5 20c4-7 7 4 11-3s7 4 11-3"
            stroke="#F7EFE2"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M5 25c4-7 7 4 11-3s7 4 11-3"
            stroke="#F7EFE2"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-semibold tracking-tightish",
            tone === "paper" ? "text-paper" : "text-ink",
          )}
        >
          Open<span className="text-brand">Loan</span>
        </span>
        <span
          className={cn(
            "mt-0.5 text-[0.55rem] font-semibold uppercase tracking-widest2",
            tone === "paper" ? "text-paper/55" : "text-ink-muted",
          )}
        >
          Trade Finance Market
        </span>
      </span>
    </Link>
  );
}
