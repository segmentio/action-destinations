import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { CREATE_LIST_URL } from './constants'
import { CreateAudienceReq, CreateAudienceResp } from './types'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'SendGrid Lists (Actions)',
  slug: 'actions-sendgrid-audiences',
  mode: 'cloud',
  description: 'Sync Segment Engage Audiences to Sengrid Lists.',
  authentication: {
    scheme: 'custom',
    fields: {
      sendGridApiKey: {
        label: 'API Key',
        type: 'password',
        description: 'The Api key for your SendGrid account.',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      return request('https://api.sendgrid.com/v3/user/account')
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.sendGridApiKey}`,
        Accept: 'application/json'
      }
    }
  },
  audienceFields: {
    listName: {
      label: 'List Name',
      description: 'A list name to create in Sendgrid. If not provided the Segment Audience name will be used.',
      type: 'string',
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const response = await request<CreateAudienceResp>(CREATE_LIST_URL, {
        method: 'POST',
        throwHttpErrors: false,
        json: {
          name: createAudienceInput?.audienceSettings?.listName ?? createAudienceInput.audienceName
        } as CreateAudienceReq
      })
      const json = await response.json()
      return { externalId: json.id }
    },
    async getAudience(_, getAudienceInput) {
      return {
        externalId: getAudienceInput.externalId
      }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
