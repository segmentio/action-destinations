import { omit, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { URL } from '../constants'
import { UserJSON } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send User Data',
  description: 'Send user profile details to Jimo',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The unique user identifier',
      type: 'string',
      allowNull: true,
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      label: 'User email',
      description: 'The email of the user',
      type: 'string',
      allowNull: true,
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    },
    traits: {
      label: 'User Traits',
      description: 'User attributes coming from segment traits',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { payload }) => {
    const { userId, traits, email } = payload

    const restOfTraits = omit(traits || {}, ['email'])

    const json: UserJSON = {
      userId,
      ...(email ? { email } : {}),
      ...(Object.entries(restOfTraits).length > 0 ? { traits: restOfTraits } : {})
    }

    return request(URL, {
      method: 'post',
      json
    })
  }
}

export default action
