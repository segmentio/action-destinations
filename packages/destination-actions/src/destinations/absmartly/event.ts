import { JSONObject, ModifiedResponse, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { PublishRequestUnit } from './unit'
import { PublishRequestAttribute } from './attribute'
import { PublishRequestGoal } from './goal'
import { Data } from 'ws'

export interface PublishRequestEvent {
  publishedAt: number
  units: PublishRequestUnit[]
  goals?: PublishRequestGoal[]
  exposures?: JSONObject[]
  attributes?: PublishRequestAttribute[]
}

export function sendEvent(
  request: RequestClient,
  settings: Settings,
  event: PublishRequestEvent,
  agent?: string,
  application?: string
): Promise<ModifiedResponse<Data>> {
  agent = agent?.trim() ?? ''
  application = application?.trim() ?? ''

  const headers: Record<string, string> = {
    'X-Agent': agent.length > 0 ? agent : 'segment'
  }

  if (application !== '') {
    headers['X-Application'] = application
    headers['X-Application-Version'] = '0'
  }

  return request(`${settings.collectorEndpoint}/context`, {
    method: 'put',
    headers,
    json: event
  })
}
