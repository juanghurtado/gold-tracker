import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-[40px] w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[hsl(36,2%,45%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(42,55%,53%)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-[hsl(36,2%,58%)]",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }