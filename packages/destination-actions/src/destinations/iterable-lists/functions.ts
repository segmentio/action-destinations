import { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { GetAudienceResp } from './types'

export async function getAudience(
  request: RequestClient,
  settings: Settings,
  audienceKey: string
): Promise<string | undefined> {
  const response = await request('https://api.iterable.com/api/lists', {
    method: 'GET',
    skipResponseCloning: true,
    headers: { 'Api-Key': settings.apiKey }
  })

  const json: GetAudienceResp = (await response.data) as GetAudienceResp
  const audience = json.lists.find((list: { id: number; name: string }) => list.name === audienceKey)
  return audience?.id.toString() ?? undefined
}

export async function createAudience(request: RequestClient, settings: Settings, audienceKey: string): Promise<string> {
  const response = await request('https://api.iterable.com/api/lists', {
    method: 'POST',
    headers: { 'Api-Key': settings.apiKey },
    json: {
      name: audienceKey
    }
  })
  const audience = await response.json()
  return audience.listId
}