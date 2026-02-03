import { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { GetAudienceResp } from './types'
import { CONSTANTS } from './constants'

export async function getAudienceByName(
  request: RequestClient,
  settings: Settings,
  name: string
): Promise<string | undefined> {
  const response = await request(`${CONSTANTS.API_BASE_URL}${CONSTANTS.API_CUSTOM_AUDIENCE_ENDPOINT}`, {
    method: 'GET',
    skipResponseCloning: true,
    headers: { 'Api-Key': settings.apiKey }
  })

  const json: GetAudienceResp = (await response.data) as GetAudienceResp
  const audience = json.lists.find((list: { id: number; name: string }) => list.name === name)
  return audience?.id.toString() ?? undefined
}

export async function getAudienceByID(
  request: RequestClient,
  settings: Settings,
  ID: string
): Promise<string | undefined> {
  const response = await request(`${CONSTANTS.API_BASE_URL}${CONSTANTS.API_CUSTOM_AUDIENCE_ENDPOINT}`, {
    method: 'GET',
    skipResponseCloning: true,
    headers: { 'Api-Key': settings.apiKey }
  })

  const json: GetAudienceResp = (await response.data) as GetAudienceResp
  const audience = json.lists.find((list: { id: number; name: string }) => list.id.toString() === ID)
  return audience?.id.toString() ?? undefined
}

export async function createAudience(request: RequestClient, settings: Settings, name: string): Promise<string> {
  const response = await request(`${CONSTANTS.API_BASE_URL}${CONSTANTS.API_CUSTOM_AUDIENCE_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Api-Key': settings.apiKey },
    json: {
      name
    }
  })
  const audience = await response.json()
  return audience.listId
}