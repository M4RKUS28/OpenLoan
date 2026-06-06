import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, Gavel, Ship } from "lucide-react";
import type { LoanSummary } from "@/lib/api";
import { GradeBadge, StatusBadge } from "@/components/ui/Badge";
import {
  formatCurrency,
  formatPercent,
  timeLeft,
  tradeTypeLabel,
} from "@/lib/utils";

export function LoanCard({ loan }: { loan: LoanSummary }) {
  const tl = timeLeft(loan.auction_deadline);
  const rate = loan.best_rate ?? loan.interest_rate;

  return (
    <Link
      to={`/deals/${loan.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-gold to-jade opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="min-w-0">
          <p className="truncate text-[0.7rem] font-semibold uppercase tracking-widest2 text-ink-muted">
            {loan.company.name}
          </p>
          <h3 className="mt-1.5 line-clamp-2 font-display text-lg font-semibold leading-snug text-ink">
            {loan.title}
          </h3>
        </div>
        <GradeBadge grade={loan.risk_grade} />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5">
        <StatusBadge status={loan.status} />
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper-dim px-2.5 py-1 text-[0.7rem] font-medium text-ink-soft">
          <Ship className="h-3 w-3" /> {tradeTypeLabel(loan.trade_type)}
        </span>
        <span className="rounded-full border border-line bg-paper-dim px-2.5 py-1 text-[0.7rem] font-medium text-ink-soft">
          {loan.industry}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden border-y border-line bg-line">
        <Stat label="Amount" value={formatCurrency(loan.amount, loan.currency, true)} />
        <Stat label="Target rate" value={formatPercent(rate)} accent />
        <Stat label="Term" value={`${loan.term_days}d`} />
      </div>

      <div className="flex items-center justify-between gap-2 px-5 py-4">
        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span className={`inline-flex items-center gap-1 ${tl.urgent ? "text-brand-600" : ""}`}>
            <Clock className="h-3.5 w-3.5" /> {tl.label}
          </span>
          <span className="inline-flex items-center gap-1">
            <Gavel className="h-3.5 w-3.5" /> {loan.bid_count} {loan.bid_count === 1 ? "bid" : "bids"}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-transform group-hover:translate-x-0.5">
          View <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-[0.62rem] font-semibold uppercase tracking-widest2 text-ink-muted">{label}</p>
      <p className={`mt-1 font-mono text-sm font-semibold nums ${accent ? "text-brand" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
