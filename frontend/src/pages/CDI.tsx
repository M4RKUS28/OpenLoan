import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BookOpen,
  Database,
  FileCheck2,
  Gauge,
  Lock,
  Ship,
  Workflow,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const DATA_SOURCES = [
  { icon: Banknote, label: "Banking data", note: "Cash flow & account history" },
  { icon: BookOpen, label: "Accounting data", note: "Revenue, margins, liabilities" },
  { icon: Ship, label: "Trade data", note: "Shipments & trade activity" },
  { icon: Database, label: "Company data", note: "Registration & ownership" },
];

const STEPS = [
  {
    icon: Lock,
    title: "Consent-based sharing",
    body: "With the business's consent, CDI securely channels their banking and accounting data from source providers to TradeFlow.",
  },
  {
    icon: Workflow,
    title: "Standardised & verified",
    body: "Data arrives in a standardised, machine-readable format — no manual document chasing, fewer errors, faster decisions.",
  },
  {
    icon: Gauge,
    title: "Feeds the TradeFlow Score",
    body: "These verified signals — combined with CargoX trade documents — drive an explainable A–E score on every deal.",
  },
];

const FACTORS = [
  { l: "Trade history", w: 25 },
  { l: "Financial strength", w: 25 },
  { l: "Repayment record", w: 20 },
  { l: "Counterparty risk", w: 15 },
  { l: "Document verification", w: 15 },
];

export function CDIPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-harbor-deep text-paper grain-overlay">
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-gold-light">
            <Database className="h-3.5 w-3.5" /> Powered by HKMA infrastructure
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tightish text-balance sm:text-5xl">
            How CDI powers the TradeFlow Score
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-paper/70">
            The Commercial Data Interchange (CDI) is a financial data infrastructure built by the
            Hong Kong Monetary Authority. We use it to assess trade-finance risk fairly and fast.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://cdi.hkma.gov.hk/about-cdi/"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "light" }))}
            >
              About CDI (HKMA) <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="https://cdi.hkma.gov.hk/"
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants(),
                "border border-paper/20 bg-transparent text-paper hover:bg-paper/10 hover:shadow-none",
              )}
            >
              cdi.hkma.gov.hk <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* What is CDI */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow text-brand">What is CDI?</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
              A consent-based data highway for finance
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Traditionally, a small business seeking finance had to manually gather bank
              statements, accounts and trade documents — slow, inconsistent and easy to game.
              CDI lets a business <span className="font-semibold text-ink">consent</span> to share
              verified data directly from source providers to financial institutions.
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              For TradeFlow, that means we can assess a deal's risk from trustworthy, standardised
              data — opening trade finance to SMEs that banks have historically overlooked.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {DATA_SOURCES.map((d) => (
              <div key={d.label} className="card-surface p-5">
                <d.icon className="h-6 w-6 text-brand" />
                <p className="mt-3 font-display text-base font-semibold text-ink">{d.label}</p>
                <p className="mt-1 text-xs text-ink-muted">{d.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we use it */}
      <section className="border-y border-line bg-paper-grad">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <span className="eyebrow text-brand">How TradeFlow uses CDI</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
              From raw data to a transparent score
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card-surface relative p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-tint text-brand">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-sm font-semibold text-ink-muted">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CargoX + scoring */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="card-surface p-7">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-harbor text-paper">
              <Ship className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-2xl font-semibold tracking-tightish">
              CargoX trade documents
            </h3>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Alongside CDI, TradeFlow ingests logistics and trade-document signals from CargoX —
              electronic Bills of Lading, shipping records and delivery histories — to verify that
              a deal reflects real economic activity.
            </p>
            <ul className="mt-5 space-y-2.5">
              {["Electronic Bills of Lading", "Shipment & delivery history", "Trade document verification"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-ink-soft">
                    <FileCheck2 className="h-4 w-4 text-jade" /> {t}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="card-surface p-7">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-tint text-brand">
              <Gauge className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-2xl font-semibold tracking-tightish">
              What drives the score
            </h3>
            <div className="mt-5 space-y-4">
              {FACTORS.map((f) => (
                <div key={f.l}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">{f.l}</span>
                    <span className="font-mono text-ink-muted nums">{f.w}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-deep">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${f.w * 3}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-lg border border-gold/40 bg-gold-tint px-3 py-2 text-xs text-ink-soft">
              The scoring model shown in this demo is illustrative.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-line bg-card p-10 text-center shadow-card sm:flex-row sm:text-left">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tightish">
              See the score on real deals
            </h2>
            <p className="mt-2 text-ink-soft">Every deal on the marketplace carries a TradeFlow Score.</p>
          </div>
          <Link to="/marketplace" className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>
            Explore the marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
