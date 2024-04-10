import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { getCreateAudienceURL } from './helpers'
import { v4 as uuidv4 } from '@lukeed/uuid'
import { IDENTIFIER_TYPES } from './constants'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Dynamic Yield Audiences',
  slug: 'actions-dynamic-yield-audiences',
  mode: 'cloud',
  description: 'Sync [Segment Audiences](https://segment.com/docs/engage/audiences/) to Dynamic Yield.',
  audienceFields: {
    audience_name: {
      type: 'string',
      label: 'Audience Name',
      required: true,
      description:
        'Provide a name for your Audience which will display in Dynamic Yield. If left empty Segment will send the snake_cased Engage Audience name.'
    },
    audience_id: {
      type: 'string',
      label: 'Audience ID',
      required: true,
      description: 'Required: Provide a random unique ID for your Audience which will display in Dynamic Yield.'
    }
  },
  authentication: {
    scheme: 'custom',
    fields: {
      sectionId: {
        label: 'Section ID',
        description: 'Dynamic Yield Section ID',
        type: 'string',
        required: true
      },
      dataCenter: {
        label: 'Data Center',
        description: 'Dynamic Yield Data Center',
        type: 'string',
        required: true,
        choices: [
          { label: 'DEV', value: 'DEV' },
          { label: 'US', value: 'US' },
          { label: 'EU', value: 'EU' }
        ],
        default: 'DEV'
      },
      accessKey: {
        label: 'Access Key',
        description: 'Description to be added',
        type: 'password',
        required: true
      },
      identifier_type: {
        label: 'Identifier Type',
        description: "The type of identifier being used to identify the user in Dynamic Yield. Segment hashes the identifier before sending to Dynamic Yield.",
        type: 'string',
        required: true,
        choices: [
          {label: IDENTIFIER_TYPES.EMAIL, value: IDENTIFIER_TYPES.EMAIL},
          {label: IDENTIFIER_TYPES.SEGMENT_USER_ID, value: IDENTIFIER_TYPES.SEGMENT_USER_ID},
          {label: IDENTIFIER_TYPES.SEGMENT_ANONYMOUS_ID, value: IDENTIFIER_TYPES.SEGMENT_ANONYMOUS_ID}
        ],
        default: 'Email'
      }
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
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },

    async createAudience(request, createAudienceInput) {
      const { settings , audienceName } = createAudienceInput
      const audienceSettings = createAudienceInput.audienceSettings as AudienceSettings
      const { audience_id , audience_name} = audienceSettings
       
      try {
        const response = await request(getCreateAudienceURL(settings.dataCenter), {
          method: 'POST',
          json: {
            type : "audience_subscription_request",
            id: uuidv4(),
            timestamp_ms : new Date().getTime(),
            account : {
              account_settings : {
                section_id : settings.sectionId,
                api_key : settings.accessKey
              }
            },
            audience_id : audience_id,
            audience_name :  audience_name ?? audienceName,
            action : "add"
          }
        })
        const responseData = await response.json()
        return {
          externalId: responseData.id
        }
      } 
      catch (e) {
        throw new IntegrationError("Failed to create Audience in Dynamic Yield", 'DYNAMIC_YIELD_AUDIENCE_CREATION_FAILED', 400)
      }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
