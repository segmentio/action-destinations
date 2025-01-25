import { RequestClient } from '@segment/actions-core/*'

import { Settings } from './generated-types'
import { RefreshTokenResponse } from './types'

export const getAuthToken = async (request: RequestClient, settings: Settings): Promise<string> => {
  const baseUrl = settings.baseUrl?.replace(/\/$/, '')
  const { data } = await request<RefreshTokenResponse>(`${baseUrl}/rest/api/v1.3/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `user_name=${encodeURIComponent(settings.username)}&password=${encodeURIComponent(
      settings.userPassword
    )}&auth_type=password`
  })

  return data.authToken
}

export const petExists = async (
  request: RequestClient,
  settings: Settings,
  computationKey: string,
  authToken: string
) => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'GET',
    skipResponseCloning: true,
    headers: {
      'Content-Type': 'application/json',
      authorization: `${authToken}`
    }
  })

  const results = response.data as { profileExtension?: { objectName: string } }[]
  return results.find(
    (item: { profileExtension?: { objectName: string } }) => item.profileExtension?.objectName === computationKey
  )
}

export const createPet = async (
  request: RequestClient,
  settings: Settings,
  audienceName: string,
  authToken: string
) => {
  const requestBody = {
    profileExtension: {
      objectName: audienceName,
      folderName: settings.defaultFolderName
    },
    fields: [
      {
        fieldName: audienceName.substring(0, 30),
        fieldType: 'STR500'
      }
    ]
  }

  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `${authToken}`
    },
    body: JSON.stringify(requestBody)
  })

  return response
}

export const getAllPets = async (
  request: RequestClient,
  settings: Settings,
  authToken: string
): Promise<{ profileExtension: { objectName: string } }[]> => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'GET',
    skipResponseCloning: true,
    headers: {
      'Content-Type': 'application/json',
      authorization: `${authToken}`
    }
  })

  return response.data as { profileExtension: { objectName: string } }[]
}
