import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  Gavel,
  Globe2,
  Loader2,
  MapPin,
  Package,
  Share2,
  Users,
} from "lucide-react";
import { useAcceptBid, useApproveLoan, useLoan } from "@/hooks/useLoans";
import { useAuth } from "@/hooks/useAuth";
import { useAccountMode } from "@/context/AccountMode";
import { Button } from "@/components/ui/Button";
import { GradeBadge, StatusBadge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { BidDialog } from "@/components/BidDialog";
import type { Bid, LoanDetail as LoanDetailT } from "@/lib/api";
import {
  formatBytes,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  GRADE_META,
  timeLeft,
  tradeTypeLabel,
} from "@/lib/utils";

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: loan, isLoading } = useLoan(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand" />
      </div>
    );
  }
  if (!loan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Loan not found</h1>
        <p className="mt-2 text-ink-muted">This loan may have been removed or never existed.</p>
        <Link to="/marketplace" className="mt-6 inline-block">
          <Button variant="outline">Back to marketplace</Button>
        </Link>
      </div>
    );
  }

  return <DetailView loan={loan} />;
}

function DetailView({ loan }: { loan: LoanDetailT }) {
  const { authenticated, user, login } = useAuth();
  const { isLender } = useAccountMode();
  const approve = useApproveLoan();
  const acceptBid = useAcceptBid(loan.id);
  const [bidOpen, setBidOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = authenticated && user?.id === loan.owner_user_id;
  const tl = timeLeft(loan.auction_deadline);
  const rate = loan.best_rate ?? loan.interest_rate;

  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: loan.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <section className="border-b border-line bg-paper-grad">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Marketplace
          </Link>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={loan.status} />
                <span className="rounded-full border border-line bg-paper-dim px-2.5 py-1 text-[0.7rem] font-medium text-ink-soft">
                  {tradeTypeLabel(loan.trade_type)} · {loan.industry}
                </span>
              </div>
              <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tightish text-balance sm:text-4xl">
                {loan.title}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-ink-soft">
                <Building2 className="h-4 w-4 text-ink-muted" />
                {loan.company.name}
                {loan.company.city && <span className="text-ink-muted">· {loan.company.city}</span>}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={share}>
                {copied ? <Check className="h-4 w-4 text-jade" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Copied" : "Share"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.7fr_1fr]">
        {/* Main */}
        <div className="space-y-6">
          {loan.description && (
            <Card title="Loan overview">
              <p className="whitespace-pre-line leading-relaxed text-ink-soft">{loan.description}</p>
              {loan.purpose && (
                <p className="mt-4 rounded-lg border border-line bg-paper-dim px-4 py-3 text-sm text-ink-soft">
                  <span className="font-semibold text-ink">Purpose · </span>
                  {loan.purpose}
                </p>
              )}
            </Card>
          )}

          {/* Trade route */}
          <Card title="Trade details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail icon={Package} label="Goods" value={loan.goods ?? "—"} />
              <Detail icon={Globe2} label="Trade type" value={tradeTypeLabel(loan.trade_type)} />
              <Detail icon={MapPin} label="Origin" value={loan.origin_country ?? "—"} />
              <Detail icon={MapPin} label="Destination" value={loan.destination_country ?? "—"} />
            </div>
            {(loan.origin_country || loan.destination_country) && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-paper-dim px-4 py-3 text-sm font-medium text-ink">
                <span>{loan.origin_country ?? "Origin"}</span>
                <span className="h-px flex-1 bg-line-strong" />
                <ArrowRight className="h-4 w-4 text-brand" />
                <span className="h-px flex-1 bg-line-strong" />
                <span>{loan.destination_country ?? "Destination"}</span>
              </div>
            )}
          </Card>

          {/* Score */}
          <Card
            title="OpenLoan Score"
            action={
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                <Gauge className="h-3.5 w-3.5" /> Grade {loan.score.grade}
              </span>
            }
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex flex-col items-center gap-2">
                <ScoreGauge score={loan.score.score} grade={loan.score.grade} />
                <span className="text-xs font-medium text-ink-muted">
                  {GRADE_META[loan.score.grade].label}
                </span>
              </div>
              <div className="flex-1 space-y-3.5">
                {loan.score.factors.map((f) => (
                  <div key={f.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-soft" title={f.description}>
                        {f.label}
                      </span>
                      <span className="font-mono text-xs text-ink-muted nums">
                        {f.score} · {Math.round(f.weight * 100)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-deep">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${f.score}%`,
                          backgroundColor: GRADE_META[loan.score.grade].color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-5 rounded-lg border border-gold/40 bg-gold-tint px-3 py-2 text-xs text-ink-soft">
              Illustrative score. The production engine combines CDI banking & accounting data,
              CargoX trade documents and repayment history.{" "}
              <Link to="/cdi" className="font-semibold text-brand link-underline">
                Learn how it works
              </Link>
            </p>
          </Card>

          {/* Documents */}
          <Card title="Documents" action={<span className="text-xs text-ink-muted">{loan.documents.length} files</span>}>
            {loan.documents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line-strong bg-paper-dim px-4 py-6 text-center text-sm text-ink-muted">
                No documents attached to this loan.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {loan.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-deep text-ink-muted">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{d.filename}</p>
                        <p className="text-xs text-ink-muted">
                          {d.category ?? "Document"} · {formatBytes(d.size_bytes)}
                        </p>
                      </div>
                    </div>
                    <a href={d.download_url} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" /> Download
                      </Button>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Company */}
          <Card title="About the business">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-harbor font-display text-lg font-semibold text-paper">
                {loan.company.name.slice(0, 1)}
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-ink">{loan.company.name}</p>
                <p className="text-sm text-ink-muted">
                  {loan.company.industry} · {loan.company.country}
                </p>
              </div>
            </div>
            {loan.company.website && (
              <a
                href={loan.company.website}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand link-underline"
              >
                Visit website <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-line bg-paper-dim px-5 py-4">
              <GradeBadge grade={loan.risk_grade} size="lg" />
              <div className="text-right">
                <p className="text-[0.62rem] uppercase tracking-widest2 text-ink-muted">
                  {loan.best_rate ? "Best offer" : "Target rate"}
                </p>
                <p className="font-mono text-2xl font-semibold text-brand nums">{formatPercent(rate)}</p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <Term label="Amount requested" value={formatCurrency(loan.amount, loan.currency)} big />
              {loan.funded_amount > 0 && (
                <Term label="Funded" value={formatCurrency(loan.funded_amount, loan.currency)} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <Term label="Term" value={`${loan.term_days} days`} icon={Calendar} />
                <Term label="Bids" value={formatNumber(loan.bid_count)} icon={Gavel} />
              </div>
              <Term
                label="Auction"
                value={tl.label}
                icon={Clock}
                accent={tl.urgent ? "brand" : undefined}
              />
              <Term label="Closing date" value={formatDate(loan.auction_deadline)} />

              {/* Actions */}
              <div className="pt-1">
                <ActionArea
                  loan={loan}
                  isOwner={!!isOwner}
                  isLender={isLender}
                  authenticated={authenticated}
                  onFund={() => setBidOpen(true)}
                  onLogin={() => login(window.location.href)}
                  onApprove={() => approve.mutate(loan.id)}
                  approving={approve.isPending}
                />
              </div>
            </div>
          </div>

          {/* Offers */}
          <OffersCard
            loan={loan}
            isOwner={!!isOwner}
            onAccept={(bidId) => acceptBid.mutate(bidId)}
            accepting={acceptBid.isPending}
          />
        </div>
      </div>

      <BidDialog loan={loan} open={bidOpen} onClose={() => setBidOpen(false)} />
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function ActionArea({
  loan,
  isOwner,
  isLender,
  authenticated,
  onFund,
  onLogin,
  onApprove,
  approving,
}: {
  loan: LoanDetailT;
  isOwner: boolean;
  isLender: boolean;
  authenticated: boolean;
  onFund: () => void;
  onLogin: () => void;
  onApprove: () => void;
  approving: boolean;
}) {
  if (isOwner) {
    if (loan.status === "pending_approval") {
      return (
        <div className="space-y-2">
          <Button className="w-full" onClick={onApprove} disabled={approving}>
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish loan to market"}
          </Button>
          <p className="text-center text-xs text-ink-muted">
            You own this loan. Publishing opens it for lender bids.
          </p>
        </div>
      );
    }
    return (
      <p className="rounded-xl border border-line bg-paper-dim px-4 py-3 text-center text-sm text-ink-soft">
        You own this loan — review and accept offers below.
      </p>
    );
  }

  if (loan.status !== "open") {
    return (
      <p className="rounded-xl border border-line bg-paper-dim px-4 py-3 text-center text-sm text-ink-soft">
        This auction is {loan.status === "pending_approval" ? "awaiting approval" : `${loan.status}`}.
      </p>
    );
  }

  if (!authenticated) {
    return (
      <Button className="w-full" onClick={onLogin}>
        Sign in to fund this loan
      </Button>
    );
  }

  if (isLender) {
    return (
      <Button className="w-full" onClick={onFund}>
        <Gavel className="h-4 w-4" /> Fund this loan
      </Button>
    );
  }

  return (
    <p className="rounded-xl border border-line bg-paper-dim px-4 py-3 text-center text-sm text-ink-soft">
      Switch to <span className="font-semibold text-ink">Lend</span> mode to fund this loan.
    </p>
  );
}

function OffersCard({
  loan,
  isOwner,
  onAccept,
  accepting,
}: {
  loan: LoanDetailT;
  isOwner: boolean;
  onAccept: (bidId: string) => void;
  accepting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-brand" />
        <h3 className="font-display text-lg font-semibold">Open offers</h3>
        <span className="ml-auto text-xs text-ink-muted">{loan.bids.length}</span>
      </div>
      {loan.bids.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-paper-dim px-4 py-6 text-center text-sm text-ink-muted">
          No offers yet. Be the first to fund this loan.
        </p>
      ) : (
        <ul className="space-y-2">
          {loan.bids.map((b) => (
            <OfferRow
              key={b.id}
              bid={b}
              currency={loan.currency}
              canAccept={isOwner && loan.status === "open" && b.status === "pending"}
              onAccept={() => onAccept(b.id)}
              accepting={accepting}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function OfferRow({
  bid,
  currency,
  canAccept,
  onAccept,
  accepting,
}: {
  bid: Bid;
  currency: string;
  canAccept: boolean;
  onAccept: () => void;
  accepting: boolean;
}) {
  const accepted = bid.status === "accepted";
  return (
    <li
      className={`rounded-xl border px-4 py-3 ${
        accepted ? "border-jade/40 bg-jade-tint" : "border-line bg-paper-dim"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-ink">{bid.lender_name}</span>
        <span className="font-mono text-sm font-semibold text-ink nums">
          {formatPercent(bid.interest_rate)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-mono text-xs text-ink-muted nums">
          {formatCurrency(bid.amount, currency, true)}
        </span>
        {accepted ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-jade-600">
            <Check className="h-3.5 w-3.5" /> Accepted
          </span>
        ) : bid.status === "rejected" ? (
          <span className="text-xs text-ink-muted">Not selected</span>
        ) : canAccept ? (
          <Button size="sm" variant="gold" onClick={onAccept} disabled={accepting}>
            Accept
          </Button>
        ) : (
          <span className="text-xs text-ink-muted">Pending</span>
        )}
      </div>
    </li>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-deep text-ink-muted">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[0.62rem] uppercase tracking-widest2 text-ink-muted">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

function Term({
  label,
  value,
  icon: Icon,
  big,
  accent,
}: {
  label: string;
  value: string;
  icon?: typeof Calendar;
  big?: boolean;
  accent?: "brand";
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-widest2 text-ink-muted">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p
        className={`mt-1 font-mono font-semibold nums ${big ? "text-xl" : "text-sm"} ${
          accent === "brand" ? "text-brand" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
