import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { baseURL, defaultRequestParams } from '../request-params'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Starts a new GWEN user session. Provide the users IP and userAgent to improve the GWEN experience',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      label: 'User ID',
      description: "The user's id",
      type: 'string',
      format: 'uuid',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    ip: {
      label: 'User IP Address',
      description: 'The IP address of the user',
      type: 'string',
      format: 'ipv4',
      required: false,
      default: {
        '@path': '$.context.ip'
      }
    },
    userAgent: {
      label: 'User Agent',
      description: 'The userAgent string of the user',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.userAgent'
      }
    }
  },
  perform: async (request, { payload }) => {
    // Make your partner api request here!
    const { userId, ip, userAgent } = payload

    await request(baseURL, {
      ...defaultRequestParams,
      body: JSON.stringify({
        operationName: 'UserSession',
        query: `mutation UserSession($userId: UUID!, $session: UserSessionInput) {
          userSession(userId: $userId, data: $session) {
            timestamp
          }
        }`,
        variables: {
          userId,
          session: {
            ip,
            userAgent
          }
        }
      })
    })
  }
}

export default action
