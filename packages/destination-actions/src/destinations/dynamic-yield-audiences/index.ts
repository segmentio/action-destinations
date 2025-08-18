import { AudienceDestinationDefinition, defaultValues, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { getCreateAudienceURL, hashAndEncodeToInt, getDataCenter, getSectionId } from './helpers'
import { v4 as uuidv4 } from '@lukeed/uuid'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Dynamic Yield by Mastercard Audiences',
  slug: 'actions-dynamic-yield-audiences',
  mode: 'cloud',
  description: 'Sync [Segment Audiences](https://segment.com/docs/engage/audiences/) to Dynamic Yield by Mastercard.',
  audienceFields: {
    audience_name: {
      type: 'string',
      label: 'Audience Name',
      required: true,
      description: 'Provide a name for your Audience to be displayed in Dynamic Yield by Mastercard.'
    },
    identifier_type: {
      type: 'string',
      label: 'Identifier Type',
      required: true,
      description:
        'The type of Identifier to send to Dynamic Yield by Mastercard. E.g. `email`, `anonymousId`, `userId` or any other custom identifier. Make sure to configure the identifier in the `Customized Setup` below so that it is sent to Dynamic Yield by Mastercard.'
    }
  },
  authentication: {
    scheme: 'custom',
    fields: {
      sectionId: {
        label: 'Section ID',
        description: 'Dynamic Yield by Mastercard Section ID',
        type: 'string',
        required: true
      },
      accessKey: {
        label: 'Access Key',
        description: 'Description to be added',
        type: 'password',
        required: true
      }
    }
  },
  extendRequest({ settings }) {
    let secret = undefined

    const dataCenter = getDataCenter(settings.sectionId)

    switch (dataCenter) {
      case 'US':
        secret = process.env.ACTIONS_DYNAMIC_YIELD_AUDIENCES_US_CLIENT_SECRET
        break
      case 'EU':
        secret = process.env.ACTIONS_DYNAMIC_YIELD_AUDIENCES_EU_CLIENT_SECRET
        break
      case 'DEV':
        secret = process.env.ACTIONS_DYNAMIC_YIELD_AUDIENCES_DEV_CLIENT_SECRET
        break
    }

    if (secret === undefined) {
      throw new IntegrationError(
        'Missing Dynamic Yield by Mastercard Audiences Client Secret',
        'MISSING_REQUIRED_FIELD',
        400
      )
    }

    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: secret
      }
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },

    async createAudience(request, createAudienceInput) {
      const { settings, audienceSettings: { audience_name } = {}, personas } = createAudienceInput

      if (!audience_name) {
        throw new IntegrationError('Missing Audience Name', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!personas) {
        throw new IntegrationError('Missing computation parameters: Id and Key', 'MISSING_REQUIRED_FIELD', 400)
      }

      const audience_id = hashAndEncodeToInt(personas.computation_id)

      const json = {
        type: 'audience_subscription_request',
        id: uuidv4(),
        timestamp_ms: new Date().getTime(),
        account: {
          account_settings: {
            sectionId: getSectionId(settings.sectionId),
            connectionKey: settings.accessKey
          }
        },
        audience_id: audience_id, // must be sent as an integer
        audience_name: audience_name,
        action: 'add'
      }

      const dataCenter = getDataCenter(settings.sectionId)

      const response = await request(getCreateAudienceURL(dataCenter), {
        method: 'POST',
        json
      })
      const responseData = await response.json()

      if (!responseData.id) {
        throw new IntegrationError(
          `Failed to create Audience in Dynamic Yield by Mastercard - responseData.id null or undefined`,
          'DYNAMIC_YIELD_AUDIENCE_CREATION_FAILED',
          400
        )
      }

      return {
        externalId: String(audience_id) // must be returned as a string
      }
    },
    async getAudience(_, getAudienceInput) {
      return {
        // retrieves the value set by the createAudience() function call
        externalId: getAudienceInput.externalId
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
      mapping: {
        ...defaultValues(syncAudience.fields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'syncAudience',
      mapping: {
        ...defaultValues(syncAudience.fields)
      },
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export default destination
