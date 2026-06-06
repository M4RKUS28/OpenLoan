import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { LoanDetail } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { usePlaceBid } from "@/hooks/useLoans";
import { formatCurrency, formatPercent } from "@/lib/utils";

export function BidDialog({
  loan,
  open,
  onClose,
}: {
  loan: LoanDetail;
  open: boolean;
  onClose: () => void;
}) {
  const place = usePlaceBid(loan.id);
  const suggested = Math.max(1, (loan.best_rate ?? loan.interest_rate) - 0.1);
  const [amount, setAmount] = useState<number>(loan.amount);
  const [rate, setRate] = useState<number>(Number(suggested.toFixed(2)));
  const [message, setMessage] = useState("");

  const expectedReturn = (amount * rate * loan.term_days) / 100 / 365;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await place.mutateAsync({ amount, interest_rate: rate, message: message || undefined });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Place a financing offer"
      subtitle={`${loan.title} · ${loan.company.name}`}
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Amount to fund">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
              {loan.currency}
            </span>
            <input
              type="number"
              min={1}
              max={loan.amount}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-12 w-full rounded-xl border border-line bg-paper-dim pl-14 pr-4 font-mono text-ink nums focus:border-brand focus:outline-none"
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            Requested: {formatCurrency(loan.amount, loan.currency)}
          </p>
        </Field>

        <Field label={`Your annual rate · ${formatPercent(rate)}`}>
          <input
            type="range"
            min={1}
            max={25}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-brand"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-muted">
            <span>1%</span>
            <span>Current best: {formatPercent(loan.best_rate ?? loan.interest_rate)}</span>
            <span>25%</span>
          </div>
        </Field>

        <Field label="Message to the business (optional)">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Terms, conditions or a note…"
            className="w-full rounded-xl border border-line bg-paper-dim px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
          />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-jade/30 bg-jade-tint px-4 py-3">
          <span className="text-sm text-ink-soft">Projected interest ({loan.term_days}d)</span>
          <span className="font-mono text-sm font-semibold text-jade-600 nums">
            {formatCurrency(expectedReturn, loan.currency)}
          </span>
        </div>

        {place.isError && (
          <p className="rounded-lg bg-brand-tint px-3 py-2 text-sm text-brand-700">
            Could not place your offer. Please try again.
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={place.isPending}>
            {place.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit offer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
