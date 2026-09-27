export interface AptlyCapabilities {
  repositories: boolean
  mirrors: boolean
  snapshots: boolean
  publications: boolean
  tasks: boolean
  storage: boolean
  gpgKeys: boolean
}

export interface ConnectionTestResult {
  profileName: string
  normalizedUrl: string
  publicRepositoryUrl?: string
  version: string
  compatibility: "supported" | "unverified" | "unsupported"
  healthy: boolean
  ready: boolean
  latencyMs: number
  capabilities: AptlyCapabilities
  warnings: string[]
}

export interface ConnectionError {
  kind: string
  message: string
  operation: string
  httpStatus?: number
  technicalDetails?: string
}

export interface DashboardConfig {
  dashboardVersion: string
  profileName: string
  aptlyBaseUrl: string
  publicRepositoryUrl?: string
  authMode: string
  expectedAptlyVersion: string
}

export interface PublicEndpoint {
  hostname: string
  prefix: string
  enabled: boolean
}

export async function getDashboardConfig() {
  return requestJson<DashboardConfig>("/api/dashboard/config")
}

export async function getAptlyStatus() {
  return requestJson<ConnectionTestResult>("/api/dashboard/aptly/status")
}

export async function testAptlyConnection() {
  return requestJson<ConnectionTestResult>("/api/dashboard/aptly/test", {
    method: "POST",
  })
}

export async function listPublicEndpoints() {
  return requestJson<PublicEndpoint[]>("/api/dashboard/endpoints")
}

export async function savePublicEndpoint(hostname: string, prefix: string, enabled = true) {
  return requestJson<PublicEndpoint>(`/api/dashboard/endpoints/${encodeURIComponent(hostname)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix, enabled }),
  })
}

export async function deletePublicEndpoint(hostname: string) {
  const response = await fetch(`/api/dashboard/endpoints/${encodeURIComponent(hostname)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  })

  if (!response.ok && response.status !== 404) {
    const payload = await response.json().catch(() => null)
    throw parseConnectionError(payload || {
      kind: "http",
      message: `El Dashboard respondió con HTTP ${response.status}.`,
      operation: "delete endpoint",
      httpStatus: response.status,
    })
  }
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw parseConnectionError(payload || {
      kind: "http",
      message: `El Dashboard respondió con HTTP ${response.status}.`,
      operation: input,
      httpStatus: response.status,
    })
  }

  return payload as T
}

export function parseConnectionError(value: unknown): ConnectionError {
  if (typeof value === "object" && value !== null && "message" in value) {
    const object = value as Partial<ConnectionError>
    return {
      kind: object.kind || "unknown",
      message: String(object.message || "Error desconocido"),
      operation: object.operation || "connection",
      httpStatus: object.httpStatus,
      technicalDetails: object.technicalDetails,
    }
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object" && parsed.message) {
        return parseConnectionError(parsed)
      }
    } catch {
      // Plain network/runtime error.
    }

    return {
      kind: "unknown",
      message: value,
      operation: "connection",
    }
  }

  return {
    kind: "unknown",
    message: "No se pudo comprobar la conexión con Aptly.",
    operation: "connection",
  }
}
