import { Logo } from "@/components/ui/Logo";

export function AuthRedirectScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-harbor-deep text-paper grain-overlay">
      <div className="relative">
        <Logo tone="paper" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-paper/30 border-t-gold" />
        <span className="text-sm text-paper/70">{label}</span>
      </div>
    </div>
  );
}
