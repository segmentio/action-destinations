import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, createRequestClient } from '@segment/actions-core'
import type { Logger } from '@segment/actions-core/destination-kit'
import { API_VERSION } from '../versioning-info'
import { BASE_URL } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile',
  description:
    'Create or update Memora profiles by importing a CSV file. Profiles are uploaded via a pre-signed URL and processed asynchronously. If a profile already exists, its traits are merged (new keys added, existing keys overwritten).',
  defaultSubscription: 'type = "identify"',
  fields: {
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to Memora. Batches are uploaded as CSV files.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of profiles to include in each CSV import. Actual batch sizes may be lower.',
      type: 'number',
      default: 1000,
      unsafe_hidden: true
    },
    memora_store: {
      label: 'Memora Store',
      description:
        'The Memora Store ID to use for this profile. This should be a valid Memora Store associated with your Twilio account.',
      type: 'string',
      required: true,
      dynamic: true
    },
    contact_identifiers: {
      label: 'Contact Identifiers',
      description: 'Contact identifiers (email and/or phone). At least one identifier is required.',
      type: 'object',
      required: true,
      additionalProperties: false,
      properties: {
        email: {
          label: 'Email',
          description: 'User email address',
          type: 'string',
          format: 'email'
        },
        phone: {
          label: 'Phone',
          description: 'User phone number',
          type: 'string'
        }
      },
      default: {
        email: { '@path': '$.properties.email' },
        phone: { '@path': '$.properties.phone' }
      }
    },
    contact_traits: {
      label: 'Other Contact Traits',
      description:
        'Additional contact traits for the profile. These fields are dynamically loaded from the selected Memora Store.',
      type: 'object',
      required: false,
      additionalProperties: true,
      dynamic: true
    }
  },
  dynamicFields: {
    memora_store: async (request, { settings }) => {
      return fetchMemoraStores(request, settings)
    },
    contact_traits: {
      __keys__: async (request, { settings, payload }) => {
        if (!payload.memora_store) {
          return { choices: [], error: { message: 'Please select a Memora Store first', code: 'STORE_REQUIRED' } }
        }
        return fetchContactTraits(request, settings, payload.memora_store)
      }
    }
  },
  perform: async (request, { payload, settings, logger }) => {
    return upsertProfiles(request, [payload], settings, logger)
  },

  performBatch: async (request, { payload: payloads, settings, logger }) => {
    return upsertProfiles(request, payloads, settings, logger)
  }
}

// Validate profiles and collect all unique field names from payloads
function validateAndCollectFields(payloads: Payload[]): Set<string> {
  const allFields = new Set<string>()

  payloads.forEach((payload, index) => {
    // Validate that at least one identifier is present
    const identifiers = payload.contact_identifiers || {}
    if (!identifiers.email && !identifiers.phone) {
      throw new IntegrationError(
        `Profile at index ${index} must contain at least one identifier (email or phone)`,
        'MISSING_IDENTIFIER',
        400
      )
    }

    // Collect identifier field names
    if (identifiers.email) allFields.add('email')
    if (identifiers.phone) allFields.add('phone')

    // Collect trait field names
    if (payload.contact_traits && typeof payload.contact_traits === 'object') {
      const traits = payload.contact_traits as Record<string, unknown>
      Object.keys(traits).forEach((key) => {
        if (traits[key] !== undefined) {
          allFields.add(key)
        }
      })
    }
  })

  if (allFields.size === 0) {
    throw new IntegrationError('No profile fields found for import', 'EMPTY_PROFILE', 400)
  }

  return allFields
}

// Request pre-signed upload URL from Memora API
async function requestImportUrl(
  request: ReturnType<typeof createRequestClient>,
  storeId: string,
  fileSize: number,
  columnMappings: ColumnMapping[],
  settings: Settings,
  logger?: Logger
): Promise<{ importId: string; uploadUrl: string }> {
  const timestamp = Date.now()
  const filename = `memora-segment-import-${storeId}-${timestamp}.csv`

  try {
    const importResponse = await request<{ importId: string; url: string }>(
      `${BASE_URL}/${API_VERSION}/Stores/${storeId}/Profiles/Imports`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        username: settings.username,
        password: settings.password,
        json: {
          filename,
          fileSize,
          columnMappings
        }
      }
    )

    const importId = importResponse.data.importId
    const uploadUrl = importResponse.data.url
    logger?.info?.(`Memora import initiated: ${importId}`)

    return { importId, uploadUrl }
  } catch (error) {
    logger?.error?.(`Error initiating Memora import: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

// Upload CSV buffer to pre-signed URL
async function uploadCSVToMemora(
  request: ReturnType<typeof createRequestClient>,
  uploadUrl: string,
  csvBuffer: Buffer,
  importId: string,
  profileCount: number,
  logger?: Logger
): Promise<{ data: { importId: string; profileCount: number; success: boolean } }> {
  try {
    await request(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/csv'
      },
      body: csvBuffer as unknown as BodyInit
    })

    logger?.info?.(`CSV uploaded successfully to Memora (importId: ${importId}, ${profileCount} profiles)`)

    return {
      data: {
        importId,
        profileCount,
        success: true
      }
    }
  } catch (error) {
    logger?.error?.(
      `Error uploading CSV to Memora (importId: ${importId}): ${error instanceof Error ? error.message : String(error)}`
    )
    throw error
  }
}

// Process single or batch profile imports via CSV
async function upsertProfiles(
  request: ReturnType<typeof createRequestClient>,
  payloads: Payload[],
  settings: Settings,
  logger?: Logger
) {
  if (!payloads || payloads.length === 0) {
    throw new IntegrationError('No profiles provided for import', 'EMPTY_BATCH', 400)
  }

  const storeId = payloads[0]?.memora_store

  // Validate profiles and collect all unique field names
  const allFields = validateAndCollectFields(payloads)

  // Convert profiles to CSV format
  const { csv, columnMappings } = convertToCSV(payloads, Array.from(allFields))
  const csvBuffer = Buffer.from(csv, 'utf-8')

  // Request pre-signed upload URL from Memora
  const { importId, uploadUrl } = await requestImportUrl(
    request,
    storeId,
    csvBuffer.length,
    columnMappings,
    settings,
    logger
  )

  // Upload CSV to pre-signed URL
  return uploadCSVToMemora(request, uploadUrl, csvBuffer, importId, payloads.length, logger)
}

// Convert profiles to CSV format with column mappings
function convertToCSV(payloads: Payload[], fields: string[]): { csv: string; columnMappings: ColumnMapping[] } {
  // Helper function to escape CSV values
  const escapeCSVValue = (value: string): string => {
    // Escape values that contain comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Build CSV header with escaped field names
  const header = fields.map(escapeCSVValue).join(',')

  // Build CSV rows
  const rows = payloads.map((payload) => {
    return fields
      .map((field) => {
        let value: unknown

        // Check identifiers first
        if (field === 'email' || field === 'phone') {
          const identifiers = payload.contact_identifiers as Record<string, unknown>
          value = identifiers?.[field]
        } else {
          // Check contact traits
          const traits = payload.contact_traits as Record<string, unknown>
          value = traits?.[field]
        }

        // Handle CSV escaping
        if (value === undefined || value === null) {
          return ''
        }

        const stringValue = String(value)
        return escapeCSVValue(stringValue)
      })
      .join(',')
  })

  const csv = [header, ...rows].join('\n')

  // Build column mappings for Memora API
  const columnMappings: ColumnMapping[] = fields.map((field) => ({
    columnName: field,
    traitGroup: 'Contact',
    traitName: field
  }))

  return { csv, columnMappings }
}

interface ColumnMapping {
  columnName: string
  traitGroup: string
  traitName: string
}

interface MemoraStoresResponse {
  stores?: string[]
  meta?: {
    pageSize?: number
    nextToken?: string
    previousToken?: string
  }
}

interface MemoraStoreDetails {
  displayName: string
  id: string
}

interface TraitDefinition {
  dataType: string
  description?: string
  displayName: string
  idTypePromotion?: string | null
}

interface TraitGroupResponse {
  traitGroup?: {
    traits?: Record<string, TraitDefinition>
  }
}

// Fetch contact trait definitions for dynamic fields
async function fetchContactTraits(request: RequestClient, settings: Settings, storeId: string) {
  try {
    const response = await request<TraitGroupResponse>(
      `${BASE_URL}/${API_VERSION}/ControlPlane/Stores/${storeId}/TraitGroups/Contact?includeTraits=true&pageSize=100`,
      {
        method: 'GET',
        headers: {
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        username: settings.username,
        password: settings.password,
        skipResponseCloning: true
      }
    )

    const traitsObj = response?.data?.traitGroup?.traits || {}
    const choices = Object.entries(traitsObj)
      .filter(([_, trait]) => trait.idTypePromotion !== 'email' && trait.idTypePromotion !== 'phone') // Exclude identifiers
      .map(([traitName, trait]) => ({
        label: trait.displayName || traitName,
        value: traitName,
        description: trait.description || `${trait.displayName} (${trait.dataType})`
      }))

    return {
      choices
    }
  } catch (error) {
    const statusCode = error?.response?.status || 'unknown'
    const errorMsg = error?.response?.data?.message || (error instanceof Error ? error.message : String(error))
    return {
      choices: [],
      error: {
        message: `Unable to fetch contact traits (HTTP ${statusCode}: ${errorMsg}). You can still manually enter field names.`,
        code: 'FETCH_ERROR'
      }
    }
  }
}

// Fetch available memora stores from Control Plane
async function fetchMemoraStores(request: RequestClient, settings: Settings) {
  try {
    // Call the Control Plane API to list memora stores
    const response = await request<MemoraStoresResponse>(
      `${BASE_URL}/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`,
      {
        method: 'GET',
        headers: {
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        username: settings.username,
        password: settings.password,
        skipResponseCloning: true
      }
    )

    const stores = response?.data?.stores || []

    // This is not the most efficient way to get store details, but the Control Plane API does not currently provide an endpoint to list stores with their details in a single call.
    // We need to make individual calls to get store details in order to display more information in the dropdown (e.g. store name).
    // Fortunately, most accounts will have a small number of stores (max 5), so this should not be a major performance issue. If we find that this is causing performance problems, we can consider caching store details or adding an endpoint to the Control Plane API to list stores with their details.
    const memoraStores = await Promise.all(
      stores.map((storeId: string) => {
        return request<MemoraStoreDetails>(`${BASE_URL}/${API_VERSION}/ControlPlane/Stores/${storeId}`, {
          method: 'GET',
          headers: {
            ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
          },
          username: settings.username,
          password: settings.password,
          skipResponseCloning: true
        })
      })
    )

    const choices = memoraStores.map((store) => ({
      label: store.data?.displayName || store.data?.id,
      value: store.data?.id
    }))

    return {
      choices
    }
  } catch (error) {
    // Return empty choices if the API call fails
    return {
      choices: [],
      error: {
        message: 'Unable to fetch memora stores. Enter the memora store ID manually.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

export default action
