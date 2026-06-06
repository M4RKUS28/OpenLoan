import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold " +
    "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper " +
    "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "bg-brand text-paper hover:bg-brand-600 shadow-card hover:shadow-lift",
        gold: "bg-gold text-paper hover:bg-gold-soft shadow-card",
        harbor: "bg-harbor text-paper hover:bg-harbor-800 shadow-card",
        outline: "border border-line-strong bg-transparent text-ink hover:border-ink hover:bg-paper-deep",
        ghost: "bg-transparent text-ink hover:bg-paper-deep",
        subtle: "bg-paper-deep text-ink hover:bg-line",
        light: "bg-paper text-ink hover:bg-paper-dim shadow-card",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
