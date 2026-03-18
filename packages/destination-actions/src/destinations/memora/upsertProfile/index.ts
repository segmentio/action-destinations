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
      dynamic: true,
      disabledInputMethods: ['literal', 'variable', 'function', 'enrichment', 'freeform']
    },
    profile_identifiers: {
      label: 'Profile Identifiers',
      description:
        'Profile identifiers (email and/or phone). At least one identifier is required. These identifiers are stored in the Contact trait group.',
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
        email: { '@path': '$.traits.email' },
        phone: { '@path': '$.traits.phone' }
      }
    },
    profile_traits: {
      label: 'Profile Traits',
      description:
        'Traits for the profile from all trait groups. At least one trait is required. These fields are dynamically loaded from the selected Memora Store. When manually entering keys, use the format "TraitGroupName.$.traitName" (e.g., "Contact.$.firstName", "PurchaseHistory.$.lastPurchaseDate").',
      type: 'object',
      required: true,
      additionalProperties: true,
      dynamic: true,
      defaultObjectUI: 'keyvalue'
    }
  },
  dynamicFields: {
    memora_store: async (request, { settings }) => {
      return fetchMemoraStores(request, settings)
    },
    profile_traits: {
      __keys__: async (request, { settings, payload }) => {
        if (!payload.memora_store) {
          return { choices: [], error: { message: 'Please select a Memora Store first', code: 'STORE_REQUIRED' } }
        }
        return fetchAllTraits(request, settings, payload.memora_store)
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
  const validationErrors: Map<number, string> = new Map()

  payloads.forEach((payload, index) => {
    // Validate that profile has at least one identifier AND at least one trait
    const identifiers = payload.profile_identifiers || {}
    const hasIdentifier = !!(identifiers.email || identifiers.phone)

    const traits = (
      payload.profile_traits && typeof payload.profile_traits === 'object' ? payload.profile_traits : {}
    ) as Record<string, unknown>
    const hasTraits = Object.keys(traits).some((key) => traits[key] !== undefined && traits[key] !== null)

    if (!hasIdentifier || !hasTraits) {
      invalidIndices.push(index)
      validationErrors.set(
        index,
        'Profile must contain at least one identifier (email or phone) and at least one trait'
      )
      return
    }

    // Build trait groups for valid profile
    try {
      const traitGroups = buildTraitGroups(payload)
      validProfiles.push({ traits: traitGroups })
      validIndices.push(index)
    } catch (error) {
      // Catch validation errors for invalid trait key formats
      invalidIndices.push(index)
      validationErrors.set(index, error instanceof Error ? error.message : String(error))
    }
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
        errormessage: validationErrors.get(index) || 'Invalid profile',
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
  const invalidKeys: string[] = []

  // Process all traits from profile_traits field (format: TraitGroupName.$.traitName)
  if (payload.profile_traits && typeof payload.profile_traits === 'object') {
    const traits = payload.profile_traits as Record<string, unknown>
    Object.entries(traits).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // All traits use the format traitGroupName.$.traitName
        const match = key.match(/^([^.]+)\.\$\.(.+)$/)
        if (match) {
          const traitGroupName = match[1]
          const traitName = match[2]

          if (!traitGroups[traitGroupName]) {
            traitGroups[traitGroupName] = {}
          }
          traitGroups[traitGroupName][traitName] = value
        } else {
          // Track invalid keys for error reporting
          invalidKeys.push(key)
        }
      }
    })

    // Throw error for invalid trait keys to prevent data loss
    if (invalidKeys.length > 0) {
      throw new PayloadValidationError(
        `Invalid trait key format detected. The following keys do not match the expected format: ${invalidKeys.join(
          ', '
        )}. ` +
          `Expected format: "TraitGroupName.$.traitName" (e.g., "Contact.$.firstName", "PurchaseHistory.$.lastPurchaseDate").`
      )
    }
  }

  // Merge identifiers into Contact trait group (these are authoritative and will override any conflicting keys)
  if (payload.profile_identifiers && typeof payload.profile_identifiers === 'object') {
    const identifiers = payload.profile_identifiers as Record<string, unknown>
    Object.entries(identifiers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (!traitGroups.Contact) {
          traitGroups.Contact = {}
        }
        traitGroups.Contact[key] = value
      }
    })
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

interface TraitGroupsListResponse {
  traitGroups?: Array<{
    displayName: string
    description?: string
    traits?: Record<string, TraitDefinition>
    version?: number
  }>
  meta?: {
    pageSize?: number
    nextToken?: string
    previousToken?: string
  }
}

// Fetch all trait group definitions for dynamic fields
async function fetchAllTraits(request: RequestClient, settings: Settings, storeId: string) {
  try {
    // Fetch list of all trait groups (includes traits in the response)
    const traitGroupsResponse = await request<TraitGroupsListResponse>(
      `${BASE_URL}/${API_VERSION}/ControlPlane/Stores/${storeId}/TraitGroups?pageSize=100&includeTraits=true`,
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

    const traitGroupObjects = traitGroupsResponse?.data?.traitGroups || []

    // Map the response to the format we need
    const traitGroups = traitGroupObjects.map((traitGroup) => ({
      traitGroupName: traitGroup.displayName,
      traits: traitGroup.traits || {}
    }))

    // Build choices from all trait groups
    const choices: Array<{ label: string; value: string; description: string }> = []

    for (const { traitGroupName, traits } of traitGroups) {
      Object.entries(traits).forEach(([traitName, trait]) => {
        // For Contact trait group, exclude identifiers (email/phone) as they're handled separately
        if (traitGroupName === 'Contact' && (trait.idTypePromotion === 'email' || trait.idTypePromotion === 'phone')) {
          return
        }

        // Only include STRING type traits
        if (trait.dataType === 'STRING') {
          // All trait groups use traitGroupName.$.traitName format
          const value = `${traitGroupName}.$.${traitName}`
          const label = `${traitGroupName}.${trait.displayName || traitName}`

          // Use custom description if available, otherwise generate one
          const description = trait.description
            ? trait.description
            : `${traitGroupName} - ${trait.displayName} (${trait.dataType})`

          choices.push({
            label,
            value,
            description
          })
        }
      })
    }

    return {
      choices
    }
  } catch (error) {
    const statusCode = error?.response?.status || 'unknown'
    const errorMsg = error?.response?.data?.message || (error instanceof Error ? error.message : String(error))
    return {
      choices: [],
      error: {
        message: `Unable to fetch traits (HTTP ${statusCode}: ${errorMsg}). You can still manually enter field names.`,
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
        message: 'Unable to fetch memora stores. Please check your authentication credentials.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

export default action
