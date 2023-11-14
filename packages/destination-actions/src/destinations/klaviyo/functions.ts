import { RequestClient } from '@segment/actions-core'
import { API_URL } from './config'
import { ProfileData, listData } from './types'

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

export async function getProfile(request: RequestClient, email: string) {
  try {
    const profileId = await request(`${API_URL}/profiles/?filter=equals(email,"${email}")`, {
      method: 'GET'
    })
    return profileId
  } catch (error) {
    throw new Error('An error occurred while processing the request')
  }
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
  return profile
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
