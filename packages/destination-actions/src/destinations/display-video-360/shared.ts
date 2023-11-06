import { IntegrationError, RequestClient } from '@segment/actions-core'

import { prepareOfflineDataJobCreationParams, buildAddListOperation, buildRemoveListOperation } from './listManagement'
import type { AudienceSettings } from './generated-types'
import { OFFLINE_DATA_JOB_URL } from './constants'

import { UpdateHandlerPayload, ListAddOperation, ListRemoveOperation, ListOperation } from './types'

const MULTI_STATUS_ERROR_CODES_ENABLED = true

const createOfflineDataJob = async (request: RequestClient, audienceSettings: AudienceSettings, listId: string) => {
  const advertiserDataJobUrl = OFFLINE_DATA_JOB_URL.replace('advertiserID', audienceSettings?.advertiserId)
  const dataJobParams = prepareOfflineDataJobCreationParams(audienceSettings?.listType, listId)
  const r = await request(`${advertiserDataJobUrl}:create`, {
    method: 'POST',
    json: {
      dataJobParams
    }
  })

  if (r.status !== 200) {
    throw new Error(`Failed to create offline data job: ${r.text}`)
  }

  const response = await r.json()
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
  listType: string
) => {
  const operations: ListAddOperation[] & ListRemoveOperation[] = []
  payload.forEach((p) => {
    // Create and remove operations can't be mixed in the same job request.
    // However, the payloads are fairly similar so we can use the same function to build the operations.
    if (operation === 'add') {
      operations.push(buildAddListOperation(p, listType))
    } else {
      operations.push(buildRemoveListOperation(p, listType))
    }
  })

  const r = await request(`${OFFLINE_DATA_JOB_URL}/${jobId}:${operation}Operations`, {
    method: 'POST',
    json: {
      operations: operations,
      enablePartialFailure: MULTI_STATUS_ERROR_CODES_ENABLED
    }
  })

  if (r.status !== 200) {
    throw new Error(`Failed to populate offline data job: ${r.text}`)
  }
}

const performOfflineDataJob = async (request: RequestClient, jobId: string) => {
  const r = await request(`${OFFLINE_DATA_JOB_URL}/${jobId}:run`)
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

  try {
    jobId = await createOfflineDataJob(request, audienceSettings, payload[0]?.external_audience_id)
  } catch (error) {
    // Any error here would discard the entire batch, therefore, we shall retry everything.
    throw new IntegrationError('Unable to create data job', 'RETRYABLE_ERROR', 500)
  }

  try {
    await populateOfflineDataJob(request, payload, operation, jobId, audienceSettings.listType)
  } catch (error) {
    // Any error here would discard the entire batch, therefore, we shall retry everything.
    throw new IntegrationError('Unable to populate data job', 'RETRYABLE_ERROR', 500)
  }

  // Successful batches return 200. Bogus ones return an error but at this point we can't examine individual errors.
  await performOfflineDataJob(request, jobId)
}
