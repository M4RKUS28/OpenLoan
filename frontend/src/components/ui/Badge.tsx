import type { LoanStatus, RiskGrade } from "@/lib/api";
import { cn, GRADE_META, STATUS_LABELS, statusClasses } from "@/lib/utils";

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <Pill className={statusClasses(status)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </Pill>
  );
}

export function GradeBadge({
  grade,
  size = "md",
}: {
  grade?: RiskGrade | null;
  size?: "sm" | "md" | "lg";
}) {
  if (!grade) return null;
  const meta = GRADE_META[grade];
  const dims =
    size === "lg"
      ? "h-12 w-12 text-2xl"
      : size === "sm"
      ? "h-7 w-7 text-sm"
      : "h-9 w-9 text-lg";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-display font-semibold text-paper",
        dims,
      )}
      style={{ backgroundColor: meta.color }}
      title={`OpenLoan grade ${grade} — ${meta.label}`}
    >
      {grade}
    </span>
  );
}
