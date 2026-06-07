import { Link } from "react-router-dom";
import { ArrowRight, Compass, Flag, Globe2, Rocket, Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const VALUES = [
  {
    icon: Target,
    title: "Our mission",
    body: "Make sure every legitimate trade deal can be financed — not just those backed by large banks or heavy collateral.",
  },
  {
    icon: Compass,
    title: "Our approach",
    body: "Finance individual loans, not whole companies. Tie capital directly to real economic activity, priced by an open market.",
  },
  {
    icon: Globe2,
    title: "Our market",
    body: "We start in Hong Kong and the Greater Bay Area — one of the world's densest, most connected trading regions.",
  },
];

const TEAM = [
  { name: "Markus Huber", role: "AI/ML Engineer", initials: "MH" },
  { name: "Matthias Meierlohr", role: "Product & Trade Finance", initials: "MM" },
  { name: "Jonas Hörter", role: "Engineering", initials: "JH" },
  { name: "Lukas Pendi", role: "Product & Trade Finance", initials: "LP" },
];

const ROADMAP = [
  { phase: "Now", title: "Hackathon MVP", body: "Marketplace, loan requests, OpenLoan Score and an auction for bids.", done: true },
  { phase: "Next", title: "Live CDI & CargoX integration", body: "Real consent-based data feeds powering the scoring engine." },
  { phase: "Then", title: "Settlement & repayment rails", body: "End-to-end financing flow with payments and automated repayment." },
  { phase: "Later", title: "Scale beyond Hong Kong", body: "Expand across the Greater Bay Area and into new trade corridors." },
];

export function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-harbor-deep text-paper grain-overlay">
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-gold-light">
            <Flag className="h-3.5 w-3.5" /> About OpenLoan
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tightish text-balance sm:text-5xl">
            A world where every trade can be financed
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-paper/70">
            Today, a single bank often decides whether a business can grow. We believe capital
            should flow more efficiently — so we built an open market for trade-finance loans.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="card-surface p-7">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-tint text-brand">
                <v.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold">{v.title}</h2>
              <p className="mt-2 leading-relaxed text-ink-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem / vision band */}
      <section className="border-y border-line bg-paper-grad">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="eyebrow text-brand">The problem</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
              A financing gap between paying and getting paid
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Traders must pay suppliers long before they're paid by customers. Large firms bridge
              this with trade finance, credit lines and letters of credit. Smaller firms often
              can't — creating liquidity crunches and stalled growth.
            </p>
          </div>
          <div>
            <span className="eyebrow text-brand">The opportunity</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
              An asset class opened to more lenders
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Meanwhile, lenders hunt for attractive, short-duration credit but rarely access
              individual trade-finance loans. OpenLoan connects both sides — banks, funds, family offices
              and qualified individuals — around real, scored loans.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <span className="eyebrow text-brand">The team</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
            Built by a small, focused crew
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => (
            <div key={m.name} className="card-surface flex flex-col items-center p-7 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-harbor font-display text-xl font-semibold text-paper">
                {m.initials}
              </span>
              <p className="mt-4 font-display text-lg font-semibold">{m.name}</p>
              <p className="text-sm text-ink-muted">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <span className="eyebrow inline-flex items-center gap-2 text-brand">
              <Rocket className="h-4 w-4" /> Next steps
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">Where we're headed</h2>
          </div>
          <div className="mt-12 space-y-4">
            {ROADMAP.map((r) => (
              <div
                key={r.title}
                className="flex items-start gap-5 rounded-2xl border border-line bg-card p-6 shadow-card"
              >
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide",
                    r.done ? "bg-jade-tint text-jade-600" : "bg-paper-deep text-ink-muted",
                  )}
                >
                  {r.phase}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-harbor-deep px-8 py-14 text-center text-paper grain-overlay">
          <h2 className="relative font-display text-3xl font-semibold tracking-tightish">
            Join the open trade-finance loan market
          </h2>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/marketplace" className={cn(buttonVariants({ variant: "light", size: "lg" }))}>
              Explore loans <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/mcp"
              className={cn(
                buttonVariants({ size: "lg" }),
                "border border-paper/20 bg-transparent text-paper hover:bg-paper/10 hover:shadow-none",
              )}
            >
              Developer & MCP
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
