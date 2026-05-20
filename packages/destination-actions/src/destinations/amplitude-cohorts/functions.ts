import { Region, CreateAudienceJSON, CreateAudienceResponse, GetAudienceResponse, IDType, UserSearchResponse } from './types'
import { RequestClient, IntegrationError } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { Settings } from './generated-types'
import { endpoints, REMOVAL_AWAIT_THRESHOLD_MS } from './constants'

export function getEndpointByRegion(endpoint: keyof typeof endpoints, region?: string): string {
  return endpoints[endpoint][region as Region] ?? endpoints[endpoint]['north_america']
}

export async function createAudience(
  request: RequestClient,
  settings: Settings,
  name: string,
  id_type: IDType,
  owner_email?: string,
  user_id?: string,
  statsContext?: StatsContext
): Promise<string> {
  const { endpoint, app_id, default_owner_email } = settings
  const { statsClient, tags } = statsContext || {}
  const statsName = 'actions_amplitude_cohorts'
  const startTime = Date.now()

  if (!name) {
    statsClient?.incr(`${statsName}.create_audience.error.missing_name`, 1, tags)
    throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
  }

  if (!id_type) {
    statsClient?.incr(`${statsName}.create_audience.error.missing_id_type`, 1, tags)
    throw new IntegrationError('Missing id_type value', 'MISSING_REQUIRED_FIELD', 400)
  }

  let seedUserId: string
  if (user_id) {
    seedUserId = user_id
    statsClient?.incr(`${statsName}.create_audience.seed_user_provided`, 1, tags)
  } else {
    try {
      seedUserId = await fetchSeedUserId(request, endpoint)
      statsClient?.incr(`${statsName}.create_audience.seed_user_fetched`, 1, tags)
    } catch (e) {
      statsClient?.incr(`${statsName}.create_audience.error.seed_user_fetch_failed`, 1, tags)
      throw e
    }
  }

  const url = getEndpointByRegion('cohorts_upload', endpoint)

  const json: CreateAudienceJSON = {
    name,
    app_id,
    id_type: 'BY_USER_ID',
    ids: [seedUserId],
    owner: owner_email ?? default_owner_email,
    published: true
  }

  try {
    const response = await request<CreateAudienceResponse>(url, {
      method: 'post',
      json
    })

    const id = response?.data?.cohortId

    if (!id) {
      statsClient?.incr(`${statsName}.create_audience.error.missing_cohort_id`, 1, tags)
      throw new IntegrationError(
        'Invalid response from Amplitude Cohorts API when attempting to create new Cohort: Missing cohortId',
        'INVALID_RESPONSE',
        500
      )
    }

    statsClient?.incr(`${statsName}.create_audience.success`, 1, tags)

    const elapsed = Date.now() - startTime
    if (elapsed < REMOVAL_AWAIT_THRESHOLD_MS) {
      await removeSeedUser(request, id, endpoint, seedUserId, statsContext)
    } else {
      void removeSeedUser(request, id, endpoint, seedUserId, statsContext)
    }

    return id
  } catch (e) {
    statsClient?.incr(`${statsName}.create_audience.error.cohort_creation_failed`, 1, tags)
    throw e
  }
}

/**
 * Amplitude's Cohorts API requires at least one valid user ID in the `ids` array when creating a cohort.
 * Empty arrays are rejected. Since at cohort-creation time we don't yet have a real audience member to
 * reference, we search for any existing user in the Amplitude project to use as a temporary "seed" user.
 * This seed user is added during creation and immediately removed afterward.
 *
 * We use Amplitude's User Search API with single-digit numeric prefixes ('1', '2', '3', etc.) because
 * prefix matching is broad enough to find a user in most projects. Searches are batched in groups of 3
 * to balance parallelism against rate limits. We validate that `match.user_id` is non-null because the
 * search endpoint can return phantom matches (amplitude_id-only results with null user_id) which are not
 * valid for cohort creation.
 */
export async function fetchSeedUserId(request: RequestClient, endpoint: string): Promise<string> {
  const url = getEndpointByRegion('usersearch', endpoint)
  const batches = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']]

  for (const batch of batches) {
    const results = await Promise.all(
      batch.map(async (prefix) => {
        const response = await request<UserSearchResponse>(`${url}?user=${prefix}`)
        const matches = response?.data?.matches || []
        for (const match of matches) {
          if (match.user_id) {
            return match.user_id
          }
        }
        return undefined
      })
    )

    const found = results.find((id) => id !== undefined)
    if (found) {
      return found
    }
  }

  throw new IntegrationError(
    'Unable to fetch a seed user from Amplitude. The project must contain at least one user with a User ID.',
    'INVALID_RESPONSE',
    400
  )
}

export async function removeSeedUser(request: RequestClient, cohortId: string, endpoint: string, seedUserId: string, statsContext?: StatsContext): Promise<void> {
  const { statsClient, tags } = statsContext || {}
  const statsName = 'actions_amplitude_cohorts'
  const url = getEndpointByRegion('cohorts_membership', endpoint)

  const json = {
    cohort_id: cohortId,
    skip_invalid_ids: true,
    memberships: [{
      ids: [seedUserId],
      id_type: 'BY_NAME',
      operation: 'REMOVE'
    }]
  }

  try {
    await request(url, {
      method: 'POST',
      json
    })
    statsClient?.incr(`${statsName}.create_audience.seed_user_removal.success`, 1, tags)
  } catch {
    statsClient?.incr(`${statsName}.create_audience.seed_user_removal.error`, 1, tags)
  }
}

export async function getAudience(request: RequestClient, settings: Settings, externalId: string): Promise<void> {
  const { endpoint } = settings

  const url = `${getEndpointByRegion('cohorts_get_one', endpoint)}/${externalId}`
  const response = await request<GetAudienceResponse>(url)
  const id = response?.data?.cohort_id

  if (!id) {
    throw new IntegrationError(
      'Invalid response from Amplitude Cohorts API when attempting to get Cohort: Missing cohort_id',
      'INVALID_RESPONSE',
      500
    )
  }

  if (id !== externalId) {
    throw new IntegrationError(`Cohort with id ${externalId} not found`, 'COHORT_NOT_FOUND', 404)
  }
}
