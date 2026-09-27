import {
  Archive,
  Box,
  Boxes,
  ChevronsUpDown,
  CircleGauge,
  Database,
  FileClock,
  HardDrive,
  ListChecks,
  Package,
  Plus,
  RadioTower,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type Section = "Dashboard" | "Repositorios" | "Paquetes" | "Snapshots" | "Publicaciones" | "Mirrors" | "Tareas" | "Almacenamiento" | "Configuración"

const items: Array<{ name: Section; icon: typeof CircleGauge }> = [
  { name: "Dashboard", icon: CircleGauge },
  { name: "Repositorios", icon: Database },
  { name: "Paquetes", icon: Package },
  { name: "Snapshots", icon: FileClock },
  { name: "Publicaciones", icon: RadioTower },
  { name: "Mirrors", icon: Archive },
  { name: "Tareas", icon: ListChecks },
  { name: "Almacenamiento", icon: HardDrive },
  { name: "Configuración", icon: Settings },
]

export function AppSidebar({ section, setSection, onQuickCreate }: { section: Section; setSection: (s: Section) => void; onQuickCreate: () => void }) {
  return (
    <aside className="sidebar">
      <div className="p-2">
        <button className="flex h-12 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-[hsl(var(--sidebar-accent))]">
          <div className="flex size-8 items-center justify-center rounded-md bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">
            <Boxes className="size-4" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold">SupraLINUX</div>
            <div className="truncate text-xs text-[hsl(var(--muted-foreground))]">Aptly Repository Manager</div>
          </div>
          <ChevronsUpDown className="size-4 opacity-60" />
        </button>
      </div>

      <div className="px-2 pb-2">
        <Button onClick={onQuickCreate} className="w-full justify-start" size="default">
          <Plus className="size-4" /> Creación rápida
          <span className="ml-auto text-[10px] opacity-65">⌘N</span>
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
        {items.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setSection(name)}
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
              section === name
                ? "bg-[hsl(var(--sidebar-accent))] font-medium text-[hsl(var(--sidebar-accent-foreground))]"
                : "hover:bg-[hsl(var(--sidebar-accent))]"
            )}
          >
            <Icon className="size-4" />
            <span>{name}</span>
            {name === "Tareas" && <span className="ml-auto rounded-md border px-1.5 text-[10px] text-[hsl(var(--muted-foreground))]">3</span>}
          </button>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <span className="size-2 rounded-full bg-emerald-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium">Aptly conectado</div>
            <div className="truncate text-[11px] text-[hsl(var(--muted-foreground))]">repo.supralinux.com</div>
          </div>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">v1.6</span>
        </div>
      </div>
    </aside>
  )
}
