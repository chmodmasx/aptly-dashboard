import { useEffect, useState } from "react"
import { CircleAlert, Globe2, LoaderCircle, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  deletePublicEndpoint,
  listPublicEndpoints,
  parseConnectionError,
  savePublicEndpoint,
  type ConnectionError,
  type PublicEndpoint,
} from "@/lib/aptly"

export function PublicEndpointsPage() {
  const [items, setItems] = useState<PublicEndpoint[]>([])
  const [hostname, setHostname] = useState("")
  const [prefix, setPrefix] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<ConnectionError | null>(null)

  const reload = async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listPublicEndpoints())
    } catch (value) {
      setError(parseConnectionError(value))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const addEndpoint = async () => {
    if (!hostname.trim()) return
    setSaving(true)
    setError(null)
    try {
      await savePublicEndpoint(hostname, prefix, true)
      setHostname("")
      setPrefix("")
      await reload()
    } catch (value) {
      setError(parseConnectionError(value))
    } finally {
      setSaving(false)
    }
  }

  const removeEndpoint = async (item: PublicEndpoint) => {
    setError(null)
    try {
      await deletePublicEndpoint(item.hostname)
      setItems((current) => current.filter((entry) => entry.hostname !== item.hostname))
    } catch (value) {
      setError(parseConnectionError(value))
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Endpoints públicos</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Asociá cada dominio público con el prefix publicado por Aptly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo endpoint</CardTitle>
          <CardDescription>
            Nginx Proxy Manager apuntará estos dominios al mismo repo-server. El Dashboard guarda qué prefix debe entregar cada hostname.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)_auto]">
            <label>
              <span className="mb-1.5 block text-xs font-medium">Hostname</span>
              <input
                className="field-input"
                value={hostname}
                onChange={(event) => setHostname(event.target.value)}
                placeholder="repo.supralinux.com"
                spellCheck={false}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium">Aptly prefix</span>
              <input
                className="field-input"
                value={prefix}
                onChange={(event) => setPrefix(event.target.value)}
                placeholder="supralinux"
                spellCheck={false}
              />
            </label>
            <div className="flex items-end">
              <Button onClick={addEndpoint} disabled={saving || !hostname.trim()} className="w-full lg:w-auto">
                {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Guardar
              </Button>
            </div>
          </div>

          <div className="mt-3 rounded-lg border bg-[hsl(var(--muted))]/35 p-3 text-xs text-[hsl(var(--muted-foreground))]">
            Dejá el prefix vacío para representar la raíz (<code>.</code>). Todavía estamos implementando el repo-server; estos mappings ya quedan persistidos en <code>dashboard-data</code>.
          </div>

          {error && (
            <div className="mt-3 flex gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{error.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Dominios configurados</CardTitle>
              <CardDescription>{items.length} endpoint{items.length === 1 ? "" : "s"} persistente{items.length === 1 ? "" : "s"}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
              {loading && <LoaderCircle className="size-3.5 animate-spin" />}
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && items.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Todavía no hay dominios configurados.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.hostname} className="flex items-center gap-4 border-t px-5 py-4 first:border-t-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border">
                  <Globe2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="ui-selectable truncate font-medium">{item.hostname}</div>
                  <div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                    prefix: <span className="ui-selectable">{item.prefix}</span>
                  </div>
                </div>
                <Badge className={item.enabled ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : ""}>
                  {item.enabled ? "Activo" : "Desactivado"}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => removeEndpoint(item)} aria-label={`Eliminar ${item.hostname}`}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
