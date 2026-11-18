import type { DynamicFieldResponse, RequestClient } from '@segment/actions-core'
import {
  ECID_NAMESPACE,
  IDENTITY_NAMESPACES_URL,
  PID_NAMESPACE,
  SANDBOX_HEADER,
  SCHEMA_REGISTRY_URL
} from './constants'
import type { Settings } from './generated-types'
import { getAccessToken, RESERVED_KEYS } from './utils'
import type { IdentityNamespace, MessageKind, SchemaRegistryListResponse, XdmSchemaNode } from './types'

// Dynamic handlers receive the mapping as the customer has entered it so far. Values mapped from an event
// variable arrive as unresolved directives (objects), so only presence is checked for those.
interface IdentityMappingPayload {
  imsOrgId?: unknown
  sandboxName?: unknown
  schemaRefId?: unknown
  pid?: unknown
  ecid?: unknown
  customIdentities?: { namespace?: unknown }[]
}

interface DynamicContext {
  settings: Settings
  auth?: { accessToken?: string }
}

/**
 * GET against an Adobe API from a dynamic field. Core only refreshes OAuth tokens while delivering events, so a
 * dynamic call can arrive with no token, or an expired one. Mint a token from the client credentials in those
 * cases, and retry once if Adobe answers 401.
 */
async function adobeGet<T>(
  request: RequestClient,
  url: string,
  { settings, auth }: DynamicContext,
  headers: Record<string, string>,
  searchParams?: Record<string, string>
) {
  const call = (token?: string) =>
    request<T>(url, {
      method: 'GET',
      searchParams,
      headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
  const fresh = async () => call(await getAccessToken(request, settings.client_id, settings.client_secret))

  if (!auth?.accessToken) return fresh()
  try {
    return await call()
  } catch (error) {
    if ((error as { response?: { status?: number } })?.response?.status === 401) return fresh()
    throw error
  }
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
  context: DynamicContext
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
    const response = await adobeGet<IdentityNamespace[]>(request, IDENTITY_NAMESPACES_URL, context, {
      'x-gw-ims-org-id': imsOrgId,
      [SANDBOX_HEADER]: sandboxName,
      Accept: 'application/json'
    })
    const namespaces = Array.isArray(response.data) ? response.data : []
    const choices = namespaces
      .filter((n) => n?.code && n.code !== PID_NAMESPACE && n.code !== ECID_NAMESPACE)
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

/**
 * Choices for `schemaRefId`: the schemas in the sandbox that extend the given XDM class. The value is the
 * schema `$id`, which is what `schemaRef.id` expects.
 */
export async function getSchemas(
  request: RequestClient,
  payload: IdentityMappingPayload,
  xdmClass: string,
  context: DynamicContext
): Promise<DynamicFieldResponse> {
  const imsOrgId = text(payload?.imsOrgId)
  const sandboxName = text(payload?.sandboxName)
  if (!imsOrgId || !sandboxName) {
    return {
      choices: [],
      error: {
        code: 'MISSING_CONNECTION_DETAILS',
        message: 'Enter the IMS Organization ID and Sandbox Name as values to load schemas.'
      }
    }
  }

  try {
    const response = await adobeGet<SchemaRegistryListResponse>(
      request,
      SCHEMA_REGISTRY_URL,
      context,
      { 'x-gw-ims-org-id': imsOrgId, [SANDBOX_HEADER]: sandboxName, Accept: 'application/vnd.adobe.xed-id+json' },
      { property: `meta:extends==${xdmClass}`, orderby: 'title', limit: '300' }
    )
    const choices = (Array.isArray(response.data?.results) ? response.data.results : [])
      .filter((s) => s?.$id)
      .map((s) => ({ label: s.title ? `${s.title}` : s.$id, value: s.$id }))
    return { choices, nextPage: '' }
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    return {
      choices: [],
      error: {
        code: String(status ?? 'ERROR'),
        message:
          status === 401 || status === 403
            ? 'Adobe denied the request. Check that the credential can read schemas in this sandbox.'
            : 'Could not load schemas from Adobe. You can still paste the schema $id.'
      }
    }
  }
}

const MAX_XDM_DEPTH = 8

/**
 * Flattens an XDM schema into the dotted paths a value can be written to. Objects are walked; arrays and maps
 * are offered as one path, because XDM Mapping writes a whole value to a dotted path and cannot address an
 * array element or a map key.
 */
export function flattenXdmPaths(
  properties: Record<string, XdmSchemaNode> | undefined,
  prefix = '',
  depth = 0
): { path: string; node: XdmSchemaNode }[] {
  const paths: { path: string; node: XdmSchemaNode }[] = []
  for (const [name, node] of Object.entries(properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name
    const isMap = node?.['meta:xdmType'] === 'map'
    if (node?.properties && !isMap && depth < MAX_XDM_DEPTH) {
      paths.push(...flattenXdmPaths(node.properties, path, depth + 1))
    } else {
      paths.push({ path, node })
    }
  }
  return paths
}

/**
 * Choices for the keys of `xdmMapping`: the paths in the selected schema. Paths the action sets itself
 * (`_id`, `timestamp`, `identityMap`) are left out.
 */
export async function getXdmPaths(
  request: RequestClient,
  payload: IdentityMappingPayload,
  kind: MessageKind,
  context: DynamicContext
): Promise<DynamicFieldResponse> {
  const imsOrgId = text(payload?.imsOrgId)
  const sandboxName = text(payload?.sandboxName)
  const schemaId = text(payload?.schemaRefId)
  if (!schemaId) {
    return {
      choices: [],
      error: { code: 'SCHEMA_REQUIRED', message: 'Select a Schema ID first.' }
    }
  }
  if (!imsOrgId || !sandboxName) {
    return {
      choices: [],
      error: {
        code: 'MISSING_CONNECTION_DETAILS',
        message: 'Enter the IMS Organization ID and Sandbox Name as values to load schema paths.'
      }
    }
  }

  try {
    const response = await adobeGet<XdmSchemaNode>(
      request,
      `${SCHEMA_REGISTRY_URL}/${encodeURIComponent(schemaId)}`,
      context,
      {
        'x-gw-ims-org-id': imsOrgId,
        [SANDBOX_HEADER]: sandboxName,
        Accept: 'application/vnd.adobe.xed-full+json;version=1'
      }
    )
    const choices = flattenXdmPaths(response.data?.properties)
      .filter(({ path }) => !RESERVED_KEYS[kind].includes(path.split('.')[0]))
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(({ path, node }) => {
        const detail = [node.title, node['meta:xdmType'] ?? node.type].filter(Boolean).join(' · ')
        return { label: path, value: path, ...(detail ? { description: detail } : {}) }
      })
    return { choices, nextPage: '' }
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    return {
      choices: [],
      error: {
        code: String(status ?? 'ERROR'),
        message:
          status === 401 || status === 403
            ? 'Adobe denied the request. Check that the credential can read schemas in this sandbox.'
            : 'Could not load the schema from Adobe. You can still type XDM paths.'
      }
    }
  }
}
