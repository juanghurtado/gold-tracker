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
    default: "bg-[hsl(42,55%,53%)] text-[hsl(36,4%,8%)] hover:bg-gold-spotlight dark:bg-[hsl(44,62%,60%)] dark:hover:bg-[hsl(44,62%,50%)]",
    destructive: "bg-[hsl(5,63%,42%)] text-white hover:bg-[hsl(5,63%,37%)] dark:bg-[hsl(0,63%,52%)] dark:hover:bg-[hsl(0,63%,47%)]",
    outline: "border-2 border-border bg-background hover:bg-gold-surface text-foreground dark:border-border dark:hover:bg-gold-surface dark:text-foreground",
    ghost: "hover:bg-gold-surface text-foreground dark:hover:bg-gold-surface dark:text-foreground",
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
