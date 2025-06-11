import type { AudienceDestinationDefinition, ModifiedResponse } from '@segment/actions-core'
import { defaultValues, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { generate_jwt } from './utils-rt'
import updateSegment from './updateSegment'
import { gen_customer_taxonomy_payload, gen_segment_subtaxonomy_payload, update_taxonomy } from './utils-tax'
type PersonasSettings = {
  computation_id: string
  computation_key: string
  parent_id: string
}
interface RefreshTokenResponse {
  access_token: string
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Yahoo Audiences',
  slug: 'actions-yahoo-audiences',
  mode: 'cloud',
  description: 'Sync users to Yahoo Ads',
  authentication: {
    scheme: 'oauth2',
    fields: {
      mdm_id: {
        label: 'MDM ID',
        description: 'Yahoo MDM ID provided by Yahoo representative',
        type: 'string',
        required: true
      },
      engage_space_id: {
        label: 'Engage Space Id',
        description: 'Engage Space Id found in Unify > Settings > API Access',
        type: 'string',
        required: true
      },
      customer_desc: {
        label: 'Customer Description',
        description: 'Engage space name and description',
        type: 'string',
        required: false
      }
    },
    testAuthentication: async (request, { settings }) => {
      if (!process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_SECRET) {
        throw new IntegrationError('Missing Taxonomy API client secret', 'MISSING_REQUIRED_FIELD', 400)
      }
      if (!process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_ID) {
        throw new IntegrationError('Missing Taxonomy API client Id', 'MISSING_REQUIRED_FIELD', 400)
      }
      // Used to create top-level customer node
      const tx_creds = {
        tx_client_key: process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_ID,
        tx_client_secret: process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_SECRET
      }

      const body_form_data = gen_customer_taxonomy_payload(settings)
      // Throw error if engage_space_id contains special characters other then [a-zA-Z0-9] and "_" (underscore)
      // This is to prevent the user from creating a customer node with a name that is not allowed by Yahoo
      if (!/^[A-Za-z0-9_]+$/.test(settings.engage_space_id)) {
        throw new IntegrationError(
          'Invalid Engage Space Id setting. Engage Space Id can be located in Unify > Settings > API Access',
          'INVALID_GLOBAL_SETTING',
          400
        )
      } else {
        // The last 2 params are undefined because statsContext.statsClient and statsContext.tags are not available testAuthentication()
        return await update_taxonomy('', tx_creds, request, body_form_data, undefined, undefined)
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      // Refresh Realtime API token (Oauth2 client_credentials)
      let rt_client_key = ''
      let rt_client_secret = ''
      // Added try-catch in a case we don't update the vault
      try {
        rt_client_key = JSON.parse(auth.clientId)['rt_api']
        rt_client_secret = JSON.parse(auth.clientSecret)['rt_api']
      } catch (err) {
        rt_client_key = auth.clientId
        rt_client_secret = auth.clientSecret
      }

      const jwt = generate_jwt(rt_client_key, rt_client_secret)
      const res: ModifiedResponse<RefreshTokenResponse> = await request<RefreshTokenResponse>(
        'https://id.b2b.yahooinc.com/identity/oauth2/access_token',
        {
          method: 'POST',
          body: new URLSearchParams({
            client_assertion: jwt,
            client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            grant_type: 'client_credentials',
            scope: 'audience',
            realm: 'dataxonline'
          })
        }
      )
      const rt_access_token = res.data.access_token
      return { accessToken: rt_access_token }
    }
  },
  audienceFields: {
    placeholder: {
      type: 'boolean',
      label: 'Placeholder Setting',
      description: 'Placeholder field to allow the audience to be created. Do not change this',
      default: true
    }
    // This is a required object, but we don't need to define any fields
    // Placeholder setting will be removed once we make AudienceSettings optional
  },
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },

    async createAudience(request, createAudienceInput) {
      // @ts-ignore type is not defined, and we will define it later
      const personas = createAudienceInput.personas as PersonasSettings
      if (!personas) {
        throw new IntegrationError('Missing computation parameters: Id and Key', 'MISSING_REQUIRED_FIELD', 400)
      }

      const engage_space_id = createAudienceInput.settings?.engage_space_id
      const audience_id = personas.computation_id
      const audience_key = personas.computation_key

      const statsClient = createAudienceInput?.statsContext?.statsClient
      const statsTags = createAudienceInput?.statsContext?.tags

      if (!engage_space_id) {
        throw new IntegrationError('Create Audience: missing setting "Engage space Id" ', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_SECRET) {
        throw new IntegrationError('Missing Taxonomy API client secret', 'MISSING_REQUIRED_FIELD', 400)
      }
      if (!process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_ID) {
        throw new IntegrationError('Missing Taxonomy API client Id', 'MISSING_REQUIRED_FIELD', 400)
      }

      const input = {
        segment_audience_id: audience_id,
        segment_audience_key: audience_key,
        engage_space_id: engage_space_id
      }

      const body_form_data = gen_segment_subtaxonomy_payload(input)

      const tx_creds = {
        tx_client_key: process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_ID,
        tx_client_secret: process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_SECRET
      }

      await update_taxonomy(engage_space_id, tx_creds, request, body_form_data, statsClient, statsTags)

      return { externalId: audience_id }
    },
    async getAudience(_, getAudienceInput) {
      // getAudienceInput.externalId represents audience ID that was created in createAudience
      const audience_id = getAudienceInput.externalId
      if (!audience_id) {
        throw new IntegrationError('Missing audience_id value', 'MISSING_REQUIRED_FIELD', 400)
      }
      return { externalId: audience_id }
    }
  },

  actions: {
    updateSegment
  },
  presets: [
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'updateSegment',
      mapping: defaultValues(updateSegment.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'updateSegment',
      mapping: defaultValues(updateSegment.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}
export default destination
