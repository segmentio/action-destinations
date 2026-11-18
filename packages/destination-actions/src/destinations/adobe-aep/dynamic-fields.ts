import type { DynamicFieldResponse, RequestClient } from '@segment/actions-core'
import { ECID_NAMESPACE, IDENTITY_NAMESPACES_URL, PID_NAMESPACE, SANDBOX_HEADER } from './constants'
import type { IdentityNamespace } from './types'

// Dynamic handlers receive the mapping as the customer has entered it so far. Values mapped from an event
// variable arrive as unresolved directives (objects), so only presence is checked for those.
interface IdentityMappingPayload {
  imsOrgId?: unknown
  sandboxName?: unknown
  pid?: unknown
  ecid?: unknown
  customIdentities?: { namespace?: unknown }[]
}

const isSet = (value: unknown): boolean =>
  value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/**
 * Choices for `customIdentities.namespace`: the identity namespaces available in the sandbox.
 * PID and ECID have their own fields, so they are left out. The value is the namespace `code`,
 * which is the `identityMap` key.
 */
export async function getIdentityNamespaces(
  request: RequestClient,
  payload: IdentityMappingPayload,
  query?: string
): Promise<DynamicFieldResponse> {
  const imsOrgId = text(payload?.imsOrgId)
  const sandboxName = text(payload?.sandboxName)
  if (!imsOrgId || !sandboxName) {
    return {
      choices: [],
      error: {
        code: 'MISSING_CONNECTION_DETAILS',
        message: 'Enter the IMS Organization ID and Sandbox Name as values to load identity namespaces.'
      }
    }
  }

  try {
    const response = await request<IdentityNamespace[]>(IDENTITY_NAMESPACES_URL, {
      method: 'GET',
      headers: { 'x-gw-ims-org-id': imsOrgId, [SANDBOX_HEADER]: sandboxName, Accept: 'application/json' }
    })
    const filter = query?.trim().toLowerCase()
    const namespaces = Array.isArray(response.data) ? response.data : []
    const choices = namespaces
      .filter((n) => n?.code && n.code !== PID_NAMESPACE && n.code !== ECID_NAMESPACE)
      .filter((n) => !filter || `${n.code} ${n.name ?? ''}`.toLowerCase().includes(filter))
      // Custom namespaces first: they are the ones customers usually need.
      .sort((a, b) => Number(!!b.custom) - Number(!!a.custom) || a.code.localeCompare(b.code))
      .map((n) => ({ label: n.name && n.name !== n.code ? `${n.code} (${n.name})` : n.code, value: n.code }))
    return { choices, nextPage: '' }
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    return {
      choices: [],
      error: {
        code: String(status ?? 'ERROR'),
        message:
          status === 401 || status === 403
            ? 'Adobe denied the request. Check that the credential can view identity namespaces in this sandbox.'
            : 'Could not load identity namespaces from Adobe. You can still type the namespace code.'
      }
    }
  }
}

/** Choices for `primaryIdentity`: the identities that are mapped so far. */
export function getPrimaryIdentityChoices(payload: IdentityMappingPayload): DynamicFieldResponse {
  const namespaces: string[] = []
  if (isSet(payload?.pid)) namespaces.push(PID_NAMESPACE)
  if (isSet(payload?.ecid)) namespaces.push(ECID_NAMESPACE)
  for (const entry of payload?.customIdentities ?? []) {
    const namespace = text(entry?.namespace)
    if (namespace && !namespaces.includes(namespace)) namespaces.push(namespace)
  }
  if (namespaces.length === 0) {
    return {
      choices: [],
      error: { code: 'NO_IDENTITIES_MAPPED', message: 'Map ECID, PID or a custom identity first.' }
    }
  }
  return { choices: namespaces.map((n) => ({ label: n, value: n })), nextPage: '' }
}
