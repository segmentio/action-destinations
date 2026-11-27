import { PayloadValidationError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_BASE_URL, MAX_EVENT_BYTES } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Track event',
  description: 'Send a copy of a Track event to EventGuard for tracking-plan monitoring.',
  defaultSubscription: 'type = "track"',
  fields: {
    data: {
      label: 'Event',
      description: 'The complete Segment event after upstream filters and transformations. Keep the default mapping.',
      type: 'object',
      required: true,
      default: { '@path': '$.' }
    }
  },
  perform: (request, { payload }) => {
    const event = payload.data
    if (event.type !== 'track' || typeof event.event !== 'string' || !event.event.trim()) {
      throw new PayloadValidationError('EventGuard supports named Track events only.')
    }
    if (typeof event.messageId !== 'string' || !event.messageId.trim() || event.messageId.length > 256) {
      throw new PayloadValidationError('A messageId between 1 and 256 characters is required.')
    }
    if (
      event.properties !== undefined &&
      (event.properties === null || Array.isArray(event.properties) || typeof event.properties !== 'object')
    ) {
      throw new PayloadValidationError('Track properties must be an object when provided.')
    }
    if (Buffer.byteLength(JSON.stringify(event), 'utf8') > MAX_EVENT_BYTES) {
      throw new PayloadValidationError('The Track event exceeds the 64 KiB EventGuard limit.')
    }
    return request(`${API_BASE_URL}/track`, {
      method: 'POST',
      json: event,
      redirect: 'error',
      timeout: 5000
    })
  }
}

export default action
