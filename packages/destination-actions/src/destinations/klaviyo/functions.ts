import { RequestClient, DynamicFieldResponse, APIError } from '@segment/actions-core'
import { API_URL, REVISION_DATE } from './config'
import { GetListResultContent, ImportJobPayload } from './types'
import { Settings } from './generated-types'
import { Payload } from './upsertProfile/generated-types'

export async function getListIdDynamicData(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
  try {
    const result = await request(`${API_URL}/lists/`, {
      method: 'get',
      headers: {
        Authorization: `Klaviyo-API-Key ${settings.api_key}`,
        Accept: 'application/json',
        revision: REVISION_DATE
      },
      skipResponseCloning: true
    })
    const parsedContent = JSON.parse(result.content) as GetListResultContent
    const choices = parsedContent.data.map((list: { id: string; attributes: { name: string } }) => {
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

export async function addProfileToList(request: RequestClient, profileId: string, listId: string) {
  const listData = {
    data: [
      {
        type: 'profile',
        id: profileId
      }
    ]
  }

  await request(`${API_URL}/lists/${listId}/relationships/profiles/`, {
    method: 'POST',
    json: listData
  })
}

export const createImportJobPayload = (profiles: Payload[], listId?: string): { data: ImportJobPayload } => ({
  data: {
    type: 'profile-bulk-import-job',
    attributes: {
      profiles: {
        data: profiles.map(({ list_id, enable_batching, ...attributes }) => ({
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

export const sendImportJobRequest = async (request: RequestClient, importJobPayload: { data: ImportJobPayload }) => {
  return await request(`${API_URL}/profile-bulk-import-jobs/`, {
    method: 'POST',
    headers: {
      revision: '2023-10-15.pre'
    },
    json: importJobPayload
  })
}
