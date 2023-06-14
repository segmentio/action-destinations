import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { BASE_URL } from '..'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post Event',
  description: 'Post a user event to IQM',
  fields: {
    data: {
      label: 'Data',
      type: 'object',
      required: false,
      description: 'The data to be sent to IQM',
      default: {
        '@path': '$.'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const { pixel_id } = settings
    if (!pixel_id) {
      throw new IntegrationError('PixelID is required', 'Misconfigured field', 400)
    }
    return request(`${BASE_URL}&pixel_id=${pixel_id}`, {
      method: 'post',
      headers: { HOST: 'postback.iqm.com', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }
}

export default action
