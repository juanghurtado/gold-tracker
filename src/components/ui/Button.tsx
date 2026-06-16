import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive" | "outline" | "ghost"
    size?: "default" | "sm" | "lg"
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const base = "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 gap-2"
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-gold-spotlight",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-border bg-background hover:bg-gold-surface text-foreground",
    ghost: "hover:bg-gold-surface text-foreground",
  }
  const sizes = {
    default: "h-[40px] rounded-[var(--radius-sm)] px-5 text-sm",
    sm: "h-[40px] rounded-[var(--radius-sm)] px-4 text-sm",
    lg: "h-[44px] rounded-[var(--radius-sm)] px-8 text-base",
  }

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
