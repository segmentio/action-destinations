import { IntegrationError } from '@segment/actions-core'
import { Settings } from './generated-types'

const HOST_PATTERN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+singlestore\.com$/
const DEFAULT_PORT = '443'
const MAX_ERROR_LENGTH = 200

export const SSRF_HARDENING_FLAGON = 'actions-singlestore-ssrf-hardening'

export function getExecUrl(settings: Settings, hardened = true): string {
  if (!hardened) {
    return `https://${settings.host}:${settings.port}/api/v2/exec`
  }

  const host = settings.host?.trim().toLowerCase()
  const port = settings.port?.trim() || DEFAULT_PORT

  if (!host || !HOST_PATTERN.test(host)) {
    throw new IntegrationError('Host must be a SingleStore hostname ending in ".singlestore.com".', 'INVALID_HOST', 400)
  }

  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new IntegrationError('Port must be a number between 1 and 65535.', 'INVALID_PORT', 400)
  }

  return `https://${host}:${Number(port)}/api/v2/exec`
}

export async function getErrorMessage(response: { status: number; text(): Promise<string> }): Promise<string> {
  let message: unknown

  try {
    const body = JSON.parse(await response.text())
    message = body?.error ?? body?.message
  } catch {
    message = undefined
  }

  return typeof message === 'string' && message
    ? message.slice(0, MAX_ERROR_LENGTH)
    : `Request failed with status ${response.status}`
}
