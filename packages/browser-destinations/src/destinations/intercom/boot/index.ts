import dayjs from 'dayjs'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Boot',
  description: '',
  platform: 'web',
  fields: {
    user_id: {
      type: 'string',
      required: false,
      description: "The user's identity",
      label: 'Identity',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to Intercom',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    },
    name: {
      type: 'string',
      required: false,
      description: "User's name",
      label: 'Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    email: {
      type: 'string',
      required: false,
      description: "User's email",
      label: 'Name',
      default: {
        '@path': '$.traits.email'
      }
    },
    created_at: {
      label: 'Created At',
      description: 'A timestamp of when the person was created.',
      required: false,
      type: 'datetime',
      default: {
        '@path': '$.traits.createdAt'
      }
    }
  },
  perform: (Intercom, event) => {
    const payload = { ...event.payload }
    if (payload.created_at) {
      //change date from ISO-8601 (segment's format) to unix timestamp (intercom's format)
      payload.created_at = dayjs(payload.created_at).unix()
    }
    Intercom('boot', {
      app_id: Intercom.appId,
      ...payload
    })
  }
}

export default action
