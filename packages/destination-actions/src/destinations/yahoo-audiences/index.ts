import type { AudienceDestinationDefinition, ModifiedResponse } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { generate_jwt } from './utils-rt'
import updateSegment from './updateSegment'
import createSegment from './createSegment'
import createCustomerNode from './createCustomerNode'
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
      taxonomy_client_key: {
        label: 'Yahoo Taxonomy API client Id',
        description: 'Taxonomy API client Id. Required to update Yahoo taxonomy',
        type: 'string',
        required: true
      },
      taxonomy_client_secret: {
        label: 'Yahoo Taxonomy API client secret',
        description: 'Taxonomy API client secret. Required to update Yahoo taxonomy',
        type: 'password',
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
    // TODO check this function!
    testAuthentication: async (request, { settings }) => {
      // Used to create top-level customer node
      console.log('testAuthentication')
      const tx_creds = {
        tx_client_key: settings.taxonomy_client_key,
        tx_client_secret: settings.taxonomy_client_secret
      }
      console.log('tx_creds', tx_creds)
      const data = {
        engage_space_id: settings.engage_space_id,
        customer_desc: settings.customer_desc
      }

      const body_form_data = gen_customer_taxonomy_payload(settings, data)
      console.log(body_form_data)
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
      // Oauth1 credentials
      const tx_client_key = JSON.parse(auth.clientId)['tax_api']
      const tx_client_secret = JSON.parse(auth.clientSecret)['tax_api']
      const rt_access_token = res.data.access_token
      const creds = {
        // Oauth1
        tx: {
          tx_client_key: tx_client_key,
          tx_client_secret: tx_client_secret
        },
        // Oauth2
        rt: rt_access_token
      }
      const creds_base64 = Buffer.from(JSON.stringify(creds)).toString('base64')
      return { accessToken: creds_base64 }
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
        { value: 'email_maid', label: 'Send email and/or MAID' }
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
      const audience_id = createAudienceInput.audienceSettings?.audience_id
      const audience_key = createAudienceInput.audienceSettings?.audience_key
      const engage_space_id = createAudienceInput.settings?.engage_space_id
      const identifier = createAudienceInput.audienceSettings?.identifier
      // TODO: add checks to confirm audienceId is actual Engage Audience Id
      if (!audience_id) {
        throw new IntegrationError('Missing audience Id value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!audience_key) {
        throw new IntegrationError('Missing audience key value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!engage_space_id) {
        throw new IntegrationError('Missing Engage space Id type value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const input = {
        segment_audience_id: audience_id,
        segment_audience_key: audience_key,
        engage_space_id: engage_space_id,
        identifier: identifier
      }

      const body_form_data = gen_segment_subtaxonomy_payload(input)

      const tx_creds = {
        tx_client_key: createAudienceInput.settings.taxonomy_client_key,
        tx_client_secret: createAudienceInput.settings.taxonomy_client_secret
      }

      const update_taxonomy_result = await update_taxonomy(engage_space_id, tx_creds, request, body_form_data)

      console.log(update_taxonomy_result)
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
    updateSegment,
    createSegment,
    createCustomerNode
  }
}
export default destination
