import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Briefcase, ChevronDown, LayoutDashboard, LogOut, Menu, TrendingUp, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccountMode } from "@/context/AccountMode";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/cdi", label: "Scoring & CDI" },
  { to: "/about", label: "About" },
];

function ModeSwitch({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useAccountMode();
  const options: { key: "lender" | "business"; label: string; icon: typeof TrendingUp }[] = [
    { key: "lender", label: "Invest", icon: TrendingUp },
    { key: "business", label: "Borrow", icon: Briefcase },
  ];
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-line-strong bg-paper-dim p-0.5",
        compact && "w-full",
      )}
      role="tablist"
      aria-label="Account mode"
    >
      {options.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          role="tab"
          aria-selected={mode === key}
          onClick={() => setMode(key)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
            compact && "flex-1",
            mode === key
              ? "bg-ink text-paper shadow-card"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { isBusiness } = useAccountMode();
  const [open, setOpen] = useState(false);
  const initials = (user?.username || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line-strong bg-card py-1 pl-1 pr-2.5 transition-colors hover:border-ink"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-harbor text-[0.7rem] font-semibold text-paper">
          {initials}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-ink-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-60 animate-scale-in rounded-xl border border-line bg-card p-1.5 shadow-lift">
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-ink">{user?.username || "Account"}</p>
              <p className="truncate text-xs text-ink-muted">{user?.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <MenuLink to="/dashboard" icon={LayoutDashboard} onClick={() => setOpen(false)}>
              Dashboard
            </MenuLink>
            {isBusiness ? (
              <MenuLink to="/deals/new" icon={Briefcase} onClick={() => setOpen(false)}>
                Post a deal
              </MenuLink>
            ) : (
              <MenuLink to="/marketplace" icon={TrendingUp} onClick={() => setOpen(false)}>
                Browse deals
              </MenuLink>
            )}
            <div className="my-1 h-px bg-line" />
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-paper-deep"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  to,
  icon: Icon,
  onClick,
  children,
}: {
  to: string;
  icon: typeof TrendingUp;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
    >
      <Icon className="h-4 w-4" /> {children}
    </Link>
  );
}

export function AppHeader() {
  const { ready, authenticated, login, register } = useAuth();
  const [mobile, setMobile] = useState(false);
  const signedIn = ready && authenticated;

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive ? "text-brand" : "text-ink-soft hover:text-ink",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ModeSwitch />
          </div>
          {signedIn ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                onClick={() => login(window.location.origin + "/marketplace")}
                className="px-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Sign in
              </button>
              <Button size="sm" onClick={() => register(window.location.origin + "/marketplace")}>
                Get started
              </Button>
            </div>
          )}
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-line-strong lg:hidden"
            onClick={() => setMobile((v) => !v)}
            aria-label="Menu"
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobile && (
        <div className="border-t border-line bg-paper px-4 py-4 lg:hidden">
          <div className="mb-3 sm:hidden">
            <ModeSwitch compact />
          </div>
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobile(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive ? "bg-brand-tint text-brand-700" : "text-ink-soft hover:bg-paper-deep",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {!signedIn && (
            <div className="mt-3 flex flex-col gap-2 sm:hidden">
              <Button variant="outline" onClick={() => login(window.location.origin + "/marketplace")}>
                Sign in
              </Button>
              <Button onClick={() => register(window.location.origin + "/marketplace")}>
                Get started
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
