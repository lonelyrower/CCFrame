import * as React from "react"
import { Slot } from "@/lib/radix"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-sans text-sm font-medium transition-all duration-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 button-press touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-subtle hover:bg-primary/90 hover:shadow-surface active:shadow-subtle",
        destructive:
          "bg-destructive text-destructive-foreground shadow-subtle hover:bg-destructive/90",
        outline:
          "border border-surface-outline/60 bg-surface-panel text-text-primary shadow-subtle hover:bg-surface-panel/80",
        secondary:
          "bg-surface-glass text-text-primary shadow-subtle hover:shadow-surface",
        ghost: "text-text-primary hover:bg-surface-glass/60",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-surface-glass text-text-primary border border-contrast-outline/10 shadow-floating backdrop-blur-lg hover:bg-surface-glass/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      weight: {
        regular: "",
        bold: "font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      weight: "regular",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, weight, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, weight, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
