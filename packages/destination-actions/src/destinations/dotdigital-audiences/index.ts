import { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Dotdigital Audiences',
  slug: 'actions-dotdigital-audiences',
  mode: 'cloud',
  authentication: {
    scheme: 'basic',
    fields: {
      api_host: {
        label: 'Region',
        description: 'The region your account is in',
        type: 'string',
        choices: [
          { value: 'https://r1-api.dotdigital.com', label: 'r1' },
          { value: 'https://r2-api.dotdigital.com', label: 'r2' },
          { value: 'https://r3-api.dotdigital.com', label: 'r3' }
        ],
        default: 'https://r1-api.dotdigital.com',
        required: true
      },    
      username: {
        label: 'Username',
        description: 'Your Dotdigital username',
        type: 'string',
        required: true
      },
      password: {
        label: 'Password',
        description: 'Your Dotdigital password.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return await request(`${settings.api_host}/v2/data-fields/`)
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { Authorization: `Basic ${btoa(settings.username + ':' + settings.password)}`, 'x-ddg-integration-token': '7d1e8cff-4856-4f45-93d3-dac7377a53c2'},
      responseType: 'json'
    }
  },
  audienceFields: {
    audienceName: {
      label: 'Dotdigital List Name',
      description: 'A Dotdigital list name',
      type: 'string',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(_request, _createAudienceInput) {
      return { externalId: "test" }
    },
    async getAudience(_request, _getAudienceInput) {
      
      return { externalId: "test" }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
