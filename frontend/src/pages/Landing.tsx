import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  FileCheck2,
  Gauge,
  Globe2,
  Layers,
  Minus,
  Plus,
  ShieldCheck,
  Ship,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { useMarketplace } from "@/hooks/useLoans";
import { media } from "@/lib/images";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

export function LandingPage() {
  const { data: deals } = useMarketplace({ status: "open", sort: "newest", limit: 8 });

  return (
    <>
      <Hero deals={deals ?? []} />
      <InfraStrip />
      <HowItWorks />
      <ScoringSection />
      <AuctionSection />
      <TradeBand />
      <Faq />
      <FinalCta />
    </>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

type DealLite = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  interest_rate: number;
  best_rate?: number | null;
};

function Hero({ deals }: { deals: DealLite[] }) {
  return (
    <section className="relative isolate overflow-hidden text-paper grain-overlay">
      {/* Victoria Harbour skyline, slowly drifting. */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center animate-ken-burns"
        style={{ backgroundImage: `url(${media.hongKongNight})` }}
        aria-hidden
      />
      {/* Harbour-tinted veil keeps the copy legible over the photo. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(105deg, rgba(4,15,20,0.97) 0%, rgba(6,22,28,0.9) 40%, rgba(8,30,38,0.66) 74%, rgba(10,42,52,0.5) 100%), radial-gradient(80% 70% at 90% 6%, rgba(44,126,140,0.32), transparent 55%), radial-gradient(60% 60% at 100% 100%, rgba(194,54,42,0.20), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-28 lg:pt-24">
        <div className="flex flex-col justify-center">
          <span className="eyebrow inline-flex w-fit items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-gold-light backdrop-blur-sm animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-glow" /> Greater Bay Area · Hong Kong
          </span>
          <h1 className="mt-6 max-w-xl font-display text-4xl font-semibold leading-[1.05] tracking-tightish text-balance animate-fade-up sm:text-6xl">
            An open marketplace for{" "}
            <span className="text-gold-light">trade finance</span>.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-paper/75 animate-fade-up delay-1">
            Instead of one bank deciding, capital providers compete to fund real trade
            deals. TradeFlow connects Hong Kong's businesses with investors — deal by deal.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up delay-2">
            <Link to="/marketplace" className={cn(buttonVariants({ variant: "light", size: "lg" }))}>
              Explore the marketplace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/deals/new"
              className={cn(
                buttonVariants({ size: "lg" }),
                "border border-paper/25 bg-paper/5 text-paper backdrop-blur-sm hover:bg-paper/10 hover:shadow-none",
              )}
            >
              Post a deal
            </Link>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-paper/10 pt-7 animate-fade-up delay-3">
            {[
              { v: "HK$50K–10M+", l: "Deal sizes" },
              { v: "A–E", l: "TradeFlow Score" },
              { v: "Open", l: "Auction pricing" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-display text-2xl font-semibold text-paper nums">{s.v}</dt>
                <dd className="mt-1 text-xs text-paper/55">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 3D scene: rotating globe with the live deal card floating in front. */}
        <div className="relative flex items-center justify-center">
          <div className="scene-3d relative mx-auto flex min-h-[360px] w-full max-w-md items-center justify-center py-4 animate-fade-in delay-2">
            <Globe />
            <div className="absolute -bottom-3 right-0 w-[256px] animate-float-y sm:-right-3 sm:w-[296px]">
              <div className="tilt-3d">
                <HeroDealCard deals={deals} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {deals.length > 0 && <DealTicker deals={deals} />}
    </section>
  );
}

/* A CSS-only rotating globe: an equirectangular earth texture scrolls
   horizontally (two copies, wraps seamlessly) inside a shaded circular mask. */
function Globe() {
  return (
    <div className="relative aspect-square w-[80%] max-w-[360px] sm:w-[88%]">
      {/* atmosphere */}
      <div className="absolute inset-[-14%] rounded-full bg-harbor-glow/25 blur-3xl" aria-hidden />
      {/* orbit rings */}
      <div className="absolute inset-[-7%] rounded-full border border-paper/10" aria-hidden />
      <div className="absolute inset-[3%] rounded-full border border-paper/5" aria-hidden />
      {/* orbiting satellite */}
      <div className="absolute left-1/2 top-1/2" aria-hidden>
        <span
          className="block h-2.5 w-2.5 -ml-[5px] -mt-[5px] rounded-full bg-gold-light shadow-[0_0_16px_4px_rgba(230,205,140,0.65)] animate-orbit"
          style={{ "--orbit-r": "168px" } as CSSProperties}
        />
      </div>

      <div className="globe absolute inset-0 animate-float-y-slow">
        <div className="globe-map absolute inset-y-0 left-0 flex w-max animate-globe-spin will-change-transform">
          <img src={media.earthTexture} alt="" aria-hidden draggable={false} className="h-full w-auto max-w-none shrink-0 select-none" />
          <img src={media.earthTexture} alt="" aria-hidden draggable={false} className="h-full w-auto max-w-none shrink-0 select-none" />
        </div>

        {/* Hong Kong hub marker (decorative anchor). */}
        <div className="absolute left-[33%] top-[39%] z-[4] flex items-center gap-2">
          <span className="relative grid place-items-center">
            <span className="absolute h-3.5 w-3.5 rounded-full bg-gold-light/60 animate-pulse-glow" />
            <span className="relative h-2 w-2 rounded-full bg-gold-light ring-2 ring-harbor-950" />
          </span>
          <span className="whitespace-nowrap rounded-full border border-paper/15 bg-harbor-950/70 px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-widest2 text-gold-light backdrop-blur-sm">
            Hong Kong
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroDealCard({ deals }: { deals: DealLite[] }) {
  const sample = deals[0];
  return (
    <div className="relative w-full">
      <div className="relative rounded-2xl border border-paper/15 bg-harbor-950/55 p-6 shadow-harbor backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="eyebrow inline-flex items-center gap-1.5 text-paper/55">
            <span className="h-1.5 w-1.5 rounded-full bg-jade-soft animate-pulse-glow" /> Live deal
          </span>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-jade font-display text-lg font-semibold text-paper">
            A
          </span>
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-paper">
          {sample?.title ?? "Import of consumer electronics from Shenzhen"}
        </h3>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-paper/10 bg-harbor-950/50 p-4">
            <p className="text-[0.62rem] uppercase tracking-widest2 text-paper/45">Requested</p>
            <p className="mt-1 font-mono text-lg font-semibold text-paper nums">
              {formatCurrency(sample?.amount ?? 850000, sample?.currency ?? "HKD", true)}
            </p>
          </div>
          <div className="rounded-xl border border-paper/10 bg-harbor-950/50 p-4">
            <p className="text-[0.62rem] uppercase tracking-widest2 text-paper/45">Best rate</p>
            <p className="mt-1 font-mono text-lg font-semibold text-gold-light nums">
              {formatPercent(sample?.best_rate ?? sample?.interest_rate ?? 7.9)}
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {["Harbour Capital — 7.9%", "Meridian Private Credit — 8.1%", "GBA Family Office — 8.4%"].map(
            (b, i) => (
              <div
                key={b}
                className="flex items-center justify-between rounded-lg border border-paper/8 bg-paper/[0.04] px-3 py-2 text-sm"
              >
                <span className="text-paper/75">{b.split(" — ")[0]}</span>
                <span className="font-mono text-paper nums">{b.split(" — ")[1]}</span>
                {i === 0 && (
                  <span className="ml-2 rounded-full bg-jade/20 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-jade-soft">
                    Leading
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function DealTicker({ deals }: { deals: DealLite[] }) {
  const row = [...deals, ...deals];
  return (
    <div className="relative border-t border-paper/10 bg-harbor-950/60 py-3 backdrop-blur-sm">
      <div className="ticker-mask overflow-hidden">
        <div className="flex w-max animate-ticker gap-8 whitespace-nowrap">
          {row.map((d, i) => (
            <span key={`${d.id}-${i}`} className="inline-flex items-center gap-3 text-sm text-paper/60">
              <Ship className="h-3.5 w-3.5 text-gold-light" />
              <span className="text-paper/80">{d.title}</span>
              <span className="font-mono text-gold-light nums">
                {formatPercent(d.best_rate ?? d.interest_rate)}
              </span>
              <span className="text-paper/25">·</span>
              <span className="font-mono nums">{formatCurrency(d.amount, d.currency, true)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Infrastructure strip ──────────────────────────────────────────────── */

function InfraStrip() {
  return (
    <section className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-sm font-medium text-ink-muted">
          Built on Hong Kong's financial infrastructure
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-ink-soft">
          {[
            { icon: ShieldCheck, label: "HKMA CDI" },
            { icon: Ship, label: "CargoX e-B/L" },
            { icon: Globe2, label: "Greater Bay Area" },
            { icon: Layers, label: "Open auction" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 font-display text-base font-medium">
              <Icon className="h-4 w-4 text-brand" /> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ──────────────────────────────────────────────────────── */

function HowItWorks() {
  const [tab, setTab] = useState<"business" | "lender">("business");
  const content = {
    business: {
      icon: Building2,
      steps: [
        { t: "Create your company profile", d: "Add your trading business and connect data via HKMA's CDI." },
        { t: "Publish a trade deal", d: "Describe the goods, amount and term. We compute a TradeFlow Score." },
        { t: "Compare competing offers", d: "Investors bid to fund your deal — you pick the best rate." },
        { t: "Get funded, repay on close", d: "Capital is released; you repay once the trade settles." },
      ],
    },
    lender: {
      icon: Wallet,
      steps: [
        { t: "Browse real trade deals", d: "Filter by risk grade, industry, rate and deadline." },
        { t: "Assess transparent risk", d: "Every deal carries a TradeFlow Score with an explainable breakdown." },
        { t: "Bid your rate", d: "Compete in an open auction to win attractive deals." },
        { t: "Build a portfolio", d: "Track funded deals and returns from your dashboard." },
      ],
    },
  }[tab];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="flex flex-col items-center text-center">
        <span className="eyebrow text-brand">How it works</span>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tightish text-balance sm:text-4xl">
          Two sides of one open market
        </h2>
        <div className="mt-7 inline-flex rounded-full border border-line-strong bg-paper-dim p-1">
          {(["business", "lender"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-all",
                tab === k ? "bg-ink text-paper shadow-card" : "text-ink-muted hover:text-ink",
              )}
            >
              {k === "business" ? "For businesses" : "For investors"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {content.steps.map((s, i) => (
          <div
            key={s.t}
            className="card-surface group relative p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <span className="font-mono text-sm font-semibold text-brand">0{i + 1}</span>
            <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Scoring section (placeholder) ─────────────────────────────────────── */

function ScoringSection() {
  const factors = [
    { l: "Trade history", w: "25%" },
    { l: "Financial strength", w: "25%" },
    { l: "Repayment record", w: "20%" },
    { l: "Counterparty risk", w: "15%" },
    { l: "Document verification", w: "15%" },
  ];
  return (
    <section className="border-y border-line bg-paper-grad">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <span className="eyebrow inline-flex items-center gap-2 text-brand">
            <Gauge className="h-4 w-4" /> The TradeFlow Score
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish text-balance sm:text-4xl">
            Transparent risk, graded A to E
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
            Every deal is scored from real signals — banking and accounting data shared
            via HKMA's CDI, trade documents from CargoX, repayment history and more. The
            score is explainable, so investors see exactly what drives it.
          </p>
          <Link
            to="/cdi"
            className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand link-underline"
          >
            How scoring & CDI work <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-6 inline-block rounded-lg border border-gold/40 bg-gold-tint px-3 py-2 text-xs text-ink-soft">
            Demo note — the scoring engine shown here is illustrative.
          </p>
        </div>

        {/* Score panel floating in front of a framed photo of Central / IFC. */}
        <div className="relative">
          <figure
            className="absolute -right-4 -top-8 hidden h-[86%] w-[80%] overflow-hidden rounded-2xl border border-line-strong shadow-lift lg:block"
            style={{ transform: "rotate(2.5deg)" }}
            aria-hidden
          >
            <img
              src={media.centralFinance}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-harbor-deep/55 via-harbor-deep/10 to-gold/10" />
            <figcaption className="absolute bottom-3 left-3 rounded-full border border-paper/20 bg-harbor-950/70 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-widest2 text-paper backdrop-blur-sm">
              Central · Hong Kong
            </figcaption>
          </figure>

          <div className="card-surface relative overflow-hidden p-7 lg:mt-10">
            <div className="flex items-center justify-between border-b border-line pb-5">
              <div>
                <p className="eyebrow text-ink-muted">Sample assessment</p>
                <p className="mt-1 font-display text-lg font-semibold">Pearl River Electronics</p>
              </div>
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-jade font-display text-2xl font-semibold text-paper">
                A
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {factors.map((f, i) => {
                const val = [88, 82, 79, 84, 90][i];
                return (
                  <div key={f.l}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-soft">{f.l}</span>
                      <span className="font-mono text-ink-muted nums">
                        {val} · {f.w}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-deep">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-jade to-jade-600"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Auction section (placeholder) ─────────────────────────────────────── */

function AuctionSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="order-2 card-surface p-7 lg:order-1">
          <p className="eyebrow text-ink-muted">Open auction · live offers</p>
          <div className="mt-4 space-y-3">
            {[
              { n: "Harbour Capital Partners", r: "7.9%", lead: true },
              { n: "Meridian Private Credit", r: "8.1%" },
              { n: "GBA Family Office", r: "8.4%" },
              { n: "Bank of Victoria", r: "8.6%" },
            ].map((b) => (
              <div
                key={b.n}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
                  b.lead ? "border-jade/40 bg-jade-tint" : "border-line bg-paper-dim",
                )}
              >
                <span className="text-sm font-medium text-ink">{b.n}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-ink nums">{b.r}</span>
                  {b.lead && (
                    <span className="rounded-full bg-jade px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-paper">
                      Leading
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <span className="eyebrow inline-flex items-center gap-2 text-brand">
            <TrendingUp className="h-4 w-4" /> The auction system
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish text-balance sm:text-4xl">
            The market sets the rate
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
            Businesses publish a deal; investors place competing offers. Lower rates rise to
            the top, and the business chooses the offer that fits. Pricing is discovered by
            the market — not dictated by a single lender.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Investors bid their rate and amount",
              "Best offers surface automatically",
              "The business accepts a winning bid",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-jade" /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 inline-block rounded-lg border border-gold/40 bg-gold-tint px-3 py-2 text-xs text-ink-soft">
            Demo note — the auction mechanics shown here are a simplified preview.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Trade band (photographic stats over the container port) ───────────── */

function TradeBand() {
  const stats = [
    { v: "US$2.5T+", l: "Global trade finance gap" },
    { v: "98%", l: "of HK businesses are SMEs" },
    { v: "5 signals", l: "behind every score" },
    { v: "1 market", l: "open to all qualified investors" },
  ];
  return (
    <section className="photo-band text-paper">
      <div
        className="photo-band-img"
        style={{ backgroundImage: `url(${media.containerPort})` }}
        aria-hidden
      />
      <div
        className="photo-band-veil"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,17,22,0.86) 0%, rgba(6,20,26,0.8) 100%), linear-gradient(100deg, rgba(4,14,18,0.92) 0%, rgba(6,22,28,0.4) 70%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <span className="eyebrow inline-flex items-center gap-2 text-gold-light">
            <Ship className="h-4 w-4" /> Greater Bay Area
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish text-balance sm:text-4xl">
            Finance that moves with real trade
          </h2>
          <p className="mt-4 max-w-xl text-paper/75">
            From Kwai Tsing's container terminals to the Pearl River Delta, TradeFlow links
            the region's importers and exporters with the capital that keeps goods moving —
            one verified deal at a time.
          </p>
        </div>
        <dl className="mt-12 grid grid-cols-2 gap-8 border-t border-paper/15 pt-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l}>
              <dt className="font-display text-3xl font-semibold text-gold-light nums sm:text-4xl">{s.v}</dt>
              <dd className="mt-2 text-sm text-paper/65">{s.l}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Who can raise capital on TradeFlow?",
    a: "Any legitimate trading business — importers, exporters, wholesalers, distributors and e-commerce merchants. The platform is designed especially for small and medium enterprises that struggle to access traditional trade finance.",
  },
  {
    q: "Who can invest?",
    a: "Banks, private credit funds, family offices, institutional investors and qualified individuals. TradeFlow opens an asset class that has historically been reserved for institutions.",
  },
  {
    q: "What exactly gets financed?",
    a: "Individual trade deals, not the company as a whole. A business publishes a specific deal — for example HK$850,000 to import electronics from Shenzhen — and that deal is funded.",
  },
  {
    q: "How is risk assessed?",
    a: "Each deal receives a TradeFlow Score (A–E) built from company data, trade activity, repayment history and document verification — drawing on HKMA's CDI and CargoX. The score is transparent and explainable.",
  },
  {
    q: "Is this a live financial product?",
    a: "No. This is a hackathon demo that showcases an open marketplace for trade finance. Figures and scores are illustrative.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-t border-line bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="text-center">
          <span className="eyebrow text-brand">FAQ</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish sm:text-4xl">
            Questions, answered
          </h2>
        </div>
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-card">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-display text-lg font-medium text-ink">{f.q}</span>
                {open === i ? (
                  <Minus className="h-5 w-5 shrink-0 text-brand" />
                ) : (
                  <Plus className="h-5 w-5 shrink-0 text-ink-muted" />
                )}
              </button>
              {open === i && (
                <p className="px-6 pb-5 text-sm leading-relaxed text-ink-soft animate-fade-in">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ─────────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-3xl bg-harbor-deep px-8 py-16 text-center text-paper grain-overlay sm:px-16">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${media.hongKongNight})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-harbor-deep via-harbor-deep/75 to-harbor-deep/45"
          aria-hidden
        />
        <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tightish text-balance sm:text-4xl">
          Every legitimate trade deal deserves to be financed
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-paper/75">
          Join the open marketplace for trade finance in Hong Kong and the Greater Bay Area.
        </p>
        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/marketplace" className={cn(buttonVariants({ variant: "light", size: "lg" }))}>
            Explore deals <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            to="/deals/new"
            className={cn(
              buttonVariants({ size: "lg" }),
              "border border-paper/25 bg-paper/5 text-paper backdrop-blur-sm hover:bg-paper/10 hover:shadow-none",
            )}
          >
            Post your first deal
          </Link>
        </div>
      </div>
    </section>
  );
}
