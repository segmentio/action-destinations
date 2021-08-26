import { URLSearchParams } from 'url'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Map User',
  description: 'Merge two users together that would otherwise have different User IDs tracked in Amplitude.',
  defaultSubscription: 'type = "alias"',
  fields: {
    user_id: {
      label: 'User ID',
      type: 'string',
      description: 'The User ID to be associated',
      default: {
        '@path': '$.previousId'
      }
    },
    global_user_id: {
      label: 'Global User ID',
      type: 'string',
      description: 'The global User ID to associate to',
      default: {
        '@path': '$.userId'
      }
    },
    min_id_length: {
      label: 'Minimum ID Length',
      description:
        'Amplitude has a default minimum id lenght of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.',
      allowNull: true,
      type: 'integer'
    }
  },
  perform: (request, { payload, settings }) => {
    const { min_id_length } = payload
    const options = min_id_length && min_id_length > 0 ? JSON.stringify({ min_id_length }) : undefined
    return request('https://api.amplitude.com/usermap', {
      method: 'post',
      body: new URLSearchParams({
        api_key: settings.apiKey,
        mapping: JSON.stringify([payload]),
        ...(options && { options })
      })
    })
  }
}

export default action
