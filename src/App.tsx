import { useEffect, useMemo, useState, type ReactNode } from "react"
import { AppSidebar, type Section } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SectionCards } from "@/components/section-cards"
import { ActivityChart } from "@/components/activity-chart"
import { RepositoriesTable } from "@/components/repositories-table"
import { TaskCard } from "@/components/task-card"
import { DebugPanel } from "@/components/debug-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Archive, Database, FileClock, HardDrive, Package, Plus, RadioTower, Settings, X } from "lucide-react"
import { repositories } from "@/data/mock"

export default function App() {
  const [section, setSection] = useState<Section>("Dashboard")
  const [debugOpen, setDebugOpen] = useState(() => localStorage.getItem("supralinux-debug") !== "closed")
  const [quickCreate, setQuickCreate] = useState(false)

  useEffect(() => {
    localStorage.setItem("supralinux-debug", debugOpen ? "open" : "closed")
  }, [debugOpen])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault()
        setDebugOpen((v) => !v)
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
        event.preventDefault()
        setQuickCreate(true)
      }
      if (event.key === "Escape") setQuickCreate(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className={`app-shell ${debugOpen ? "debug-open" : ""}`}>
      <AppSidebar section={section} setSection={setSection} onQuickCreate={() => setQuickCreate(true)} />
      <main className="main-pane">
        <SiteHeader section={section} debugOpen={debugOpen} setDebugOpen={setDebugOpen} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MainContent section={section} />
        </div>
      </main>
      {debugOpen && <DebugPanel onClose={() => setDebugOpen(false)} />}
      {quickCreate && <QuickCreate onClose={() => setQuickCreate(false)} />}
    </div>
  )
}

function MainContent({ section }: { section: Section }) {
  if (section === "Dashboard") {
    return (
      <div className="flex flex-col gap-5 py-5 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Estado general de tus repositorios Aptly.</p>
        </div>
        <SectionCards />
        <div className="grid gap-5 px-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)] lg:px-6">
          <ActivityChart />
          <TaskCard />
        </div>
        <div className="px-4 lg:px-6"><RepositoriesTable /></div>
      </div>
    )
  }

  if (section === "Repositorios") {
    return (
      <Page title="Repositorios" subtitle="Crea, inspecciona y administra repositorios locales de Aptly." action="Nuevo repositorio">
        <RepositoriesTable />
      </Page>
    )
  }

  if (section === "Paquetes") {
    return (
      <Page title="Paquetes" subtitle="Explora paquetes, versiones y arquitecturas disponibles." action="Añadir paquete">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {repositories.slice(0,3).map((repo) => <PackageCard key={repo.name} repo={repo.name} count={repo.packages} />)}
        </div>
      </Page>
    )
  }

  if (section === "Snapshots") {
    return (
      <Page title="Snapshots" subtitle="Estados inmutables listos para comparar, validar o publicar." action="Crear snapshot">
        <SnapshotList />
      </Page>
    )
  }

  if (section === "Publicaciones") {
    return (
      <Page title="Publicaciones" subtitle="Gestiona canales publicados sin saltarte la aprobación manual de Stable." action="Nueva publicación">
        <PublicationPanel />
      </Page>
    )
  }

  if (section === "Mirrors") {
    return (
      <Page title="Mirrors" subtitle="Sincronización de fuentes externas consumidas por SupraLINUX." action="Nuevo mirror">
        <SimpleCards icon={Archive} labels={["Ubuntu 26.04 · main", "Ubuntu 26.04 · universe", "KDE upstream staging"]} />
      </Page>
    )
  }

  if (section === "Tareas") {
    return <Page title="Tareas" subtitle="Operaciones asíncronas y su estado actual."><TaskCard /></Page>
  }

  if (section === "Almacenamiento") {
    return (
      <Page title="Almacenamiento" subtitle="Uso estimado del pool de paquetes, snapshots y otros objetos.">
        <StoragePanel />
      </Page>
    )
  }

  return (
    <Page title="Configuración" subtitle="Conexión, comportamiento de la interfaz y reglas de publicación.">
      <Card>
        <CardHeader><CardTitle className="text-base">Aptly API</CardTitle><CardDescription>La conexión real todavía está desactivada en este prototipo visual.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <SettingRow label="Endpoint" value="http://aptly:8080" />
          <SettingRow label="Stable promotion" value="Confirmación manual requerida" />
          <SettingRow label="Modo" value="Datos simulados" />
        </CardContent>
      </Card>
    </Page>
  )
}

function Page({ title, subtitle, action, children }: { title: string; subtitle: string; action?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p></div>
        {action && <Button><Plus className="size-4" />{action}</Button>}
      </div>
      {children}
    </div>
  )
}

function PackageCard({ repo, count }: { repo: string; count: number }) {
  return <Card><CardHeader><div className="flex items-center justify-between"><div className="flex size-9 items-center justify-center rounded-md border"><Package className="size-4" /></div><Badge>{count} paquetes</Badge></div><CardTitle className="pt-4 text-base">{repo}</CardTitle><CardDescription>amd64 · arm64</CardDescription></CardHeader><CardContent><Button variant="outline" className="w-full">Explorar paquetes</Button></CardContent></Card>
}

function SnapshotList() {
  const rows = ["supra-testing-2026.09.26.03", "supra-testing-2026.09.25.02", "supra-testing-2026.09.24.01", "supra-stable-2026.09.20.01"]
  return <Card className="overflow-hidden">{rows.map((r,i)=><div key={r} className="flex items-center gap-4 border-b px-5 py-4 last:border-0"><div className="flex size-9 items-center justify-center rounded-md border"><FileClock className="size-4" /></div><div className="min-w-0 flex-1"><div className="font-medium">{r}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{284-i*9} paquetes · creado hace {i ? `${i} día${i>1?"s":""}` : "14 min"}</div></div><Button size="sm" variant="outline">Comparar</Button></div>)}</Card>
}

function PublicationPanel() {
  return <div className="grid gap-4 xl:grid-cols-2"><Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">Testing</CardTitle><Badge>Publicado</Badge></div><CardDescription>Snapshot supra-testing-2026.09.26.03</CardDescription></CardHeader><CardContent><div className="mb-4 rounded-lg border p-4 text-sm"><div className="font-medium">PASS</div><div className="mt-1 text-[hsl(var(--muted-foreground))]">La validación permite continuar hacia testing.</div></div><Button variant="outline">Actualizar publicación</Button></CardContent></Card><Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">Stable</CardTitle><Badge>Protegido</Badge></div><CardDescription>Snapshot supra-stable-2026.09.20.01</CardDescription></CardHeader><CardContent><div className="mb-4 rounded-lg border p-4 text-sm"><div className="font-medium">Aprobación manual requerida</div><div className="mt-1 text-[hsl(var(--muted-foreground))]">PASS no publica automáticamente en Stable.</div></div><Button>Promover a Stable</Button></CardContent></Card></div>
}

function StoragePanel() {
  return <div className="grid gap-4 md:grid-cols-3"><Metric label="Package pool" value="52.3 GB" icon={Package}/><Metric label="Snapshots" value="13.7 GB" icon={FileClock}/><Metric label="Otros" value="5.0 GB" icon={HardDrive}/></div>
}

function Metric({label,value,icon:Icon}:{label:string;value:string;icon:typeof Database}) { return <Card><CardHeader><div className="flex items-center justify-between"><span className="text-sm text-[hsl(var(--muted-foreground))]">{label}</span><Icon className="size-4" /></div></CardHeader><CardContent><div className="text-3xl font-semibold">{value}</div></CardContent></Card> }
function SettingRow({label,value}:{label:string;value:string}) { return <div className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"><span className="text-[hsl(var(--muted-foreground))]">{label}</span><span className="font-medium">{value}</span></div> }
function SimpleCards({icon:Icon,labels}:{icon:typeof Archive;labels:string[]}) { return <div className="grid gap-4 md:grid-cols-3">{labels.map(x=><Card key={x}><CardHeader><Icon className="size-5"/><CardTitle className="pt-3 text-base">{x}</CardTitle><CardDescription>Última sincronización correcta.</CardDescription></CardHeader><CardContent><Button variant="outline" className="w-full">Abrir</Button></CardContent></Card>)}</div> }

function QuickCreate({ onClose }: { onClose: () => void }) {
  const actions = useMemo(() => [
    ["Repositorio", "Crear un repositorio local", Database],
    ["Snapshot", "Congelar el estado actual", FileClock],
    ["Publicación", "Publicar un snapshot", RadioTower],
    ["Mirror", "Agregar una fuente externa", Archive],
  ] as const, [])
  return (
    <div onMouseDown={onClose} className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-6 pt-[12vh] backdrop-blur-[1px]">
      <div onMouseDown={(e)=>e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-xl border bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] shadow-2xl">
        <div className="flex items-center border-b px-5 py-4"><div className="flex-1"><div className="font-semibold">Creación rápida</div><div className="text-xs text-[hsl(var(--muted-foreground))]">Elegí qué querés crear.</div></div><Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button></div>
        <div className="grid gap-2 p-3">{actions.map(([title,desc,Icon])=><button key={title} onClick={onClose} className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-[hsl(var(--accent))]"><div className="flex size-9 items-center justify-center rounded-md border"><Icon className="size-4" /></div><div><div className="text-sm font-medium">{title}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{desc}</div></div></button>)}</div>
      </div>
    </div>
  )
}
