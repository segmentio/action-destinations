import { APIError, RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import { API_URL } from './config'
import { KlaviyoAPIError, ListIdResponse, ProfileData, listData } from './types'

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

export async function addProfileToList(request: RequestClient, method: 'DELETE' | 'POST', id: string, list_id: string) {
  const listData: listData = {
    data: [
      {
        type: 'profile',
        id: id
      }
    ]
  }

  try {
    const list = await request(`${API_URL}/lists/${list_id}/relationships/profiles/`, {
      method: method,
      json: listData
    })
    return list
  } catch (error) {
    const { response } = error as KlaviyoAPIError
    if (response?.status === 409) {
      const content = JSON.parse(response?.content)
      const id = content?.errors[0]?.meta?.duplicate_profile_id
      listData.data[0].id = id
      const list = await request(`${API_URL}/lists/${list_id}/relationships/profiles/`, {
        method: method,
        json: listData
      })
      return list
    }
    throw new APIError('An error occured while adding profile to list', 400)
  }
}

export async function getProfile(request: RequestClient, email: string) {
  const profile = await request(`${API_URL}/profiles/?filter=equals(email,"${email}")`, {
    method: 'GET'
  })
  return profile.json()
}

export async function createProfile(request: RequestClient, email: string) {
  const profileData: ProfileData = {
    data: {
      type: 'profile',
      attributes: {
        email
      }
    }
  }

  const profile = await request(`${API_URL}/profiles/`, {
    method: 'POST',
    json: profileData
  })
  return profile.json()
}

// export async function addProfileToList(request: RequestClient, profileId: string, listId: string) {
//   const listData = {
//     data: [
//       {
//         type: 'profile',
//         id: profileId
//       }
//     ]
//   }

//   await request(`${API_URL}/lists/${listId}/relationships/profiles/`, {
//     method: 'POST',
//     json: listData
//   })
// }
