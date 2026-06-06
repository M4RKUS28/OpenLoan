import { ArrowUpRight, Bot, Cable, Code2, Search, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    icon: Search,
    name: "search_deals",
    desc: "Query the live marketplace by industry, risk grade, rate, amount and deadline.",
  },
  {
    icon: Wallet,
    name: "get_deal",
    desc: "Fetch a single deal with its OpenLoan Score breakdown, terms and open offers.",
  },
  {
    icon: ShieldCheck,
    name: "get_score",
    desc: "Return the explainable risk assessment and contributing factors for a deal.",
  },
  {
    icon: Sparkles,
    name: "summarise_portfolio",
    desc: "Summarise an investor's bids, exposure and returns across the marketplace.",
  },
];

const USE_CASES = [
  "An investor's AI assistant scans new deals each morning and flags A/B-grade opportunities.",
  "A risk analyst asks an agent to compare OpenLoan Scores across an industry.",
  "A business co-pilot drafts a financing request from shipping documents.",
];

const CONFIG = `{
  "mcpServers": {
    "openloan": {
      "url": "https://api.openloan.example/mcp",
      "transport": "http",
      "description": "Open marketplace for trade finance"
    }
  }
}`;

export function MCPConnectorPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-harbor-deep text-paper grain-overlay">
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-gold-light">
            <Cable className="h-3.5 w-3.5" /> For developers & AI agents
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tightish text-balance sm:text-5xl">
            The OpenLoan MCP Connector
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-paper/70">
            Connect AI agents directly to the marketplace through the Model Context Protocol — so
            assistants can search deals, read OpenLoan Scores and analyse portfolios.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "light" }))}
            >
              About MCP <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-6 text-xs text-paper/45">
            Forward-looking preview — the connector is a concept for this hackathon demo.
          </p>
        </div>
      </section>

      {/* What is it */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow text-brand">What is the Model Context Protocol?</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
              A standard way for AI to use tools
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              MCP is an open protocol that lets AI applications connect to external systems through a
              consistent interface. Instead of bespoke integrations, an assistant can discover and
              call well-defined tools.
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              OpenLoan exposes its marketplace as an MCP server — turning live trade-finance data
              into capabilities any compatible agent can use, safely and with permission.
            </p>
          </div>
          <div className="card-surface overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line bg-paper-dim px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-brand/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-jade/60" />
              <span className="ml-2 font-mono text-xs text-ink-muted">claude_desktop_config.json</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-ink-soft">
              <code>{CONFIG}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="border-y border-line bg-paper-grad">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <span className="eyebrow inline-flex items-center gap-2 text-brand">
              <Code2 className="h-4 w-4" /> Connector tools
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
              What agents can do
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <div key={t.name} className="card-surface flex items-start gap-4 p-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
                  <t.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-sm font-semibold text-ink">{t.name}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <span className="eyebrow inline-flex items-center gap-2 text-brand">
            <Bot className="h-4 w-4" /> In practice
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightish">
            Built for an agent-driven future
          </h2>
        </div>
        <ul className="mt-10 space-y-4">
          {USE_CASES.map((u, i) => (
            <li key={u} className="flex items-start gap-4 rounded-2xl border border-line bg-card p-5 shadow-card">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-harbor font-mono text-sm font-semibold text-paper">
                {i + 1}
              </span>
              <p className="text-ink-soft">{u}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
