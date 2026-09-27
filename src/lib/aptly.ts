import { invoke } from "@tauri-apps/api/core"

export type AuthMode = "none" | "basic" | "bearer" | "header"

export interface AuthConfig {
  mode: AuthMode
  username?: string
  password?: string
  token?: string
  headerName?: string
  headerValue?: string
}

export interface ConnectionProfile {
  name: string
  baseUrl: string
  publicRepositoryUrl?: string
  auth: AuthConfig
}

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

export function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window
}

export async function testAptlyConnection(profile: ConnectionProfile) {
  return invoke<ConnectionTestResult>("test_aptly_connection", { profile })
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
      // Tauri can reject with a plain string.
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
