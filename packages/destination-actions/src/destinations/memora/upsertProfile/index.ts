import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, createRequestClient } from '@segment/actions-core'
import { API_VERSION, BASE_URL } from '../index'
import type { Logger } from '@segment/actions-core/destination-kit'

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

// Process single or batch profile imports via CSV
async function upsertProfiles(
  request: ReturnType<typeof createRequestClient>,
  payloads: Payload[],
  settings: Settings,
  logger?: Logger
) {
  logger?.info?.('Starting Memora profile upsert process')
  const storeId = payloads[0]?.memora_store

  if (!payloads || payloads.length === 0) {
    throw new IntegrationError('No profiles provided for import', 'EMPTY_BATCH', 400)
  }

  // Validate profiles and collect all unique field names
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

    // Collect all field names
    if (identifiers.email) allFields.add('email')
    if (identifiers.phone) allFields.add('phone')

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

  // Convert to CSV
  const { csv, columnMappings } = convertToCSV(payloads, Array.from(allFields))
  const csvBuffer = Buffer.from(csv, 'utf-8')
  const filename = 'memora-segment-import.csv'

  // Step 1: Request pre-signed upload URL
  let importId: string
  let uploadUrl: string

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
          fileSize: csvBuffer.length,
          columnMappings
        }
      }
    )

    importId = importResponse.data.importId
    uploadUrl = importResponse.data.url
    logger?.info?.(`Memora import initiated: ${importId} (${payloads.length} profiles)`)
  } catch (error) {
    logger?.error?.(`Error initiating Memora import: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }

  // Step 2: Upload CSV to pre-signed URL (no auth needed)
  try {
    await request(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/csv'
      },
      body: csvBuffer
    })

    logger?.info?.(`CSV uploaded successfully to Memora (importId: ${importId}, ${payloads.length} profiles)`)

    // Return success with importId for tracking
    return {
      data: {
        importId,
        profileCount: payloads.length,
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
async function fetchContactTraits(
  request: ReturnType<typeof createRequestClient>,
  settings: Settings,
  storeId: string
) {
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
    return {
      choices: [],
      error: {
        message: 'Unable to fetch contact traits. You can still manually enter field names.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

// Fetch available memora stores from Control Plane
async function fetchMemoraStores(request: ReturnType<typeof createRequestClient>, settings: Settings) {
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
    const choices = stores.map((storeId: string) => ({
      label: storeId,
      value: storeId
    }))

    return {
      choices
    }
  } catch (error) {
    // Return empty choices if the API call fails
    return {
      choices: [],
      error: {
        message: 'Unable to fetch memora stores. You can still manually enter a memora store ID.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

export default action
