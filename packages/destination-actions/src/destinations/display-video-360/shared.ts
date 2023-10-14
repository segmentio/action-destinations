import type { AudienceSettings } from '../generated-types'
import { OFFLINE_DATA_JOB_URL } from './constants'
import { RequestClient } from '@segment/actions-core'
type ListOperation = 'add' | 'remove'

import type { Payload } from './generated-types'

const createOfflineDataJob = async (request: RequestClient, audienceId: string) => {
  const r = await request(`${OFFLINE_DATA_JOB_URL}:create`, {
    method: 'POST',
    json: {
      job: {
        type: 'DATA_MANAGEMENT_PLATFORM_USER_LIST',
        dataManagementPlatformUserListMetadata: {
          userList: audienceId
        }
      }
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
  payload: Payload,
  operation: ListOperation,
  jobId: string
) => {
  const operationPerId = payload.userIdentifiers.map((identifier: string) => {
    return {
      operations: [
        {
          create: {
            userIdentifiers: [{ publisher_provided_id: identifier }] // TODO: Will depend on matcher
          }
        }
      ]
    }
  })

  const r = await request(`${OFFLINE_DATA_JOB_URL}/${jobId}:${operation}Operations`, {
    method: 'POST',
    json: {
      ...operationPerId,
      enablePartialFailure: true
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
  payload: Payload,
  operation: 'add' | 'remove'
) => {
  const jobId = await createOfflineDataJob(request, audienceSettings.audienceId)
  await populateOfflineDataJob(request, payload, operation, jobId)
  await performOfflineDataJob(request, jobId)
}
