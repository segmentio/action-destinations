import { IntegrationError, RequestClient } from '@segment/actions-core'

import { prepareOfflineDataJobCreationParams, buildAddListOperation, buildRemoveListOperation } from './listManagement'
import { UpdateHandlerPayload, ListAddOperation, ListRemoveOperation, ListOperation } from './types'
import type { AudienceSettings } from './generated-types'
import { OFFLINE_DATA_JOB_URL, MULTI_STATUS_ERROR_CODES_ENABLED } from './constants'

export const buildHeaders = (audienceSettings: AudienceSettings | undefined) => {
  if (!audienceSettings) {
    throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
  }

  return {
    // @ts-ignore -- Given the custom headers we have, we are option out from using extendRequest.
    Authorization: `Bearer ${audienceSettings?.authToken}`,
    'Content-Type': 'application/json',
    'Login-Customer-Id': `products/${audienceSettings.accountType}/customers/${audienceSettings?.advertiserId}`
  }
}

const createOfflineDataJob = async (request: RequestClient, audienceSettings: AudienceSettings, listId: string) => {
  const advertiserDataJobUrl = `${OFFLINE_DATA_JOB_URL.replace(
    'advertiserID',
    audienceSettings?.advertiserId
  )}:create`.replace('accountType', audienceSettings.accountType)
  const dataJobParams = prepareOfflineDataJobCreationParams(audienceSettings?.listType, listId)
  const r = await request(advertiserDataJobUrl, {
    method: 'POST',
    json: dataJobParams,
    headers: buildHeaders(audienceSettings)
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

const populateOfflineDataJob = async (
  request: RequestClient,
  payload: UpdateHandlerPayload[],
  operation: ListOperation,
  jobId: string,
  audienceSettings: AudienceSettings
) => {
  const operations: ListAddOperation[] & ListRemoveOperation[] = []
  payload.forEach((p) => {
    // Create and remove operations can't be mixed in the same job request.
    // However, the payloads are fairly similar so we can use the same function to build the operations.
    if (operation === 'add') {
      operations.push(buildAddListOperation(p))
    } else {
      operations.push(buildRemoveListOperation(p))
    }
  })

  // TODO: How to handle multi status errors?
  const advertiserDataJobUrl = `${OFFLINE_DATA_JOB_URL.replace(
    'advertiserID',
    audienceSettings?.advertiserId
  )}/${jobId}:${operation}Operations`.replace('accountType', audienceSettings.accountType)

  const r = await request(advertiserDataJobUrl, {
    method: 'POST',
    headers: buildHeaders(audienceSettings),
    json: {
      operations: operations,
      enablePartialFailure: MULTI_STATUS_ERROR_CODES_ENABLED
    }
  })

  if (r.status !== 200) {
    throw new Error(`Failed to populate offline data job: ${r.text}`)
  }
}

const performOfflineDataJob = async (request: RequestClient, jobId: string, audienceSettings: AudienceSettings) => {
  const advertiserDataJobUrl = `${OFFLINE_DATA_JOB_URL.replace(
    'advertiserID',
    audienceSettings?.advertiserId
  )}/${jobId}:run`.replace('accountType', audienceSettings.accountType)

  const r = await request(advertiserDataJobUrl, {
    method: 'POST',
    headers: buildHeaders(audienceSettings)
  })

  if (r.status !== 200) {
    throw new Error(`Failed to run offline data job: ${r.text}`)
  }
}

export const handleUpdate = async (
  request: RequestClient,
  audienceSettings: AudienceSettings,
  payload: UpdateHandlerPayload[],
  operation: 'add' | 'remove'
) => {
  let jobId

  // Should we bundle everythin into a transaction in order to handle error in a better way?
  try {
    jobId = await createOfflineDataJob(request, audienceSettings, payload[0]?.external_audience_id)
  } catch (error) {
    if (error.response.status === 401) {
      throw new IntegrationError(error.response.data.error.message, 'AUTHENTICATION_ERROR', 401)
    }

    if (error.response.status === 400) {
      throw new IntegrationError(error.response.data.error.message, 'INTEGRATION_ERROR', 400)
    }

    const errorMessage = JSON.parse(error.response.content).error.message
    throw new IntegrationError(errorMessage, 'RETRYABLE_ERROR', 500)
  }

  try {
    await populateOfflineDataJob(request, payload, operation, jobId, audienceSettings)
  } catch (error) {
    if (error.response.status === 400) {
      throw new IntegrationError(error.response.data.error.message, 'INTEGRATION_ERROR', 400)
    }

    // Any error here would discard the entire batch, therefore, we shall retry everything.
    const errorMessage = JSON.parse(error.response.content).error.message
    throw new IntegrationError(errorMessage, 'RETRYABLE_ERROR', 500)
  }

  // Successful batches return 200. Bogus ones return an error but at this point we can't examine individual errors.
  await performOfflineDataJob(request, jobId, audienceSettings)
}
