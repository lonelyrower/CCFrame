import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-xs font-semibold transition-colors duration-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary",
        brand:
          "border-transparent bg-primary text-primary-foreground",
        subtle:
          "border-surface-outline/40 bg-surface-glass text-text-secondary",
        destructive:
          "border-transparent bg-destructive text-primary-foreground",
        outline: "border-surface-outline/60 text-text-primary",
      },
      emphasis: {
        solid: "",
        soft: "bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
      emphasis: "solid",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, emphasis, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, emphasis }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
