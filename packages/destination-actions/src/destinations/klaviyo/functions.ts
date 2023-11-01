import { RequestClient, DynamicFieldResponse, APIError } from '@segment/actions-core'
import { API_URL } from './config'
import { GetProfileResponseData, ListIdResponse, ProfileData, listData } from './types'

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

export async function executeProfileList(
  request: RequestClient,
  method: 'DELETE' | 'POST',
  payload: listData,
  list_id: string
) {
  try {
    const list = await request(`${API_URL}/lists/${list_id}/relationships/profiles/`, {
      method: method,
      json: payload
    })
    return list
  } catch (error) {
    throw new Error('An error occurred while processing the request')
  }
}

export async function getProfile(request: RequestClient, email: string): Promise<GetProfileResponseData> {
  try {
    const profileId: GetProfileResponseData = await request(`${API_URL}/profiles/?filter=equals(email,"${email}")`, {
      method: 'GET'
    })
    return profileId
  } catch (error) {
    console.log(error)
    throw new Error('An error occurred while processing the request')
  }
}

export async function createProfile(request: RequestClient, email: string): Promise<GetProfileResponseData> {
  const profileData: ProfileData = {
    data: {
      type: 'profile',
      attributes: {
        email
      }
    }
  }

  const profile: GetProfileResponseData = await request(`${API_URL}/profiles/`, {
    method: 'POST',
    json: profileData
  })
  return profile
}
