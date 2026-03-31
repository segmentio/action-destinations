import type { ActionDefinition, RequestClient, ModifiedResponse } from '@segment/actions-core'
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
        'Profile identifiers from all trait groups. At least one identifier is required, and at least two total fields (identifiers + traits) must be mapped. These fields are dynamically loaded from the selected Memora Store. When manually entering keys, use the format "TraitGroupName.$.traitName" (e.g., "Contact.$.email", "Contact.$.phone").',
      type: 'object',
      required: true,
      additionalProperties: true,
      dynamic: true,
      defaultObjectUI: 'keyvalue'
    },
    profile_traits: {
      label: 'Profile Traits',
      description:
        'Traits for the profile from all trait groups. These fields are dynamically loaded from the selected Memora Store. When manually entering keys, use the format "TraitGroupName.$.traitName" (e.g., "Contact.$.firstName", "PurchaseHistory.$.lastPurchaseDate").',
      type: 'object',
      required: false,
      additionalProperties: true,
      dynamic: true,
      defaultObjectUI: 'keyvalue'
    }
  },
  dynamicFields: {
    memora_store: async (request, { settings }) => {
      return fetchMemoraStores(request, settings)
    },
    profile_identifiers: {
      __keys__: async (request, { settings, payload }) => {
        if (!payload.memora_store) {
          return { choices: [], error: { message: 'Please select a Memora Store first', code: 'STORE_REQUIRED' } }
        }
        const result = await fetchTraitGroupFields(request, settings, payload.memora_store)
        return result.identifiers
      }
    },
    profile_traits: {
      __keys__: async (request, { settings, payload }) => {
        if (!payload.memora_store) {
          return { choices: [], error: { message: 'Please select a Memora Store first', code: 'STORE_REQUIRED' } }
        }
        const result = await fetchTraitGroupFields(request, settings, payload.memora_store)
        return result.traits
      }
    }
  },
  perform: async (request, { payload, settings, logger }) => {
    const { rawResponse, multiStatus } = await upsertProfiles(request, [payload], settings, logger)

    // For single-event execution, convert validation errors to thrown exceptions
    if (multiStatus.isErrorResponseAtIndex(0)) {
      const response = multiStatus.getResponseAtIndex(0).value()
      const error = response as { status: number; errormessage?: string }
      throw new PayloadValidationError(error.errormessage || 'Invalid profile')
    }

    // rawResponse should always be defined if we reach here (validation passed)
    if (!rawResponse) {
      throw new IntegrationError('No response returned from bulk upsert', 'MISSING_RESPONSE', 500)
    }

    return rawResponse
  },

  performBatch: async (request, { payload: payloads, settings, logger }) => {
    const { multiStatus } = await upsertProfiles(request, payloads, settings, logger)
    return multiStatus
  }
}

// Process single or batch profile upserts using bulk API
async function upsertProfiles(
  request: RequestClient,
  payloads: Payload[],
  settings: Settings,
  logger?: Logger
): Promise<{ rawResponse: ModifiedResponse | undefined; multiStatus: MultiStatusResponse }> {
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
    // Validate: at least one identifier is required and at least two total fields (identifiers + traits) must be mapped
    const identifiers = payload.profile_identifiers || {}
    const identifierCount = Object.values(identifiers).filter((v) => v !== undefined && v !== null).length
    const hasIdentifier = identifierCount > 0

    const traits = (
      payload.profile_traits && typeof payload.profile_traits === 'object' ? payload.profile_traits : {}
    ) as Record<string, unknown>
    const traitCount = Object.values(traits).filter((v) => v !== undefined && v !== null).length
    const totalFields = identifierCount + traitCount

    if (!hasIdentifier) {
      invalidIndices.push(index)
      validationErrors.set(index, 'Profile must contain at least one identifier')
      return
    }

    if (totalFields < 2) {
      invalidIndices.push(index)
      validationErrors.set(
        index,
        'Profile must contain at least two total fields (identifiers + traits). It could be two identifiers, or one identifier and one trait.'
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

  // If all profiles are invalid, return MultiStatusResponse with per-profile errors
  if (validProfiles.length === 0) {
    logger?.warn?.('No valid profiles to import. All profiles failed validation.')

    const multiStatusResponse = new MultiStatusResponse()
    invalidIndices.forEach((index) => {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage: validationErrors.get(index) || 'Invalid profile'
      })
    })
    return { rawResponse: undefined, multiStatus: multiStatusResponse }
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
        errormessage: validationErrors.get(index) || 'Invalid profile'
      })
    })

    return { rawResponse: response, multiStatus: multiStatusResponse }
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

  // Merge identifiers into their respective trait groups (these are authoritative and will override any conflicting keys)
  if (payload.profile_identifiers && typeof payload.profile_identifiers === 'object') {
    const identifiers = payload.profile_identifiers as Record<string, unknown>
    const invalidIdentifierKeys: string[] = []
    Object.entries(identifiers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const match = key.match(/^([^.]+)\.\$\.(.+)$/)
        if (match) {
          const traitGroupName = match[1]
          const traitName = match[2]
          if (!traitGroups[traitGroupName]) {
            traitGroups[traitGroupName] = {}
          }
          traitGroups[traitGroupName][traitName] = value
        } else {
          invalidIdentifierKeys.push(key)
        }
      }
    })

    if (invalidIdentifierKeys.length > 0) {
      throw new PayloadValidationError(
        `Invalid identifier key format detected. The following keys do not match the expected format: ${invalidIdentifierKeys.join(
          ', '
        )}. ` + `Expected format: "TraitGroupName.$.traitName" (e.g., "Contact.$.email", "Contact.$.phone").`
      )
    }
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

type DynamicFieldResult = {
  choices: Array<{ label: string; value: string; description: string }>
  error?: { message: string; code: string }
}

// Fetch all trait group fields and return identifiers and traits separately.
// Identifiers are traits with idTypePromotion set; traits are non-identifier STRING traits.
async function fetchTraitGroupFields(
  request: RequestClient,
  settings: Settings,
  storeId: string
): Promise<{ identifiers: DynamicFieldResult; traits: DynamicFieldResult }> {
  try {
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

    const identifierChoices: DynamicFieldResult['choices'] = []
    const traitChoices: DynamicFieldResult['choices'] = []

    for (const traitGroup of traitGroupObjects) {
      const traitGroupName = traitGroup.displayName
      const traits = traitGroup.traits || {}

      Object.entries(traits).forEach(([traitName, trait]) => {
        const value = `${traitGroupName}.$.${traitName}`
        const label = `${traitGroupName}.${trait.displayName || traitName}`

        if (trait.idTypePromotion && trait.dataType === 'STRING') {
          const description = trait.description
            ? trait.description
            : `${traitGroupName} - ${trait.displayName} (${trait.idTypePromotion})`
          identifierChoices.push({ label, value, description })
        } else if (!trait.idTypePromotion && trait.dataType === 'STRING') {
          const description = trait.description
            ? trait.description
            : `${traitGroupName} - ${trait.displayName} (${trait.dataType})`
          traitChoices.push({ label, value, description })
        }
      })
    }

    return {
      identifiers: { choices: identifierChoices },
      traits: { choices: traitChoices }
    }
  } catch (error) {
    const statusCode = error?.response?.status || 'unknown'
    const errorMsg = error?.response?.data?.message || (error instanceof Error ? error.message : String(error))
    const errorResult = (fieldType: string): DynamicFieldResult => ({
      choices: [],
      error: {
        message: `Unable to fetch ${fieldType} (HTTP ${statusCode}: ${errorMsg}). You can still manually enter field names.`,
        code: 'FETCH_ERROR'
      }
    })
    return {
      identifiers: errorResult('identifiers'),
      traits: errorResult('traits')
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
