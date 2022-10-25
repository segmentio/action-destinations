import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import putSubscriptions from './putSubscriptions'

const destination: DestinationDefinition<Settings> = {
  name: 'Subscriptions',
  slug: 'actions-subscriptions',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      spaceWriteKey: {
        label: 'Engage Space Write Key',
        type: 'password',
        description: 'The Write Key for your segment space',
        required: false
      },
      environment: {
        label: 'Environment',
        description: 'Environment stage or production',
        type: 'string',
        required: true
      },
      spaceId: {
        label: 'Space ID',
        description: 'Space ID',
        type: 'string',
        required: true
      },
      sourceId: {
        label: 'Source ID',
        description: 'Source ID or Destination Action Project ID',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      const getApiEndpoint = (environment: string): string => {
        return `https://api.segment.build/${environment === 'production' ? 'com' : 'build'}/v1/batch`
      }
      return request(getApiEndpoint(settings.environment), {
        method: 'post',
        json: [],
        throwHttpErrors: false
      })
    }
  },
  actions: {
    putSubscriptions
  }
}

export default destination
