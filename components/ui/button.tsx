import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // 기본: pill 형태, Apple SF Pro 느낌, focus-visible ring
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-[14px] font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        // Primary: Action Blue pill
        default:
          "bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:brightness-95",
        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        // Outline: thin border, blue text on hover
        outline:
          "border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        // Secondary: pearl capsule
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent",
        // Ghost: no background
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        // Link: plain text
        link:
          "text-primary underline-offset-4 hover:underline",
        // Blue outline (필터 퀵버튼용)
        "outline-blue":
          "border border-primary/30 bg-card text-primary hover:bg-primary hover:text-primary-foreground",
      },
      size: {
        default: "h-9 px-5 py-2",
        sm:      "h-7 px-3 text-[13px]",
        lg:      "h-11 px-7 text-[15px]",
        icon:    "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
