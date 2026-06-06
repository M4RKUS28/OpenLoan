import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse deals", to: "/marketplace" },
      { label: "Post a deal", to: "/deals/new" },
      { label: "Investor dashboard", to: "/dashboard" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Scoring & CDI", to: "/cdi" },
      { label: "About OpenLoan", to: "/about" },
      { label: "MCP Connector", to: "/mcp" },
    ],
  },
];

const EXTERNAL = [
  { label: "HKMA CDI — About", href: "https://cdi.hkma.gov.hk/about-cdi/" },
  { label: "Commercial Data Interchange", href: "https://cdi.hkma.gov.hk/" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-harbor-deep text-paper grain-overlay">
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="max-w-xs">
            <Logo tone="paper" />
            <p className="mt-5 text-sm leading-relaxed text-paper/65">
              An open marketplace for trade finance — connecting Hong Kong's businesses with
              capital, deal by deal.
            </p>
            <p className="mt-5 text-[0.7rem] font-semibold uppercase tracking-widest2 text-gold-light">
              Greater Bay Area · Hong Kong SAR
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[0.7rem] font-semibold uppercase tracking-widest2 text-paper/45">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-paper/75 transition-colors hover:text-paper"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-[0.7rem] font-semibold uppercase tracking-widest2 text-paper/45">
              Infrastructure
            </h4>
            <ul className="mt-4 space-y-3">
              {EXTERNAL.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-paper/75 transition-colors hover:text-paper"
                  >
                    {l.label}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-paper/10 pt-6 text-xs text-paper/45 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} OpenLoan. Built for the Hong Kong FinTech Hackathon.</p>
          <p className="max-w-md sm:text-right">
            Demo environment — not a regulated financial product. Figures and the OpenLoan Score
            are illustrative.
          </p>
        </div>
      </div>
    </footer>
  );
}
