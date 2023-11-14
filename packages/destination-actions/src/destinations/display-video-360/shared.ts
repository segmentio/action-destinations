import { IntegrationError, RequestClient, StatsContext } from '@segment/actions-core'

import { prepareOfflineDataJobCreationParams, buildAddListOperation, buildRemoveListOperation } from './listManagement'
import { UpdateHandlerPayload, ListAddOperation, ListRemoveOperation, ListOperation } from './types'
import type { AudienceSettings, Settings } from './generated-types'
import { OFFLINE_DATA_JOB_URL, MULTI_STATUS_ERROR_CODES_ENABLED } from './constants'
import { handleRequestError } from './errors'

const isValidPhoneNumber = (value: string): boolean => {
  const e164Regex = /^\+?[1-9]\d{1,14}$/
  return e164Regex.test(value)
}

const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(value)
}

function isValidGAIDorIDFA(id: string): boolean {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  return uuidRegex.test(id)
}

// You need to specify the app_id property and set upload_key_type to MOBILE_ADVERTISING_ID prior to using a Customer list for customer matching with mobile device IDs.
const isValidIdentifier = (key: string, value: string): boolean => {
  switch (key) {
    case 'hashedPhoneNumber':
      return isValidPhoneNumber(value)
    case 'hashedEmail':
      return isValidEmail(value)
    case 'mobileId':
      return isValidGAIDorIDFA(value)
    case 'publisherProvidedId':
      return true
    default:
      return false
  }
}

export const buildHeaders = (audienceSettings: AudienceSettings | undefined, settings: Settings) => {
  if (!audienceSettings || !settings) {
    throw new IntegrationError('Bad Request', 'INVALID_REQUEST_DATA', 400)
  }

  return {
    Authorization: `Bearer ${settings?.oauth?.accessToken}`,
    'Content-Type': 'application/json',
    'Login-Customer-Id': `products/${audienceSettings.accountType}/customers/${audienceSettings?.advertiserId}`
  }
}

const createOfflineDataJob = async (
  request: RequestClient,
  audienceSettings: AudienceSettings,
  listId: string,
  settings: Settings
) => {
  const advertiserDataJobUrl = `${OFFLINE_DATA_JOB_URL.replace(
    'advertiserID',
    audienceSettings?.advertiserId
  )}:create`.replace('accountType', audienceSettings.accountType)
  const dataJobParams = prepareOfflineDataJobCreationParams(audienceSettings?.listType, listId)
  const r = await request(advertiserDataJobUrl, {
    method: 'POST',
    json: dataJobParams,
    headers: buildHeaders(audienceSettings, settings)
  })

  if (r.status !== 200) {
    throw new Error(`Failed to create offline data job: ${r.text}`)
  }

  const response = await r.json()

  // TODO: Consider caching this job ID for a period of time
  const jobId = response.resourceName.split('/').pop()

  if (!jobId) {
    throw new Error(`Failed to create offline data job: ${r.text}`)
  }

  return jobId
}

// There are no limits on the number of operations you can add to a single job.
// However, for optimal processing, Google recommends adding up to 10,000 identifiers in a single call
// to the OfflineUserDataJobService.AddOfflineUserDataJobOperations method
// up to 1,000,000 identifiers to a single job
const populateOfflineDataJob = async (
  request: RequestClient,
  payload: UpdateHandlerPayload[],
  operation: ListOperation,
  jobId: string,
  audienceSettings: AudienceSettings,
  settings: Settings,
  statsContext?: StatsContext
) => {
  const operations: ListAddOperation[] & ListRemoveOperation[] = []
  payload.forEach((p) => {
    if (operation === 'add') {
      operations.push(buildAddListOperation(p))
    } else {
      operations.push(buildRemoveListOperation(p))
    }
  })

  const advertiserDataJobUrl = `${OFFLINE_DATA_JOB_URL.replace(
    'advertiserID',
    audienceSettings?.advertiserId
  )}/${jobId}:${operation}Operations`.replace('accountType', audienceSettings.accountType)

  const r = await request(advertiserDataJobUrl, {
    method: 'POST',
    headers: buildHeaders(audienceSettings, settings),
    json: {
      operations: operations,
      enablePartialFailure: MULTI_STATUS_ERROR_CODES_ENABLED
    }
  })

  if (r.status !== 200) {
    throw new Error(`Failed to populate offline data job: ${r.text}`)
  }

  let partialFailureCount = 0
  const response = await r.json()
  // If MULTI_STATUS_ERROR_CODES_ENABLED is true, we need to check for partial failures.
  // The API will return 200 even if there are partial failures.
  // The payloads that failed won't be retried.
  // Jobs expire and there's no API to delete them so no cleanup is required.
  if (MULTI_STATUS_ERROR_CODES_ENABLED && response.partialFailureError) {
    partialFailureCount = response?.partialFailureError?.details[0].errors.length
    statsContext?.statsClient?.incr(`updateAudience.discard.${operation}`, partialFailureCount, statsContext?.tags)
  }

  // if the job is empty, we don't need to run it
  if (payload.length - partialFailureCount === 0) {
    return { status: 204 }
  }

  return { status: 200 }
}

const performOfflineDataJob = async (
  request: RequestClient,
  jobId: string,
  audienceSettings: AudienceSettings,
  settings: Settings
) => {
  const advertiserDataJobUrl = `${OFFLINE_DATA_JOB_URL.replace(
    'advertiserID',
    audienceSettings?.advertiserId
  )}/${jobId}:run`.replace('accountType', audienceSettings.accountType)

  const r = await request(advertiserDataJobUrl, {
    method: 'POST',
    headers: buildHeaders(audienceSettings, settings)
  })

  if (r.status !== 200) {
    throw new Error(`Failed to run offline data job: ${r.text}`)
  }
}

// By discarding invalid identifiers, we can avoid creating a job that will fail.
const discardInvalidIdentifiers = (payload: UpdateHandlerPayload[]): UpdateHandlerPayload[] => {
  const validIdentifiers = payload.filter((p) => {
    const value = p.identifier_value
    const key = p.user_identifier

    if (isValidIdentifier(key, value)) {
      return true
    }

    return false
  })

  return validIdentifiers
}

// Avoid simultaneously running multiple OfflineUserDataJob processes that modify the same Customer list
// Doing so can result in a CONCURRENT_MODIFICATION error since multiple jobs are not permitted to operate
// on the same list at the same time. Note that this does not apply to adding operations to an existing job,
// which can be done at any time BEFORE the job is started.
export const handleUpdate = async (
  request: RequestClient,
  audienceSettings: AudienceSettings,
  payload: UpdateHandlerPayload[],
  operation: 'add' | 'remove',
  settings: Settings,
  statsContext: StatsContext | undefined
) => {
  let jobId

  try {
    let discardCount = payload.length
    // The API supports partial
    payload = discardInvalidIdentifiers(payload)
    discardCount = discardCount - payload.length

    statsContext?.statsClient?.incr(`updateAudience.discard.${operation}`, discardCount, statsContext?.tags)

    jobId = await createOfflineDataJob(request, audienceSettings, payload[0]?.external_audience_id, settings)

    const updateResults = await populateOfflineDataJob(
      request,
      payload,
      operation,
      jobId,
      audienceSettings,
      settings,
      statsContext
    )
    if (updateResults.discardCount === payload.length) {
      // Do not run empty jobs. Let them expire.
      return { status: 200, message: 'success' }
    }

    await performOfflineDataJob(request, jobId, audienceSettings, settings)
    statsContext?.statsClient?.incr(`updateAudience.success.${operation}`, 1, statsContext?.tags)

    return {
      status: 200,
      message: 'success'
    }
  } catch (error) {
    throw handleRequestError(error)
  }
}
