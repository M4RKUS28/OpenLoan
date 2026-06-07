import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BookOpen,
  Building2,
  Check,
  Database,
  FileCheck2,
  Gauge,
  Lock,
  Ship,
  Workflow,
} from "lucide-react";
import { GradeBadge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import type { RiskGrade } from "@/lib/api";
import { cn } from "@/lib/utils";

const SCORE_STRUCTURE = [
  {
    label: "Borrower score",
    value: "45 pts",
    note: "Repayment history, exposure, continuity, compliance, KYB, and activity continuity.",
  },
  {
    label: "Transaction score",
    value: "55 pts",
    note: "Advance rate, collateral, order normality, completeness, and CDI-backed trade signals.",
  },
  {
    label: "Total",
    value: "100 pts",
    note: "The final total and grade are persisted on the loan record at creation.",
  },
];

const GRADE_MAPPING: Array<{ grade: RiskGrade; range: string; label: string }> = [
  { grade: "A", range: "85-100", label: "Very low risk" },
  { grade: "B", range: "70-84", label: "Low risk" },
  { grade: "C", range: "55-69", label: "Moderate risk" },
  { grade: "D", range: "40-54", label: "Elevated risk" },
  { grade: "E", range: "<40", label: "High risk" },
];

const BORROWER_COMPONENTS = [
  { component: "Past repayment history on our platform", weight: 20 },
  { component: "Current exposure on our platform", weight: 10 },
  { component: "Business age and operating continuity", weight: 5 },
  { component: "Legal/compliance status", weight: 4 },
  { component: "Basic borrower identity and KYB consistency", weight: 2 },
  { component: "CDI-observed business activity continuity", weight: 4 },
];

const TRANSACTION_COMPONENTS = [
  { component: "Loan-to-invoice / advance-rate reasonableness", weight: 8 },
  { component: "Collateral/recovery quality", weight: 10 },
  { component: "Order normality based on our platform history", weight: 7 },
  { component: "Basic transaction completeness", weight: 5 },
  { component: "Verified trade/shipment data", weight: 14 },
  { component: "Supplier reliability", weight: 4 },
  { component: "CDI-based order normality", weight: 4 },
  { component: "Buyer/customer/channel concentration risk", weight: 3 },
];

const DATA_SOURCES = [
  {
    icon: Database,
    source: "Platform DB",
    meaning: "Data from previous loans and current exposure.",
    example: "repayment history, open loans",
  },
  {
    icon: BookOpen,
    source: "Government/public data",
    meaning: "Public or registry-style checks represented in the demo borrower data.",
    example: "registration status, winding-up indicators",
  },
  {
    icon: Building2,
    source: "Company-provided basic data",
    meaning: "Basic transaction and application fields submitted with the loan request.",
    example: "invoice value, PO value, supplier name, product type",
  },
  {
    icon: Ship,
    source: "Mock CDI API",
    meaning: "Demo stand-in for consented trade-data enrichment.",
    example: "shipment verification, supplier reliability, channel concentration",
  },
];

const CDI_BACKED_POINTS = [
  "Verified trade/shipment data",
  "Supplier reliability",
  "CDI-based order normality",
  "Buyer/customer/channel concentration risk",
];

const SHOWSTOPPER_EXAMPLES = [
  "requested loan amount exceeds invoice value",
  "duplicate or previously financed invoice flagged by the CDI mock",
  "shipment record conflict with the declared invoice or bill of lading",
  "non-positive loan amount, loan duration, or invoice value",
  "CDI mock API unavailable",
];

const CREATION_FLOW = [
  "Borrower submits a loan request.",
  "Backend completes demo transaction data where needed.",
  "Backend calculates borrower score from platform/mock DB data.",
  "Backend calls the mock CDI API for transaction enrichment.",
  "Backend calculates total score and grade.",
  "Backend stores the score on the loan/deal record.",
  "Frontend fetches and displays the stored score.",
];

export function CDIPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-harbor-deep text-paper grain-overlay">
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-gold-light">
            <Gauge className="h-3.5 w-3.5" /> Backend-owned scoring
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tightish text-balance sm:text-5xl">
            Scoring and CDI
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-paper/70">
            The credit score is calculated per loan request, not per company. Short-term
            supply-chain finance depends on the borrower's repayment record and on the specific
            shipment, supplier, collateral, and repayment path of the current transaction.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs font-semibold text-paper/80">
            <span className="rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5">
              calculated during loan creation
            </span>
            <span className="rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5">
              persisted in the database
            </span>
            <span className="rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5">
              frontend display-only
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <span className="eyebrow text-brand">Overview</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
              A deal-specific credit score
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Each new loan request is expanded into a full scoring input by the backend, scored
              once, and saved on the loan record as stored credit-score JSON. Marketplace cards,
              deal details, and grade badges display that stored data.
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Opening this informational tab does not call the scoring service, does not call the
              mock CDI API, and does not recalculate any score in the browser.
            </p>
          </div>

          <div className="card-surface p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">Creation-time persistence</h3>
                <p className="text-sm text-ink-muted">Backend calculates. Database stores. UI reads.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-ink-soft">
              <CheckLine>Scores are calculated backend-side during loan creation.</CheckLine>
              <CheckLine>The final total, grade, subtotals, components, and showstopper are saved.</CheckLine>
              <CheckLine>The frontend only displays the stored scoring data returned by the API.</CheckLine>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper-grad">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="text-center">
            <span className="eyebrow text-brand">Score structure</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
              Two linked sections add up to 100 points
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {SCORE_STRUCTURE.map((item) => (
              <div key={item.label} className="card-surface p-6">
                <p className="text-sm font-semibold text-ink-soft">{item.label}</p>
                <p className="mt-3 font-display text-3xl font-semibold text-ink nums">{item.value}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="card-surface mt-6 overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h3 className="font-display text-lg font-semibold">Grade mapping</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-paper-dim text-xs uppercase tracking-widest text-ink-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Grade</th>
                    <th className="px-5 py-3 font-semibold">Score range</th>
                    <th className="px-5 py-3 font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {GRADE_MAPPING.map((item) => (
                    <tr key={item.grade}>
                      <td className="px-5 py-3">
                        <GradeBadge grade={item.grade} size="sm" />
                      </td>
                      <td className="px-5 py-3 font-mono text-ink nums">{item.range}</td>
                      <td className="px-5 py-3 text-ink-soft">{item.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-8">
          <span className="eyebrow text-brand">Components and weights</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
            What contributes to the percentage score
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ComponentTable title="Borrower score components" rows={BORROWER_COMPONENTS} subtotal={45} />
          <ComponentTable title="Transaction score components" rows={TRANSACTION_COMPONENTS} subtotal={55} />
        </div>
      </section>

      <section className="border-y border-line bg-paper-grad">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="eyebrow text-brand">Data sources</span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
                Where the scoring inputs come from
              </h2>
              <p className="mt-4 leading-relaxed text-ink-soft">
                The demo combines platform records, registry-style borrower checks, company-entered
                application fields, and backend CDI mock enrichment. Some values are deterministic
                demo data so the same request remains explainable and repeatable.
              </p>
            </div>

            <div className="card-surface p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-harbor text-paper">
                  <Workflow className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">Backend-only CDI mock</h3>
                  <p className="text-sm text-ink-muted">Part of the Docker/dev stack.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-ink-soft">
                <CheckLine>The frontend does not call CDI.</CheckLine>
                <CheckLine>The backend calls the CDI mock during loan creation.</CheckLine>
                <CheckLine>The mock returns trade and shipment verification signals.</CheckLine>
                <CheckLine>It demonstrates consented commercial-data enrichment; it is not a real CDI implementation.</CheckLine>
              </div>
            </div>
          </div>

          <DataSourceTable />

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card-surface p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
                  <FileCheck2 className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-semibold">CDI-backed transaction datapoints</h3>
              </div>
              <ul className="mt-5 space-y-3">
                {CDI_BACKED_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-jade" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-surface p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-tint text-gold">
                  <Banknote className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-semibold">What CDI changes in this demo</h3>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                The mock CDI API enriches the transaction score with shipment, trade, supplier, and
                buyer/channel signals. It does not make the lending decision by itself, and it does
                not replace the platform borrower record or company-provided application fields.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="card-surface p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tightish">
                  Showstopper logic
                </h2>
                <p className="text-sm text-ink-muted">Blocking issues sit outside the percentage score.</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">
              Fraud and blocking issues are treated as showstoppers. If a showstopper is present,
              the deal may require manual review or be blocked even if a numeric score is still
              available.
            </p>
            <ul className="mt-5 space-y-2.5">
              {SHOWSTOPPER_EXAMPLES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface overflow-hidden">
            <div className="border-b border-line px-6 py-5">
              <span className="eyebrow text-brand">Creation and display flow</span>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tightish">
                From loan request to stored score
              </h2>
            </div>
            <ol className="divide-y divide-line">
              {CREATION_FLOW.map((step, index) => (
                <li key={step} className="flex gap-4 px-6 py-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper-deep font-mono text-xs font-semibold text-ink-muted nums">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-ink-soft">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-card p-7 shadow-card sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tightish">Demo caveat</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
              This is a hackathon demo. Some data is mocked or invented deterministically. The
              scoring model is intended to be plausible and explainable, not production-ready
              underwriting.
            </p>
          </div>
          <Link to="/marketplace" className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>
            View scored deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function ComponentTable({
  title,
  rows,
  subtotal,
}: {
  title: string;
  rows: Array<{ component: string; weight: number }>;
  subtotal: number;
}) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-paper-dim text-xs uppercase tracking-widest text-ink-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Component</th>
              <th className="px-5 py-3 text-right font-semibold">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.component}>
                <td className="px-5 py-3 text-ink-soft">{row.component}</td>
                <td className="px-5 py-3 text-right font-mono text-ink nums">{row.weight}</td>
              </tr>
            ))}
            <tr className="bg-paper-dim">
              <td className="px-5 py-3 font-semibold text-ink">Subtotal</td>
              <td className="px-5 py-3 text-right font-mono font-semibold text-ink nums">
                {subtotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataSourceTable() {
  return (
    <div className="card-surface mt-8 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-paper-dim text-xs uppercase tracking-widest text-ink-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Source</th>
              <th className="px-5 py-3 font-semibold">Meaning</th>
              <th className="px-5 py-3 font-semibold">Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {DATA_SOURCES.map(({ icon: Icon, source, meaning, example }) => (
              <tr key={source}>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 font-semibold text-ink">
                    <Icon className="h-4 w-4 text-brand" />
                    {source}
                  </span>
                </td>
                <td className="px-5 py-4 text-ink-soft">{meaning}</td>
                <td className="px-5 py-4 text-ink-muted">{example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CheckLine({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-jade" />
      <span>{children}</span>
    </p>
  );
}
