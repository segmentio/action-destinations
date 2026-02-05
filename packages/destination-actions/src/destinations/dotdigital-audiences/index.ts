import { defaultValues, AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { VisibilityOption, CreateListJSON , CreateListResp} from './types'
import { DDListsApi } from '@segment/actions-shared'

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
    }, 
    visibility: {
      label: 'Visibility',
      description: 'The visibility of the Dotdigital list',
      type: 'string',
      required: true,
      choices: [
        { label: 'Public', value: 'Public' },
        { label: 'Private', value: 'Private' }
      ],
      default: 'Private'
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const { 
        settings: {
          api_host 
        }, 
        audienceName, 
        audienceSettings: { 
          visibility 
        } = {} 
      } = createAudienceInput

      const lists = await new DDListsApi(api_host, request).getLists()

      const exists = lists.choices.find((list: { value: string; label: string }) => list.label === audienceName)

      if(exists) {
        return { externalId: exists.value }
      }

      const url = `${api_host}/v2/address-books`
      const json: CreateListJSON = {
        name: audienceName,
        visibility: visibility as VisibilityOption
      }

      const response = await request<CreateListResp>(
        url,
        {
          method: 'POST',
          json
        }
      )
      const jsonOutput = await response.json()
      return { externalId: String(jsonOutput.id) }
    },
    async getAudience(request, getAudienceInput) {
      const { 
        settings: { 
          api_host 
        }, 
        externalId 
      } = getAudienceInput
      const lists = await new DDListsApi(api_host, request).getLists()
      const exists = lists.choices.find((list: { value: string; label: string }) => list.value === externalId.toString())
      if(!exists) {
        throw new IntegrationError(`Audience with id ${externalId} not found`, 'Not Found', 404)
      }
      return { externalId }
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
      name: 'Associated Entity Added',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_added_track'
    },
    {
      name: 'Associated Entity Removed',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_removed_track'
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

export default destination
