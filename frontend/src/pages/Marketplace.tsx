import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, FlaskConical, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMarketplace, useMyLoans, useIndustries } from "@/hooks/useLoans";
import { useAuth } from "@/hooks/useAuth";
import { useAccountMode } from "@/context/AccountMode";
import { LoanCard } from "@/components/LoanCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import type { MarketplaceFilters } from "@/lib/api";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

const SORTS = [
  { v: "newest", l: "Newest" },
  { v: "deadline", l: "Closing soon" },
  { v: "rate", l: "Highest rate" },
  { v: "amount", l: "Largest amount" },
  { v: "score", l: "Best score" },
];
const STATUSES = [
  { v: "", l: "All loans" },
  { v: "open", l: "Open auctions" },
  { v: "funded", l: "Funded" },
  { v: "repaid", l: "Repaid" },
];
const GRADES = ["A", "B", "C", "D", "E"];
const TRADE_TYPES = ["import", "export", "wholesale", "distribution"];

export function MarketplacePage() {
  const { authenticated } = useAuth();
  const { isBusiness } = useAccountMode();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [industry, setIndustry] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters: MarketplaceFilters = useMemo(
    () => ({
      search: debounced || undefined,
      industry: industry || undefined,
      trade_type: tradeType || undefined,
      risk_grade: grade || undefined,
      status: status || undefined,
      sort,
    }),
    [debounced, industry, tradeType, grade, status, sort],
  );

  const { data: deals, isLoading } = useMarketplace(filters);
  const { data: industries } = useIndustries();
  const { data: myLoans } = useMyLoans(authenticated && isBusiness);

  const myPending = myLoans?.filter((l) => l.status === "pending_approval") ?? [];

  return (
    <>
      {/* Header band */}
      <section className="border-b border-line bg-paper-grad">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow text-brand">Marketplace</span>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tightish">
              Live trade-finance loans
            </h1>
            <p className="mt-3 max-w-xl text-ink-soft">
              {isBusiness
                ? "Track your loan requests and see how the open market prices trade-finance loans."
                : "Browse real trade-finance loans, assess transparent risk and bid your rate."}
            </p>
          </div>
          {isBusiness && (
            <Link to="/deals/new">
              <Button size="lg">
                <Plus className="h-4 w-4" /> Apply for a loan
              </Button>
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Hackathon demo notice */}
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3.5 text-amber-900">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold">Hackathon demo</p>
            <p className="mt-0.5 text-amber-800">
              This is a hackathon prototype. All loans, companies and credit scores shown here are
              sample data for demonstration only — nothing on this marketplace is a real financial
              offer.
            </p>
          </div>
        </div>

        {/* Your deals (business mode) */}
        {isBusiness && authenticated && (myLoans?.length ?? 0) > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-brand" />
              <h2 className="font-display text-xl font-semibold">Your loans</h2>
              {myPending.length > 0 && (
                <span className="rounded-full bg-paper-deep px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                  {myPending.length} pending approval
                </span>
              )}
            </div>
            <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
              {myLoans!.map((l) => (
                <Link
                  key={l.id}
                  to={`/deals/${l.id}`}
                  className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-0 transition-colors hover:bg-paper-dim"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{l.title}</p>
                    <p className="text-xs text-ink-muted">
                      {l.company.name} · {formatCurrency(l.amount, l.currency, true)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="hidden font-mono text-sm text-ink-soft nums sm:block">
                      {formatPercent(l.best_rate ?? l.interest_rate)}
                    </span>
                    <StatusBadge status={l.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-line bg-card p-3 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search loans, goods or companies…"
                className="h-11 w-full rounded-full border border-line bg-paper-dim pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect value={status} onChange={setStatus} ariaLabel="Status">
                {STATUSES.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.l}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect value={industry} onChange={setIndustry} ariaLabel="Industry">
                <option value="">All industries</option>
                {(industries ?? []).map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect value={tradeType} onChange={setTradeType} ariaLabel="Trade type">
                <option value="">All trade types</option>
                {TRADE_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect value={grade} onChange={setGrade} ariaLabel="Risk grade">
                <option value="">All grades</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect value={sort} onChange={setSort} ariaLabel="Sort" icon>
                {SORTS.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.l}
                  </option>
                ))}
              </FilterSelect>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl border border-line bg-paper-dim" />
            ))}
          </div>
        ) : deals && deals.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-ink-muted">
              {deals.length} {deals.length === 1 ? "loan" : "loans"}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-line-strong bg-paper-dim py-20 text-center">
            <SlidersHorizontal className="mx-auto h-8 w-8 text-ink-muted" />
            <p className="mt-3 font-display text-lg font-medium text-ink">No loans match your filters</p>
            <p className="mt-1 text-sm text-ink-muted">Try clearing a filter or broadening your search.</p>
          </div>
        )}
      </div>
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
  ariaLabel,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
  icon?: boolean;
}) {
  return (
    <div className="relative">
      {icon && (
        <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
      )}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 cursor-pointer rounded-full border border-line bg-paper-dim pr-8 text-sm font-medium text-ink-soft transition-colors focus:border-brand focus:outline-none",
          icon ? "pl-8" : "pl-4",
        )}
      >
        {children}
      </select>
    </div>
  );
}
