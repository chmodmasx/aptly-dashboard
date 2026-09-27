import { Bug, Moon, Search, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import type { Section } from "@/components/app-sidebar"

export function SiteHeader({ section, debugOpen, setDebugOpen }: { section: Section; debugOpen: boolean; setDebugOpen: (v: boolean) => void }) {
  const { theme, setTheme } = useTheme()
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <BoxGlyph />
        <div className="h-4 w-px bg-[hsl(var(--border))]" />
        <div className="truncate text-sm font-medium">{section}</div>
      </div>

      <div className="hidden h-8 w-[240px] items-center gap-2 rounded-md border bg-[hsl(var(--background))] px-2.5 text-sm text-[hsl(var(--muted-foreground))] lg:flex">
        <Search className="size-3.5" />
        <span className="flex-1">Buscar…</span>
        <kbd className="rounded border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </div>
      <Button variant="outline" size="icon" title="Debug panel" onClick={() => setDebugOpen(!debugOpen)}><Bug className="size-4" /></Button>
      <Button variant="outline" size="icon" title="Cambiar tema" onClick={() => setTheme(dark ? "light" : "dark")}>{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
    </header>
  )
}

function BoxGlyph() {
  return <div className="grid size-5 grid-cols-2 gap-[2px] p-[3px] opacity-70">{Array.from({length:4}).map((_,i)=><span key={i} className="rounded-[1px] border" />)}</div>
}
