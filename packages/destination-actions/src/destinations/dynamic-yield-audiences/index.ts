import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { getCreateAudienceURL, hashAndEncodeToInt } from './helpers'
import { v4 as uuidv4 } from '@lukeed/uuid'
import { Logger } from 'ecs-logs-js'

type PersonasSettings = {
  computation_id: string
  computation_key: string
}

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
      description: 'Provide a name for your Audience to be displayed in Dynamic Yield.'
    },
    identifier_type: {
      type: 'string',
      label: 'Identifier Type',
      required: true,
      description:
        'The type of Identifier to send to Dynamic Yield. E.g. `email`, `anonymous_id`, `user_id`, or any other custom identifier. Make sure you configure the `Customized Setup` below so that your chosen include identifier is sent to Dynamic Yield.'
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
          { label: 'DEV', value: 'DEV' }, // To be hidden by feature flag later
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
      }
    }
  },
  extendRequest({ settings, logger }) {
    let secret = undefined

    switch (settings.dataCenter) {
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

    logger?.info(`actions-dynamic-yield-audiences:extendRequest: secret type: ${typeof secret}`)

    if (secret === undefined) {
      logger?.error(`actions-dynamic-yield-audiences:extendRequest: secret is undefined`)
      throw new IntegrationError('Missing Dynamic Yield Audiences Client Secret', 'MISSING_REQUIRED_FIELD', 400)
    }

    logger?.info(`actions-dynamic-yield-audiences:extendRequest: secret starts with: ${secret?.substring(0, 3)}`)

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
      const {
        settings,
        audienceSettings: { audience_name, personas } = {}
      }: {
        settings: Settings
        audienceSettings?: {
          audience_name?: string
          personas?: PersonasSettings | undefined
        }
      } = createAudienceInput

      const logger = new Logger({
        level: 'error',
        devMode: true
      })

      if (!audience_name) {
        throw new IntegrationError('Missing Audience Name', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!personas) {
        throw new IntegrationError('Missing computation parameters: Id and Key', 'MISSING_REQUIRED_FIELD', 400)
      }

      const audience_id = hashAndEncodeToInt(personas.computation_id)

      logger.info(
        `actions-dynamic-yield-audiences:createAudience: settings: ${JSON.stringify(
          settings,
          null,
          2
        )}, audience_name: ${audience_name}, personas: ${JSON.stringify(
          personas,
          null,
          2
        )}, personas.computation_id: ${audience_id}`
      )

      const json = {
        type: 'audience_subscription_request',
        id: uuidv4(),
        timestamp_ms: new Date().getTime(),
        account: {
          account_settings: {
            section_id: settings.sectionId,
            api_key: settings.accessKey
          }
        },
        audience_id: audience_id, // must be sent as an integer
        audience_name: audience_name,
        action: 'add'
      }

      logger.info(`actions-dynamic-yield-audiences:createAudience: json: ${JSON.stringify(json, null, 2)}`)

      try {
        const response = await request(getCreateAudienceURL(settings.dataCenter), {
          method: 'POST',
          json
        })
        const responseData = await response.json()

        if (!responseData.id) {
          throw new IntegrationError(
            `Failed to create Audience in Dynamic Yield - responseData.id null or undefined`,
            'DYNAMIC_YIELD_AUDIENCE_CREATION_FAILED',
            400
          )
        }

        const externalId = {
          externalId: String(audience_id) // must be returned as a string
        }

        logger.info(
          `actions-dynamic-yield-audiences:createAudience: externalId: ${JSON.stringify(externalId, null, 2)}`
        )

        return externalId
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        logger.error(`actions-dynamic-yield-audiences:createAudience: error: ${errorMessage}`)
        throw new IntegrationError(
          `Failed to create Audience in Dynamic Yield - ${errorMessage}`,
          'DYNAMIC_YIELD_AUDIENCE_CREATION_FAILED',
          400
        )
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
  }
}

export default destination
