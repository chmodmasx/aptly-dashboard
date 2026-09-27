import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Bug, ChevronDown, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DebugPanel({ onClose }: { onClose: () => void }) {
  const [runtime, setRuntime] = useState(0)
  const [tab, setTab] = useState<"overview" | "runtime">("overview")
  useEffect(() => {
    const id = window.setInterval(() => setRuntime((v) => v + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const values = useMemo(() => [
    ["Route", "/"],
    ["URL", window.location.href],
    ["Search", window.location.search || "(none)"],
    ["Hash", window.location.hash || "(none)"],
    ["Theme", document.documentElement.classList.contains("dark") ? "dark" : "light"],
    ["Viewport", `${window.innerWidth} × ${window.innerHeight}`],
    ["Runtime", `${runtime}s`],
  ], [runtime])

  return (
    <aside className="debug-pane flex h-full flex-col">
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <Bug className="size-4" />
        <span className="flex-1 text-sm font-semibold">Development Debug Panel</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="size-8"><X className="size-4" /></Button>
      </div>
      <div className="grid grid-cols-2 border-b text-xs">
        <button onClick={() => setTab("overview")} className={`h-10 border-r ${tab === "overview" ? "bg-[hsl(var(--muted))] font-medium" : ""}`}>Overview</button>
        <button onClick={() => setTab("runtime")} className={`h-10 ${tab === "runtime" ? "bg-[hsl(var(--muted))] font-medium" : ""}`}>Runtime <span className="ml-2 text-[10px] opacity-60">{runtime}</span></button>
      </div>
      {tab === "overview" ? (
        <div className="overflow-y-auto p-4">
          <Section title="App">
            <div className="mb-4 text-xs text-[hsl(var(--muted-foreground))]">Static application metadata from Tauri v2.</div>
            {values.map(([k,v]) => <DebugRow key={k} k={k} v={v} />)}
          </Section>
          <Section title="Host">
            <DebugRow k="Platform" v={navigator.platform || "browser"} />
            <DebugRow k="Language" v={navigator.language} />
            <DebugRow k="Online" v={navigator.onLine ? "yes" : "no"} />
          </Section>
        </div>
      ) : (
        <div className="overflow-y-auto p-4 text-xs">
          <Section title="Events">
            <div className="rounded-md border p-3 text-[hsl(var(--muted-foreground))]">No tracked invokes yet. Aptly integration is intentionally mocked in this visual prototype.</div>
          </Section>
          <Section title="Desktop shell">
            <DebugRow k="Tauri" v={("__TAURI_INTERNALS__" in window) ? "attached" : "browser preview"} />
            <DebugRow k="Debug shortcut" v="Ctrl/Cmd + D" />
          </Section>
        </div>
      )}
    </aside>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mb-6"><div className="mb-2 flex items-center gap-1 text-xs font-semibold"><ChevronDown className="size-3.5" />{title}</div><div className="overflow-hidden rounded-md border">{children}</div></section>
}
function DebugRow({ k, v }: { k: string; v: string }) {
  return <div className="group grid grid-cols-[90px_minmax(0,1fr)_24px] items-center border-b px-2 py-2 text-[11px] last:border-b-0"><span className="text-[hsl(var(--muted-foreground))]">{k}</span><code className="ui-selectable truncate font-mono">{v}</code><button onClick={() => navigator.clipboard?.writeText(v)} className="opacity-0 group-hover:opacity-60"><Copy className="size-3" /></button></div>
}
