import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AccountMode = "business" | "lender";

interface AccountModeValue {
  mode: AccountMode;
  setMode: (m: AccountMode) => void;
  toggle: () => void;
  isBusiness: boolean;
  isLender: boolean;
}

const STORAGE_KEY = "openloan.mode";

const AccountModeContext = createContext<AccountModeValue | null>(null);

export function AccountModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AccountMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "business" || saved === "lender" ? saved : "lender";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo<AccountModeValue>(
    () => ({
      mode,
      setMode: setModeState,
      toggle: () => setModeState((m) => (m === "lender" ? "business" : "lender")),
      isBusiness: mode === "business",
      isLender: mode === "lender",
    }),
    [mode],
  );

  return <AccountModeContext.Provider value={value}>{children}</AccountModeContext.Provider>;
}

export function useAccountMode(): AccountModeValue {
  const ctx = useContext(AccountModeContext);
  if (!ctx) throw new Error("useAccountMode must be used within AccountModeProvider");
  return ctx;
}
