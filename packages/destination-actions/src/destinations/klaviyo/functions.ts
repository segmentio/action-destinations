import { APIError, RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import { API_URL, REVISION_DATE } from './config'
import {
  KlaviyoAPIError,
  ListIdResponse,
  ProfileData,
  listData,
  ImportJobPayload,
  Profile,
  GetProfileResponse,
  SubscriptionData,
  SubProfile,
  KlaviyoJobStatusResponse,
  KlaviyoImportJobData,
  SubProfilePayload
} from './types'
import { Payload } from './upsertProfile/generated-types'
import { ModifiedResponse } from '@segment/actions-core/*'

export async function getListIdDynamicData(request: RequestClient): Promise<DynamicFieldResponse> {
  try {
    const result: ListIdResponse = await request(`${API_URL}/lists/`, {
      method: 'get'
    })
    const choices = JSON.parse(result.content).data.map((list: { id: string; attributes: { name: string } }) => {
      return { value: list.id, label: list.attributes.name }
    })
    return {
      choices
    }
  } catch (err) {
    return {
      choices: [],
      nextPage: '',
      error: {
        message: (err as APIError).message ?? 'Unknown error',
        code: (err as APIError).status + '' ?? 'Unknown error'
      }
    }
  }
}

export async function addProfileToList(request: RequestClient, id: string, list_id: string | undefined) {
  const listData: listData = {
    data: [
      {
        type: 'profile',
        id: id
      }
    ]
  }
  const list = await request(`${API_URL}/lists/${list_id}/relationships/profiles/`, {
    method: 'POST',
    json: listData
  })
  return list
}

export async function removeProfileFromList(request: RequestClient, ids: string[], list_id: string) {
  const listData: listData = {
    data: ids.map((id) => ({ type: 'profile', id }))
  }

  const response = await request(`${API_URL}/lists/${list_id}/relationships/profiles/`, {
    method: 'DELETE',
    json: listData
  })

  return response
}

export async function createProfile(
  request: RequestClient,
  email: string | undefined,
  external_id: string | undefined
) {
  try {
    const profileData: ProfileData = {
      data: {
        type: 'profile',
        attributes: {
          email,
          external_id
        }
      }
    }

    const profile = await request(`${API_URL}/profiles/`, {
      method: 'POST',
      json: profileData
    })
    const rs = await profile.json()
    return rs.data.id
  } catch (error) {
    const { response } = error as KlaviyoAPIError
    if (response.status == 409) {
      const rs = await response.json()
      return rs.errors[0].meta.duplicate_profile_id
    }
  }
}

export function buildHeaders(authKey: string) {
  return {
    Authorization: `Klaviyo-API-Key ${authKey}`,
    Accept: 'application/json',
    revision: REVISION_DATE,
    'Content-Type': 'application/json'
  }
}

export const createImportJobPayload = (profiles: Payload[], listId?: string): { data: ImportJobPayload } => ({
  data: {
    type: 'profile-bulk-import-job',
    attributes: {
      profiles: {
        data: profiles.map(({ list_id, enable_batching, batch_size, ...attributes }) => ({
          type: 'profile',
          attributes
        }))
      }
    },
    ...(listId
      ? {
          relationships: {
            lists: {
              data: [{ type: 'list', id: listId }]
            }
          }
        }
      : {})
  }
})

export const sendImportJobRequest = async (
  request: RequestClient,
  importJobPayload: { data: ImportJobPayload }
): Promise<ModifiedResponse<KlaviyoImportJobData>> => {
  return await request(`${API_URL}/profile-bulk-import-jobs/`, {
    method: 'POST',
    headers: {
      revision: '2023-10-15.pre'
    },
    json: importJobPayload
  })
}

export async function getProfiles(
  request: RequestClient,
  emails: string[] | undefined,
  external_ids: string[] | undefined
): Promise<string[]> {
  const profileIds: string[] = []

  if (external_ids?.length) {
    const filterId = `external_id,["${external_ids.join('","')}"]`
    const response = await request(`${API_URL}/profiles/?filter=any(${filterId})`, {
      method: 'GET'
    })
    const data: GetProfileResponse = await response.json()
    profileIds.push(...data.data.map((profile: Profile) => profile.id))
  }

  if (emails?.length) {
    const filterEmail = `email,["${emails.join('","')}"]`
    const response = await request(`${API_URL}/profiles/?filter=any(${filterEmail})`, {
      method: 'GET'
    })
    const data: GetProfileResponse = await response.json()
    profileIds.push(...data.data.map((profile: Profile) => profile.id))
  }

  return Array.from(new Set(profileIds))
}

export async function pollKlaviyoJobStatus(
  request: RequestClient,
  jobId: string,
  interval = 10000, // Poll every 10 seconds by default
  timeout = 300000 // Timeout after 5 minutes by default
): Promise<KlaviyoJobStatusResponse> {
  const startTime = Date.now()
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const response: KlaviyoJobStatusResponse = await request(`${API_URL}/profile-bulk-import-jobs/${jobId}/`, {
          method: 'GET',
          headers: {
            revision: '2023-10-15.pre'
          }
        })
        const parsedData = JSON.parse(response.data as unknown as string)
        const jobStatus = parsedData.data.attributes.status

        if (jobStatus === 'complete') {
          resolve(parsedData)
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Polling timed out'))
        } else {
          setTimeout(checkStatusWrapper, interval)
        }
      } catch (error) {
        reject(error)
      }
    }
    const checkStatusWrapper = () => {
      checkStatus().catch(reject)
    }

    checkStatusWrapper()
  })
}

export async function subscribeProfiles(
  request: RequestClient,
  profiles: SubProfile | SubProfile[],
  customSource = 'Marketing Event'
) {
  if (!Array.isArray(profiles)) {
    profiles = [profiles]
  }

  const profileSubscriptions = profiles.map((profile) => {
    const profileData: SubProfilePayload = {
      type: 'profile',
      attributes: {}
    }

    if (profile.email) {
      profileData.attributes.email = profile?.email
    }

    if (profile.phone_number) {
      profileData.attributes.phone_number = profile?.phone_number
    }

    return profileData
  })

  const subData: SubscriptionData = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        custom_source: customSource,
        profiles: {
          data: profileSubscriptions
        }
      }
    }
  }

  const listId = profiles[0].list_id
  if (listId) {
    subData.data.relationships = {
      list: {
        data: {
          type: 'list',
          id: listId
        }
      }
    }
  }

  await request(`${API_URL}/profile-subscription-bulk-create-jobs/`, {
    method: 'POST',
    json: subData
  })
}
