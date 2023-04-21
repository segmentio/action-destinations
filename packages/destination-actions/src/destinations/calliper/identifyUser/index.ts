import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError, omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../utils/constants'
import { formatName } from '../utils/helpers'
import dayjs from '../../../lib/dayjs'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID to recognise other evens by the same user',
  defaultSubscription: 'type = "identify"',
  fields: {
    time: {
      label: 'Timestamp',
      type: 'datetime',
      description:
        'The timestamp of the event. Could be any date string/number value compatible with JavaScript Date constructor: e.g. milliseconds epoch or an ISO datetime. If time is not sent with the event, it will be set to the request time.',
      default: {
        '@path': '$.timestamp'
      }
    },
    user_id: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description: 'A distinct ID of an identified (logged in) user.',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      type: 'string',
      allowNull: true,
      description: 'A distinct ID of an unidentified (logged out) user. Device id is used if available',
      default: {
        '@path': '$.anonymousId'
      }
    },
    first_name: {
      description: "User's first name",
      label: 'First Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.firstName'
      }
    },
    last_name: {
      description: "User's last name",
      label: 'Last Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.lastName'
      }
    },
    name: {
      description: "User's full name",
      label: 'Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.name'
      }
    },
    email: {
      description: "User's email address",
      label: 'Email',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.email' },
          then: { '@path': '$.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    phone: {
      description: "User's phone number",
      label: 'Phone',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.phone'
      }
    },
    created_at: {
      description: 'The time the user signed up to your system',
      label: 'User Creation Time',
      type: 'datetime',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.createdAt' },
          then: { '@path': '$.traits.createdAt' },
          else: { '@path': '$.traits.created_at' }
        }
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      description: 'Properties to set on the user profile',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    if (!settings.companyId) {
      throw new IntegrationError('Missing company id', 'Missing required field', 400)
    }
    if (!settings.segmentKey) {
      throw new IntegrationError('Missing segment key', 'Missing required field', 400)
    }

    const datetime = payload.time
    const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()

    const name = formatName(payload.first_name, payload.last_name, payload.name)

    return await request(`${API_URL}/user/identify`, {
      method: 'post',
      json: {
        companyId: settings.companyId,
        key: settings.segmentKey,
        user: {
          time,
          user_id: payload.user_id,
          anonymous_id: payload.anonymous_id,
          created_at: payload.created_at,
          email: payload.email,
          first_name: payload.first_name,
          last_name: payload.last_name,
          name,
          phone: payload.phone,
          traits: omit(payload.traits, ['created', 'email', 'firstName', 'lastName', 'name', 'username', 'phone'])
        }
      }
    })
  }
}

export default action
