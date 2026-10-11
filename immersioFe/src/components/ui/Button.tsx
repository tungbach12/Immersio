import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all motion-reduce:transition-none motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-dark shadow-sm",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30",
        outline:
          "border border-input bg-surface text-card-foreground hover:bg-surface-hover",
        secondary:
          "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30",
        accent:
          "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30",
        ghost: "hover:bg-surface-hover hover:text-card-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 shadow-lg",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-xl px-3",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild)
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
