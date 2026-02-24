import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import { ATTRIBUTION_ENDPOINT } from './constants'
import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Attribution (Actions)',
  slug: 'actions-attribution',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      projectID: {
        label: 'Project ID',
        description: 'Your Attribution project ID.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request) => {
      return request(`${ATTRIBUTION_ENDPOINT}/check_auth`, {
        method: 'POST'
      })
    }
  },
  extendRequest({ settings }) {
    const { projectID } = settings
    return {
      headers: {
        Authorization: `Basic ${Buffer.from(projectID + ':').toString('base64')}`
      }
    }
  },
  presets: [
    {
      name: 'Send Events',
      subscribe:
        'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group" or type = "alias"',
      partnerAction: 'send',
      mapping: defaultValues(send.fields),
      type: 'automatic'
    }
  ],
  actions: {
    send
  }
}

export default destination
