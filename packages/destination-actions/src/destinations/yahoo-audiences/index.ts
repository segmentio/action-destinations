import type { AudienceDestinationDefinition, ModifiedResponse } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { generate_jwt } from './utils-rt'
import updateSegment from './updateSegment'
import { gen_customer_taxonomy_payload, gen_segment_subtaxonomy_payload, update_taxonomy } from './utils-tax'

interface RefreshTokenResponse {
  access_token: string
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Yahoo Audiences',
  slug: 'actions-yahoo-audiences',
  mode: 'cloud',
  description: 'Sync Segment Engage Audiences to Yahoo Ads',
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
      await update_taxonomy('', tx_creds, request, body_form_data)
    },
    refreshAccessToken: async (request, { auth }) => {
      // Refresh Realtime API token (Oauth2 client_credentials)
      const rt_client_key = JSON.parse(auth.clientId)['rt_api']
      const rt_client_secret = JSON.parse(auth.clientSecret)['rt_api']
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
    audience_id: {
      type: 'string',
      label: 'Audience Id',
      description: 'Segment Audience Id (aud_...)',
      required: true
    },
    audience_key: {
      label: 'Audience key',
      description: 'Segment Audience Key',
      type: 'string',
      required: true
    },
    identifier: {
      label: 'User Identifier',
      description: 'Specify the identifier(s) to send to Yahoo',
      type: 'string',
      required: true,
      default: 'email',
      choices: [
        { value: 'email', label: 'Send email' },
        { value: 'maid', label: 'Send MAID' },
        { value: 'phone', label: 'Send phone' },
        { value: 'email_maid', label: 'Send email and/or MAID' },
        { value: 'email_maid_phone', label: 'Send email, MAID and/or phone' },
        { value: 'email_phone', label: 'Send email and/or phone' },
        { value: 'phone_maid', label: 'Send phone and/or MAID' }
      ]
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },

    async createAudience(request, createAudienceInput) {
      // const tax_client_key = JSON.parse(auth.clientId)['tax_api']

      //engage_space_id, audience_id and audience_key will be removed once we have Payload accessible by createAudience()
      //context.personas.computation_id
      //context.personas.computation_key
      //context.personas.namespace
      const audience_id = createAudienceInput.audienceSettings?.audience_id
      const audience_key = createAudienceInput.audienceSettings?.audience_key
      const engage_space_id = createAudienceInput.settings?.engage_space_id
      const identifier = createAudienceInput.audienceSettings?.identifier
      // The 3 errors below will be removed once we have Payload accessible by createAudience()
      if (!audience_id) {
        throw new IntegrationError(
          'Create Audience: missing audience setting "audience Id"',
          'MISSING_REQUIRED_FIELD',
          400
        )
      }

      if (!audience_key) {
        throw new IntegrationError(
          'Create Audience: missing audience setting "audience key"',
          'MISSING_REQUIRED_FIELD',
          400
        )
      }

      if (!engage_space_id) {
        throw new IntegrationError('Create Audience: missing setting "Engage space Id" ', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!identifier) {
        throw new IntegrationError(
          'Create Audience: missing audience setting "Identifier"',
          'MISSING_REQUIRED_FIELD',
          400
        )
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
        engage_space_id: engage_space_id,
        identifier: identifier
      }

      const body_form_data = gen_segment_subtaxonomy_payload(input)

      const tx_creds = {
        tx_client_key: process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_ID,
        tx_client_secret: process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_SECRET
      }

      await update_taxonomy(engage_space_id, tx_creds, request, body_form_data)

      return { externalId: audience_id }
    },
    async getAudience(_, getAudienceInput) {
      const audience_id = getAudienceInput.audienceSettings?.audience_id
      if (!audience_id) {
        throw new IntegrationError('Missing audience_id value', 'MISSING_REQUIRED_FIELD', 400)
      }
      return { externalId: audience_id }
    }
  },

  actions: {
    updateSegment
  }
}
export default destination
