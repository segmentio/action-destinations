import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { getValidationURL } from './helpers'

import syncAudience from './syncAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Dynamic Yield Audiences',
  slug: 'actions-dynamic-yield-audiences',
  mode: 'cloud',
  description: 'Sync [Segment Audiences](https://segment.com/docs/engage/audiences/) to Dynamic Yield.',
  authentication: {
    scheme: 'custom',
    fields: {
      sectionId: {
        label: 'Section ID',
        description: '7 digit number ... description to be added',
        type: 'string',
        required: true
      },
      dataCenter: {
        label: 'Data Center',
        description: 'description to be added',
        type: 'string',
        required: true,
        choices: [
          { label: 'US', value: 'eu' },
          { label: 'EU', value: 'com' }
        ],
        default: 'US'
      },
      accessKey: {
        label: 'Access Key',
        description: 'Description to be added',
        type: 'password',
        required: true
      },
      fullUpsertURL: {
        label: 'Full Upsert URL',
        description: 'This setting will be removed',
        type: 'string',
        required: false
      },
      fullVerifyURL: {
        label: 'Full Verify Domain',
        description: 'This setting will be removed',
        type: 'string',
        required: false
      }
    },
    testAuthentication: (request, { settings }) => {
      const URL = getValidationURL(settings)
      return request(URL, {
        method: 'post',
        json: {
          sectionId: settings.sectionId,
          dataCenter: settings.dataCenter
        }
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${settings.accessKey}`
      }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
