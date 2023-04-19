import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import { enchargeIngestAPIURL } from '../utils'
import { commonFields } from '../common-definitions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Identify a user in Encharge. This will create a new user if the user does not exist in Encharge.',
  fields: {
    user: {
      type: 'object',
      label: 'User Fields',
      description:
        'Fields to associate with the user in Encharge. Any unexisting fields will be automatically created in Encharge.',
      required: false,
      default: { '@path': '$.traits' }
    },
    email: {
      type: 'string',
      required: false,
      description: 'The email address of the user.',
      label: 'Email',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    ...omit(commonFields, 'email')
  },
  defaultSubscription: 'type = "identify"',
  perform: (request, data) => {
    const payload = {
      ...omit(data.payload, ['ip', 'userAgent', 'campaign', 'page', 'location', 'user', 'groupId']),
      context: pick(data.payload, ['ip', 'userAgent', 'campaign', 'page', 'location', 'groupId']),
      user: {
        email: data.payload.email,
        userId: data.payload.userId,
        segmentAnonymousId: data.payload.segmentAnonymousId,
        ...(data.payload.user || {}) // traits
      }
    }
    return request(enchargeIngestAPIURL, {
      method: 'post',
      json: payload
    })
  }
}

export default action
