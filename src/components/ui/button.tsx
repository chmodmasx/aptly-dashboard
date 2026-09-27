import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
  size?: "default" | "sm" | "icon"
  children?: ReactNode
}

export function Button({ className, variant = "default", size = "default", ...props }: Props) {
  const variants = {
    default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90",
    outline: "border bg-[hsl(var(--background))] hover:bg-[hsl(var(--accent))]",
    ghost: "hover:bg-[hsl(var(--accent))]",
    secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:opacity-90",
    destructive: "bg-[hsl(var(--destructive))] text-white hover:opacity-90",
  }
  const sizes = { default: "h-9 px-4 py-2", sm: "h-8 rounded-md px-3 text-xs", icon: "size-9" }
  return <button className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} {...props} />
}
