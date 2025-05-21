import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { defaultValues, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { adAccountId } from './fbca-properties'
import sync from './sync'
import { getApiVersion } from './fbca-operations'

const EXTERNAL_ID_KEY = 'id'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Facebook Custom Audiences (Actions)',
  slug: 'actions-facebook-custom-audiences',
  mode: 'cloud',
  description: 'The Facebook Custom Audiences destination.',

  authentication: {
    scheme: 'oauth2',
    fields: {
      retlAdAccountId: adAccountId
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  audienceFields: {
    engageAdAccountId: adAccountId,
    audienceDescription: {
      type: 'string',
      label: 'Description',
      description: 'A brief description about your audience.',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const adAccountId = createAudienceInput.audienceSettings?.engageAdAccountId
      const audienceDescription = createAudienceInput.audienceSettings?.audienceDescription
      const { features, statsContext } = createAudienceInput

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!adAccountId) {
        throw new IntegrationError('Missing ad account ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const createAudienceUrl = `https://graph.facebook.com/${getApiVersion(
        features,
        statsContext
      )}/act_${adAccountId}/customaudiences`
      const payload = {
        name: audienceName,
        description: audienceDescription || '',
        subtype: 'CUSTOM',
        customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
      }

      const response = await request(createAudienceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(payload)
      })

      const r = await response.json()
      if (!r[EXTERNAL_ID_KEY]) {
        throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: r[EXTERNAL_ID_KEY]
      }
    },
    async getAudience(request, getAudienceInput) {
      const { features, statsContext } = getAudienceInput
      const getAudienceUrl = `https://graph.facebook.com/${getApiVersion(features, statsContext)}/${
        getAudienceInput.externalId
      }`

      const response = await request(getAudienceUrl, { method: 'GET' })

      const r = await response.json()
      if (!r[EXTERNAL_ID_KEY]) {
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
      }

      if (getAudienceInput.externalId !== r[EXTERNAL_ID_KEY]) {
        throw new IntegrationError("Couldn't find audience", 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: r[EXTERNAL_ID_KEY]
      }
    }
  },
  actions: {
    sync
  },
  presets: [
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'sync',
      mapping: defaultValues(sync.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'sync',
      mapping: defaultValues(sync.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export default destination
