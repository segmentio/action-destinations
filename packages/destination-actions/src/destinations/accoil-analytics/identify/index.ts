import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { endpointUrl } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify a user in Accoil',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      description: 'The ID associated with the user',
      label: 'User ID',
      required: true,
      default: { '@path': '$.userId' }
    },
    email: {
      type: 'string',
      format: 'email',
      description:
        'Email addresses are highly recommended as they are often used to identify users across multiple platforms. (Highly Recommended)',
      label: 'Email',
      default: { '@path': '$.traits.email' }
    },
    name: {
      type: 'string',
      label: 'Name',
      description:
        'Providing a name helps display users in Accoil. If no name is provided, the email address is displayed instead. (Highly Recommended)',
      default: { '@path': '$.traits.name' }
    },
    role: {
      type: 'string',
      label: 'Role',
      description: "Describes the user's role in your product such as Admin, Owner, Team Member. (Suggested) ",
      default: { '@path': '$.traits.role' }
    },
    accountStatus: {
      type: 'string',
      label: 'Account Status',
      description:
        'Capturing the account status on the user can be helpful to segment users. Possible options include: Free, Trial, Paid, Cancelled (Suggested) ',
      default: { '@path': '$.traits.accountStatus' }
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      label: 'Created at',
      description:
        'When was the user created, including this ensures that tenure tracking is accurate. (Highly Recommended) ',
      default: { '@path': '$.traits.createdAt' }
    },
    traits: commonFields.traits,
    timestamp: commonFields.timestamp
  },
  perform: (request, { payload, settings }) => {
    const traits = {
      ...(payload.traits ?? {}),
      email: payload.email,
      name: payload.name,
      role: payload.role,
      createdAt: payload.createdAt,
      accountStatus: payload.accountStatus
    }

    return request(endpointUrl(settings.api_key), {
      method: 'post',
      json: {
        type: 'identify',
        userId: payload.userId,
        traits: traits,
        timestamp: payload.timestamp
      }
    })
  }
}

export default action
