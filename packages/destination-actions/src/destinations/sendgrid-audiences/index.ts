import { AudienceDestinationDefinition, RequestClient, IntegrationError, defaultValues } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { GET_LIST_URL, CREATE_LIST_URL } from './constants'
import { GetListsResp, GetListByIDResp, CreateAudienceReq, CreateAudienceResp } from './types'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'SendGrid Lists (Actions)',
  slug: 'actions-sendgrid-audiences',
  mode: 'cloud',
  description: 'Sync users to Sengrid Lists.',
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
      const name = createAudienceInput?.audienceSettings?.listName ?? createAudienceInput.audienceName
      const id = await getAudienceIdByName(request, name)
      if (id) {
        return { externalId: id }
      } else {
        const response = await request(CREATE_LIST_URL, {
          method: 'POST',
          throwHttpErrors: false,
          json: {
            name
          } as CreateAudienceReq
        })
        const json: CreateAudienceResp = await response.json()
        return { externalId: json.id }
      }
    },
    async getAudience(_, getAudienceInput) {
      const id = await getAudienceIdById(_, getAudienceInput.externalId)
      if (id) {
        return {
          externalId: getAudienceInput.externalId
        }
      } else {
        throw new IntegrationError(
          `Audience with externalId ${getAudienceInput.externalId} not found`,
          'GET_AUDIENCE_ERROR',
          404
        )
      }
    }
  },

  actions: {
    syncAudience
  },
  presets: [
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export async function getAudienceIdByName(request: RequestClient, name: string): Promise<string | undefined> {
  const response = await request(GET_LIST_URL, {
    method: 'GET',
    throwHttpErrors: false
  })
  const json: GetListsResp = await response.json()
  return json.result.find((list) => list.name === name)?.id ?? undefined
}

export async function getAudienceIdById(request: RequestClient, externalId: string): Promise<string | undefined> {
  const response = await request(`${GET_LIST_URL}/${externalId}`, {
    method: 'GET',
    throwHttpErrors: false
  })
  const json: GetListByIDResp = await response.json()
  return json.id === externalId ? externalId : undefined
}

export default destination
