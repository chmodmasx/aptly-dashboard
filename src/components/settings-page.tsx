import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  Globe2,
  LoaderCircle,
  PlugZap,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  isTauriRuntime,
  parseConnectionError,
  testAptlyConnection,
  type AuthMode,
  type ConnectionError,
  type ConnectionProfile,
  type ConnectionTestResult,
} from "@/lib/aptly"

const PROFILE_KEY = "aptly-dashboard-profile"

const emptyProfile: ConnectionProfile = {
  name: "Mi servidor Aptly",
  baseUrl: "",
  publicRepositoryUrl: "",
  auth: {
    mode: "none",
    username: "",
    password: "",
    token: "",
    headerName: "",
    headerValue: "",
  },
}

function loadProfile(): ConnectionProfile {
  try {
    const stored = localStorage.getItem(PROFILE_KEY)
    if (!stored) return emptyProfile
    const parsed = JSON.parse(stored) as Partial<ConnectionProfile>
    return {
      ...emptyProfile,
      ...parsed,
      auth: {
        ...emptyProfile.auth,
        ...(parsed.auth || {}),
        password: "",
        token: "",
        headerValue: "",
      },
    }
  } catch {
    return emptyProfile
  }
}

export function SettingsPage({
  connection,
  onConnected,
}: {
  connection: ConnectionTestResult | null
  onConnected: (result: ConnectionTestResult | null) => void
}) {
  const [profile, setProfile] = useState<ConnectionProfile>(loadProfile)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<ConnectionError | null>(null)
  const [result, setResult] = useState<ConnectionTestResult | null>(connection)

  useEffect(() => {
    const safeProfile: ConnectionProfile = {
      ...profile,
      auth: {
        ...profile.auth,
        password: "",
        token: "",
        headerValue: "",
      },
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(safeProfile))
  }, [profile])

  useEffect(() => {
    setResult(connection)
  }, [connection])

  const setProfileField = (field: "name" | "baseUrl" | "publicRepositoryUrl", value: string) => {
    setProfile((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  const setAuth = (patch: Partial<ConnectionProfile["auth"]>) => {
    setProfile((current) => ({ ...current, auth: { ...current.auth, ...patch } }))
    setError(null)
  }

  const testConnection = async () => {
    setTesting(true)
    setError(null)
    try {
      const next = await testAptlyConnection(profile)
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
          Conectá Aptly Dashboard a una API de Aptly compatible.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.72fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Servidor Aptly</CardTitle>
            <CardDescription>
              La primera matriz compatible apunta a Aptly 1.6.3. Este panel todavía usa el puente Tauri del prototipo y será migrado al backend web.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Nombre del perfil">
              <input
                value={profile.name}
                onChange={(event) => setProfileField("name", event.target.value)}
                className="field-input"
                placeholder="Producción"
              />
            </Field>

            <Field label="URL de la API">
              <input
                value={profile.baseUrl}
                onChange={(event) => setProfileField("baseUrl", event.target.value)}
                className="field-input"
                placeholder="https://aptly.example.com"
                spellCheck={false}
              />
              <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                Podés ingresar la raíz del servicio o una URL que termine en <code>/api</code>.
              </p>
            </Field>

            <Field label="URL pública del repositorio (opcional)">
              <input
                value={profile.publicRepositoryUrl || ""}
                onChange={(event) => setProfileField("publicRepositoryUrl", event.target.value)}
                className="field-input"
                placeholder="https://repo.example.com"
                spellCheck={false}
              />
            </Field>

            <div className="border-t pt-5">
              <div className="mb-3 text-sm font-semibold">Autenticación</div>
              <Field label="Método">
                <select
                  value={profile.auth.mode}
                  onChange={(event) => setAuth({ mode: event.target.value as AuthMode })}
                  className="field-input"
                >
                  <option value="none">Sin autenticación</option>
                  <option value="basic">Basic Auth</option>
                  <option value="bearer">Bearer token</option>
                  <option value="header">Header personalizado</option>
                </select>
              </Field>

              {profile.auth.mode === "basic" && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Usuario">
                    <input
                      value={profile.auth.username || ""}
                      onChange={(event) => setAuth({ username: event.target.value })}
                      className="field-input"
                      autoComplete="username"
                    />
                  </Field>
                  <Field label="Contraseña">
                    <input
                      type="password"
                      value={profile.auth.password || ""}
                      onChange={(event) => setAuth({ password: event.target.value })}
                      className="field-input"
                      autoComplete="current-password"
                    />
                  </Field>
                </div>
              )}

              {profile.auth.mode === "bearer" && (
                <div className="mt-4">
                  <Field label="Bearer token">
                    <input
                      type="password"
                      value={profile.auth.token || ""}
                      onChange={(event) => setAuth({ token: event.target.value })}
                      className="field-input"
                      autoComplete="off"
                    />
                  </Field>
                </div>
              )}

              {profile.auth.mode === "header" && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Nombre del header">
                    <input
                      value={profile.auth.headerName || ""}
                      onChange={(event) => setAuth({ headerName: event.target.value })}
                      className="field-input"
                      placeholder="X-API-Key"
                      spellCheck={false}
                    />
                  </Field>
                  <Field label="Valor">
                    <input
                      type="password"
                      value={profile.auth.headerValue || ""}
                      onChange={(event) => setAuth({ headerValue: event.target.value })}
                      className="field-input"
                      autoComplete="off"
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-[hsl(var(--muted))]/35 p-3 text-xs text-[hsl(var(--muted-foreground))]">
              Esta pantalla pertenece al prototipo de transición. En la arquitectura Docker/web, la conexión interna a Aptly se administra desde el backend y los secretos no se guardan en localStorage.
            </div>

            {!isTauriRuntime() && (
              <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                La prueba real actual requiere Tauri. Esto desaparecerá cuando terminemos el backend web.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={testConnection} disabled={testing || !isTauriRuntime()}>
                {testing ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
                {testing ? "Comprobando…" : "Probar conexión"}
              </Button>
              {result && (
                <Button variant="outline" onClick={() => { setResult(null); onConnected(null) }}>
                  Desconectar
                </Button>
              )}
            </div>

            {error && <ConnectionErrorCard error={error} />}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <ConnectionStatus result={result} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Política de publicación</CardTitle>
              <CardDescription>Regla local del dashboard para evitar promociones involuntarias.</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow label="PASS" value="Publica sólo en Testing" />
              <SettingRow label="Stable" value="Confirmación manual requerida" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despliegue</CardTitle>
              <CardDescription>Las actualizaciones se realizan cambiando las imágenes del stack desde Docker o Portainer.</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow label="Auto-update" value="Desactivado" />
              <SettingRow label="Actualización" value="Imagen elegida por el operador" />
              <SettingRow label="Persistencia" value="Volúmenes separados de las imágenes" />
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
          <CardDescription>No hay una conexión Aptly activa.</CardDescription>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium">{label}</span>{children}</label>
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
  return <div className="flex items-center justify-between border-b py-3 text-sm last:border-0"><span className="text-[hsl(var(--muted-foreground))]">{label}</span><span className="font-medium">{value}</span></div>
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
