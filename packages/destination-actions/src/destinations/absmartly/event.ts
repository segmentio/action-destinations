import { InputField, JSONObject, ModifiedResponse, RequestClient } from '@segment/actions-core'
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

export interface DefaultPayload {
  publishedAt: string | number
  agent?: string
  application?: string
}

export const defaultEventFields: Record<string, InputField> = {
  publishedAt: {
    label: 'Event Sent Time',
    type: 'datetime',
    required: true,
    description:
      'Exact timestamp when the event was sent (measured by the client clock). Must be an ISO 8601 date-time string, or a Unix timestamp (milliseconds) number',
    default: {
      '@path': '$.sentAt'
    }
  },
  agent: {
    label: 'Agent',
    type: 'string',
    required: false,
    description: 'Optional agent identifier that originated the event. Used to identify which SDK generated the event.',
    default: 'segment'
  },
  application: {
    label: 'Application',
    type: 'string',
    required: false,
    description:
      'Optional application name that originated this event. Must exist if not empty. Create Applications in the Settings -> Applications section of the ABsmartly Web Console',
    default: ''
  }
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
