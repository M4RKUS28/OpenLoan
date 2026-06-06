import { Link } from "react-router-dom";
import { ArrowUpRight, Briefcase, Plus, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccountMode } from "@/context/AccountMode";
import { useMyLoans } from "@/hooks/useLoans";
import { useMyBids } from "@/hooks/useBids";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatPercent } from "@/lib/utils";

export function DashboardPage() {
  const { user } = useAuth();
  const { isLender, mode, setMode } = useAccountMode();

  return (
    <>
      <section className="border-b border-line bg-paper-grad">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow text-brand">Dashboard</span>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tightish">
              Welcome back{user?.username ? `, ${user.username}` : ""}
            </h1>
            <p className="mt-3 text-ink-soft">
              {isLender
                ? "Your investment portfolio across the marketplace."
                : "Your trade deals and their funding status."}
            </p>
          </div>
          <div className="inline-flex rounded-full border border-line-strong bg-paper-dim p-1">
            {(["lender", "business"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  mode === k ? "bg-ink text-paper shadow-card" : "text-ink-muted hover:text-ink"
                }`}
              >
                {k === "lender" ? "Investor" : "Business"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isLender ? <LenderView /> : <BusinessView />}
      </div>
    </>
  );
}

/* ── Lender ────────────────────────────────────────────────────────────── */

function LenderView() {
  const { data: bids, isLoading } = useMyBids();
  const active = (bids ?? []).filter((b) => ["pending", "accepted"].includes(b.bid.status));
  const committed = active.reduce((s, b) => s + b.bid.amount, 0);
  const accepted = (bids ?? []).filter((b) => b.bid.status === "accepted");
  const avgRate =
    active.length > 0 ? active.reduce((s, b) => s + b.bid.interest_rate, 0) / active.length : 0;

  return (
    <>
      <StatGrid
        stats={[
          { label: "Capital committed", value: formatCurrency(committed, "HKD", true), icon: Wallet },
          { label: "Active offers", value: String(active.length), icon: TrendingUp },
          { label: "Deals won", value: String(accepted.length), icon: Briefcase },
          { label: "Avg. rate", value: avgRate ? formatPercent(avgRate) : "—", icon: TrendingUp },
        ]}
      />

      <SectionHeader title="Your offers" cta={{ to: "/marketplace", label: "Find deals" }} />
      {isLoading ? (
        <Skeleton />
      ) : (bids?.length ?? 0) === 0 ? (
        <Empty
          title="No offers yet"
          body="Browse the marketplace and bid on trade deals to build your portfolio."
          cta={{ to: "/marketplace", label: "Explore deals" }}
        />
      ) : (
        <Table>
          {bids!.map((b) => (
            <Link
              key={b.bid.id}
              to={`/deals/${b.loan.id}`}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line px-5 py-4 last:border-0 transition-colors hover:bg-paper-dim sm:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{b.loan.title}</p>
                <p className="text-xs text-ink-muted">{b.loan.company.name}</p>
              </div>
              <span className="hidden font-mono text-sm text-ink nums sm:block">
                {formatCurrency(b.bid.amount, b.loan.currency, true)}
              </span>
              <span className="hidden font-mono text-sm font-semibold text-brand nums sm:block">
                {formatPercent(b.bid.interest_rate)}
              </span>
              <BidStatusPill status={b.bid.status} />
            </Link>
          ))}
        </Table>
      )}
    </>
  );
}

function BidStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    accepted: "bg-jade-tint text-jade-600 border-jade/30",
    pending: "bg-paper-deep text-ink-muted border-line-strong",
    rejected: "bg-brand-tint text-brand-700 border-brand/30",
    withdrawn: "bg-paper-deep text-ink-muted border-line",
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold capitalize ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

/* ── Business ──────────────────────────────────────────────────────────── */

function BusinessView() {
  const { data: loans, isLoading } = useMyLoans();
  const requested = (loans ?? []).reduce((s, l) => s + l.amount, 0);
  const funded = (loans ?? []).reduce((s, l) => s + l.funded_amount, 0);
  const pending = (loans ?? []).filter((l) => l.status === "pending_approval").length;
  const open = (loans ?? []).filter((l) => l.status === "open").length;

  return (
    <>
      <StatGrid
        stats={[
          { label: "Total requested", value: formatCurrency(requested, "HKD", true), icon: Briefcase },
          { label: "Total funded", value: formatCurrency(funded, "HKD", true), icon: Wallet },
          { label: "Open auctions", value: String(open), icon: TrendingUp },
          { label: "Pending approval", value: String(pending), icon: Briefcase },
        ]}
      />

      <SectionHeader title="Your deals" cta={{ to: "/deals/new", label: "Post a deal", primary: true }} />
      {isLoading ? (
        <Skeleton />
      ) : (loans?.length ?? 0) === 0 ? (
        <Empty
          title="No deals yet"
          body="Post your first trade deal to start receiving competing offers from investors."
          cta={{ to: "/deals/new", label: "Post a deal" }}
        />
      ) : (
        <Table>
          {loans!.map((l) => (
            <Link
              key={l.id}
              to={`/deals/${l.id}`}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line px-5 py-4 last:border-0 transition-colors hover:bg-paper-dim sm:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{l.title}</p>
                <p className="text-xs text-ink-muted">
                  {l.bid_count} {l.bid_count === 1 ? "offer" : "offers"}
                </p>
              </div>
              <span className="hidden font-mono text-sm text-ink nums sm:block">
                {formatCurrency(l.amount, l.currency, true)}
              </span>
              <span className="hidden font-mono text-sm font-semibold text-brand nums sm:block">
                {formatPercent(l.best_rate ?? l.interest_rate)}
              </span>
              <StatusBadge status={l.status} />
            </Link>
          ))}
        </Table>
      )}
    </>
  );
}

/* ── shared ────────────────────────────────────────────────────────────── */

function StatGrid({
  stats,
}: {
  stats: { label: string; value: string; icon: typeof Wallet }[];
}) {
  return (
    <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[0.62rem] uppercase tracking-widest2 text-ink-muted">{s.label}</p>
            <s.icon className="h-4 w-4 text-ink-muted" />
          </div>
          <p className="mt-3 font-display text-2xl font-semibold text-ink nums">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  cta,
}: {
  title: string;
  cta: { to: string; label: string; primary?: boolean };
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <Link to={cta.to}>
        <Button variant={cta.primary ? "primary" : "outline"} size="sm">
          {cta.primary && <Plus className="h-4 w-4" />}
          {cta.label}
        </Button>
      </Link>
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">{children}</div>;
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl border border-line bg-paper-dim" />
      ))}
    </div>
  );
}

function Empty({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { to: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-paper-dim py-16 text-center">
      <p className="font-display text-lg font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{body}</p>
      <Link to={cta.to} className="mt-5 inline-block">
        <Button>
          {cta.label} <ArrowUpRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
