import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, PayloadValidationError, MultiStatusResponse } from '@segment/actions-core'
import type { Logger } from '@segment/actions-core/destination-kit'
import { API_VERSION } from '../versioning-info'
import { BASE_URL } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile',
  description:
    'Create or update Memora profiles. If a profile already exists, its traits are merged (new keys added, existing keys overwritten). Supports batching up to 1000 profiles.',
  defaultSubscription: 'type = "identify"',
  fields: {
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to Memora. Batches can contain up to 1000 profiles.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of profiles to include in each batch. Actual batch sizes may be lower.',
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
      label: 'Contact Traits',
      description:
        'Contact traits for the profile. At least one trait is required. Map Segment event fields to Memora traits with their types.',
      type: 'object',
      required: true,
      multiple: true,
      additionalProperties: false,
      properties: {
        trait_name: {
          label: 'Trait Name',
          description: 'The name of the trait in Memora',
          type: 'string',
          required: true,
          dynamic: true
        },
        trait_type: {
          label: 'Trait Type',
          description: 'The data type of the trait in Memora',
          type: 'string',
          required: true,
          choices: [
            { label: 'String', value: 'STRING' },
            { label: 'Number', value: 'NUMBER' },
            { label: 'Boolean', value: 'BOOLEAN' },
            { label: 'Date', value: 'DATE' }
          ]
        },
        value: {
          label: 'Value',
          description: 'The value to map from the Segment event',
          type: 'string',
          required: true
        }
      }
    }
  },
  dynamicFields: {
    memora_store: async (request, { settings }) => {
      return fetchMemoraStores(request, settings)
    },
    contact_traits: {
      trait_name: async (request, { settings, payload }) => {
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

// Process single or batch profile upserts using bulk API
async function upsertProfiles(
  request: RequestClient,
  payloads: Payload[],
  settings: Settings,
  logger?: Logger
): Promise<MultiStatusResponse> {
  if (!payloads || payloads.length === 0) {
    throw new IntegrationError('No profiles provided', 'EMPTY_BATCH', 400)
  }

  const storeId = payloads[0].memora_store

  // Track valid profiles and their original indices
  const validProfiles: { traits: Record<string, Record<string, unknown>> }[] = []
  const validIndices: number[] = []
  const invalidIndices: number[] = []

  payloads.forEach((payload, index) => {
    // Validate that profile has at least one identifier AND at least one trait
    const identifiers = payload.contact_identifiers || {}
    const hasIdentifier = !!(identifiers.email || identifiers.phone)

    const traits = Array.isArray(payload.contact_traits) ? payload.contact_traits : []
    const hasTraits = traits.some((t) => t.trait_name && t.value !== undefined && t.value !== null)

    if (!hasIdentifier || !hasTraits) {
      invalidIndices.push(index)
      return
    }

    // Build trait groups for valid profile
    const traitGroups = buildTraitGroups(payload)
    validProfiles.push({ traits: traitGroups })
    validIndices.push(index)
  })

  if (invalidIndices.length > 0) {
    logger?.warn?.(
      `Skipped ${invalidIndices.length} invalid profile(s). Processing ${validProfiles.length} valid profile(s).`
    )
  }

  if (validProfiles.length === 0) {
    throw new PayloadValidationError(
      'No valid profiles found for import. All profiles must contain at least one identifier (email or phone) and at least one trait.'
    )
  }

  try {
    const response = await request(`${BASE_URL}/${API_VERSION}/Stores/${storeId}/Profiles/Bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Pre-Auth-Context': settings.twilioAccount
      },
      username: settings.username,
      password: settings.password,
      json: {
        profiles: validProfiles
      }
    })

    logger?.info?.(`Bulk upsert completed successfully for ${validProfiles.length} profile(s)`)

    // Build multi-status response
    const multiStatusResponse = new MultiStatusResponse()

    // Mark valid profiles as successful
    validIndices.forEach((index) => {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: response.status,
        sent: {},
        body: 'accepted'
      })
    })

    // Mark invalid profiles with validation error
    invalidIndices.forEach((index) => {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage: 'Profile must contain at least one identifier (email or phone) and at least one trait',
        sent: {},
        body: 'skipped'
      })
    })

    return multiStatusResponse
  } catch (error) {
    logger?.error?.(`Error in bulk upsert: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

// Build trait groups payload for Memora API
function buildTraitGroups(payload: Payload): Record<string, Record<string, unknown>> {
  const traitGroups: Record<string, Record<string, unknown>> = {}
  const contactTraits: Record<string, unknown> = {}

  // Process contact traits array with type conversion
  if (Array.isArray(payload.contact_traits)) {
    payload.contact_traits.forEach((trait) => {
      if (!trait.trait_name || trait.value === undefined || trait.value === null) {
        return
      }

      // Convert value based on trait type
      let convertedValue: unknown = trait.value

      if (trait.trait_type === 'NUMBER') {
        convertedValue = typeof trait.value === 'number' ? trait.value : parseFloat(String(trait.value))
        if (isNaN(convertedValue as number)) {
          convertedValue = trait.value // Keep original if conversion fails
        }
      } else if (trait.trait_type === 'BOOLEAN') {
        if (typeof trait.value === 'boolean') {
          convertedValue = trait.value
        } else {
          const strValue = String(trait.value).toLowerCase()
          convertedValue = strValue === 'true' || strValue === '1' || strValue === 'yes'
        }
      } else if (trait.trait_type === 'DATE') {
        // Keep as-is, assuming it's already in correct format
        convertedValue = trait.value
      } else {
        // STRING or default - convert to string
        convertedValue = String(trait.value)
      }

      contactTraits[trait.trait_name] = convertedValue
    })
  }

  // Merge identifiers last (these are authoritative and will override any conflicting keys)
  if (payload.contact_identifiers && typeof payload.contact_identifiers === 'object') {
    const identifiers = payload.contact_identifiers as Record<string, unknown>
    Object.entries(identifiers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        contactTraits[key] = value
      }
    })
  }

  // Only add Contact trait group if it has at least one field
  if (Object.keys(contactTraits).length > 0) {
    traitGroups.Contact = contactTraits
  }

  return traitGroups
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
          'X-Pre-Auth-Context': settings.twilioAccount
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
          'X-Pre-Auth-Context': settings.twilioAccount
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
            'X-Pre-Auth-Context': settings.twilioAccount
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
