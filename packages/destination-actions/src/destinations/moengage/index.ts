import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import { getEndpointByRegion } from './regional-endpoints'

const destination: DestinationDefinition<Settings> = {
  name: 'Moengage (Actions)',
  slug: 'actions-moengage',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_id: {
        label: 'Api Id',
        description: 'Your Moengage API Id',
        type: 'string',
        required: true
      },
      api_key: {
        label: 'Api Key',
        description: 'Your Moengage API Key',
        type: 'string',
        required: true
      },
      region: {
        label: 'Endpoint Region',
        description: 'The region to send your data.',
        type: 'string',
        format: 'text',
        required: true,
        choices: [
          {
            label: 'DataCenter-01',
            value: 'DC_01'
          },
          {
            label: 'DataCenter-02',
            value: 'DC_02'
          },
          {
            label: 'DataCenter-03',
            value: 'DC_03'
          },
          {
            label: 'DataCenter-04',
            value: 'DC_04'
          }
        ],
        default: 'DC_01'
      }
    },
    testAuthentication: (request, { settings }) => {
      const endpoint = getEndpointByRegion(settings.region)
      return request(`${endpoint}/v1/integrations/segment/auth?appId=${settings.api_id}`, {
        method: 'get',
        headers: {
          authorization: `Basic ${Buffer.from(`${settings.api_id}:${settings.api_key}`).toString('base64')}`
        }
      })
    }
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default destination
