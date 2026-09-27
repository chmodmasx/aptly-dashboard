import { useEffect, useState } from "react"
import {
  CheckCircle2,
  CircleX,
  Globe2,
  LoaderCircle,
  PlugZap,
  ServerCog,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getDashboardConfig,
  parseConnectionError,
  testAptlyConnection,
  type ConnectionError,
  type ConnectionTestResult,
  type DashboardConfig,
} from "@/lib/aptly"

export function SettingsPage({
  connection,
  onConnected,
}: {
  connection: ConnectionTestResult | null
  onConnected: (result: ConnectionTestResult | null) => void
}) {
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<ConnectionError | null>(null)
  const [result, setResult] = useState<ConnectionTestResult | null>(connection)

  useEffect(() => {
    getDashboardConfig()
      .then(setConfig)
      .catch((value) => setError(parseConnectionError(value)))
  }, [])

  useEffect(() => {
    setResult(connection)
  }, [connection])

  const testConnection = async () => {
    setTesting(true)
    setError(null)
    try {
      const next = await testAptlyConnection()
      setResult(next)
      onConnected(next)
    } catch (value) {
      const parsed = parseConnectionError(value)
      setError(parsed)
      setResult(null)
      onConnected(null)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Estado del Dashboard y del Aptly conectado dentro del stack.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.72fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ServerCog className="size-4" /> Servidor Aptly
            </CardTitle>
            <CardDescription>
              La conexión se configura del lado del backend. El navegador nunca recibe credenciales de Aptly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="Perfil" value={config?.profileName || "Cargando…"} />
            <SettingRow label="API interna" value={config?.aptlyBaseUrl || "Cargando…"} />
            <SettingRow label="Aptly esperado" value={config?.expectedAptlyVersion || "—"} />
            <SettingRow label="Autenticación backend" value={config?.authMode || "—"} />
            <SettingRow
              label="Repositorio público"
              value={config?.publicRepositoryUrl || "Se define por publicación/endpoint"}
            />

            <div className="rounded-lg border bg-[hsl(var(--muted))]/35 p-3 text-xs text-[hsl(var(--muted-foreground))]">
              En el despliegue Docker normal, la API de Aptly permanece en la red privada del stack. Nginx Proxy Manager publica el Dashboard y los dominios de repositorios, no la API administrativa de Aptly.
            </div>

            <Button onClick={testConnection} disabled={testing}>
              {testing ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
              {testing ? "Comprobando…" : "Comprobar Aptly ahora"}
            </Button>

            {error && <ConnectionErrorCard error={error} />}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <ConnectionStatus result={result} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Política de publicación</CardTitle>
              <CardDescription>Regla local del Dashboard para evitar promociones involuntarias.</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow label="PASS" value="Publica sólo en Testing" />
              <SettingRow label="Stable" value="Confirmación manual requerida" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despliegue</CardTitle>
              <CardDescription>Las actualizaciones se realizan desde Docker o Portainer.</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow label="Dashboard" value={config ? `v${config.dashboardVersion}` : "—"} />
              <SettingRow label="Auto-update" value="No" />
              <SettingRow label="Actualización" value="Nueva imagen del stack" />
              <SettingRow label="Datos" value="Volúmenes persistentes" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ConnectionStatus({ result }: { result: ConnectionTestResult | null }) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe2 className="size-4" /> Estado de conexión
          </CardTitle>
          <CardDescription>Aptly todavía no respondió correctamente.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const compatibilityLabel = {
    supported: "Soportada",
    unverified: "Sin verificar",
    unsupported: "No soportada",
  }[result.compatibility]

  const capabilities = Object.entries(result.capabilities)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" /> Estado de conexión
            </CardTitle>
            <CardDescription>{result.normalizedUrl}</CardDescription>
          </div>
          <Badge className={result.compatibility === "supported" ? "border-emerald-500/35 text-emerald-600 dark:text-emerald-400" : "border-amber-500/35 text-amber-600 dark:text-amber-400"}>
            {compatibilityLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <StatusCell label="Aptly" value={result.version} />
          <StatusCell label="Latencia" value={`${result.latencyMs} ms`} />
          <StatusCell label="Healthy" value={result.healthy ? "Sí" : "No"} good={result.healthy} />
          <StatusCell label="Ready" value={result.ready ? "Sí" : "No"} good={result.ready} />
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Capacidades</div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {capabilities.map(([name, available]) => (
              <div key={name} className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs">
                {available ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <CircleX className="size-3.5 text-rose-500" />}
                <span>{capabilityLabel(name)}</span>
              </div>
            ))}
          </div>
        </div>

        {result.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
            {result.warnings.map((warning) => <div key={warning}>• {warning}</div>)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConnectionErrorCard({ error }: { error: ConnectionError }) {
  const [details, setDetails] = useState(false)
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300">
      <div className="flex items-start gap-2">
        <CircleX className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-medium">{error.message}</div>
          <div className="mt-1 text-xs opacity-80">
            {error.operation}{error.httpStatus ? ` · HTTP ${error.httpStatus}` : ""}
          </div>
          {error.technicalDetails && (
            <>
              <button onClick={() => setDetails((value) => !value)} className="mt-2 text-xs underline underline-offset-2">
                {details ? "Ocultar detalles" : "Ver detalles técnicos"}
              </button>
              {details && <pre className="ui-selectable mt-2 overflow-x-auto whitespace-pre-wrap rounded-md border p-2 text-[11px]">{error.technicalDetails}</pre>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusCell({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-[11px] text-[hsl(var(--muted-foreground))]">{label}</div>
      <div className={`mt-0.5 font-medium ${good === false ? "text-rose-600 dark:text-rose-400" : ""}`}>{value}</div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 text-sm last:border-0">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="ui-selectable break-all text-right font-medium">{value}</span>
    </div>
  )
}

function capabilityLabel(value: string) {
  return {
    repositories: "Repositorios",
    mirrors: "Mirrors",
    snapshots: "Snapshots",
    publications: "Publicaciones",
    tasks: "Tareas",
    storage: "Almacenamiento",
    gpgKeys: "Claves GPG",
  }[value] || value
}
