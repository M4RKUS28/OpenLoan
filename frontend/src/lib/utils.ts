import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LoanStatus, RiskGrade } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatCurrency(amount: number, currency = "HKD", compact = false): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-HK").format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-HK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Human "time left" for an auction deadline. */
export function timeLeft(iso?: string | null): { label: string; urgent: boolean; ended: boolean } {
  if (!iso) return { label: "No deadline", urgent: false, ended: false };
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { label: "Auction ended", urgent: false, ended: true };
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days >= 1) return { label: `${days}d ${hours}h left`, urgent: days <= 2, ended: false };
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return { label: `${hours}h ${mins}m left`, urgent: true, ended: false };
}

export const STATUS_LABELS: Record<LoanStatus, string> = {
  pending_approval: "Pending approval",
  open: "Open auction",
  funded: "Funded",
  repaid: "Repaid",
  closed: "Closed",
  rejected: "Rejected",
};

/** Tailwind classes for a status pill. */
export function statusClasses(status: LoanStatus): string {
  switch (status) {
    case "open":
      return "bg-jade-tint text-jade-600 border-jade/30";
    case "funded":
      return "bg-gold-tint text-gold border-gold/40";
    case "repaid":
      return "bg-harbor/10 text-harbor border-harbor/20";
    case "pending_approval":
      return "bg-paper-deep text-ink-muted border-line-strong";
    case "rejected":
      return "bg-brand-tint text-brand-700 border-brand/30";
    default:
      return "bg-paper-deep text-ink-muted border-line";
  }
}

export const GRADE_META: Record<RiskGrade, { label: string; color: string; chip: string }> = {
  A: { label: "Very low risk", color: "#107A57", chip: "bg-jade-tint text-jade-600 border-jade/30" },
  B: { label: "Low risk", color: "#3F9D5A", chip: "bg-jade-tint text-jade-600 border-jade/30" },
  C: { label: "Moderate risk", color: "#B0822B", chip: "bg-gold-tint text-gold border-gold/40" },
  D: { label: "Elevated risk", color: "#D9772E", chip: "bg-gold-tint text-[#B85C18] border-gold/40" },
  E: { label: "High risk", color: "#C2362A", chip: "bg-brand-tint text-brand-700 border-brand/30" },
};

export function gradeColor(grade?: RiskGrade | null): string {
  if (!grade) return "#736A5B";
  return GRADE_META[grade]?.color ?? "#736A5B";
}

export function tradeTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
