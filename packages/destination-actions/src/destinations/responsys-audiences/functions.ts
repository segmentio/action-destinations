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

export const petExists = async (request: RequestClient, settings: Settings, computationKey: string) => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'GET'
  })

  const results = response.data as { profileExtension?: { objectName: string } }[]
  return results.find(
    (item: { profileExtension?: { objectName: string } }) => item.profileExtension?.objectName === computationKey
  )
}
