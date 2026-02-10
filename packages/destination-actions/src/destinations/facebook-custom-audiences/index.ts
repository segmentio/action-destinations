import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { defaultValues, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { adAccountId } from './fbca-properties'
import sync from './sync'
import { API_VERSION, EXTERNAL_ID_KEY } from './constants'
import { CreateAudienceRequest, CreateAudienceResponse } from './types'

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
      const { 
        audienceName, 
        audienceSettings: { 
          engageAdAccountId: adAccountId, 
          audienceDescription 
        } = {} 
      } = createAudienceInput

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }
      if (!adAccountId) {
        throw new IntegrationError('Missing ad account ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const url = `https://graph.facebook.com/${API_VERSION}/act_${adAccountId}/customaudiences`
      
      const payload: CreateAudienceRequest = {
        name: audienceName,
        description: audienceDescription || '',
        subtype: 'CUSTOM',
        customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
      }

      let response
      try {
        response = await request<CreateAudienceResponse>(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(payload as unknown as Record<string, string>)
        })
      } catch (err) {
        let message = err.response?.content || err.message
        let userTitle: string | undefined, userMsg: string | undefined

        if (typeof message === 'string') {
          try {
            const parsed = JSON.parse(message)

            // NOTE
            // Since we know the structure of the facebook error response,
            // we can parse the fields we need to form a user-friendly error message.
            // EAMS will receive this error message and display it to the user.

            if (parsed?.error) {
              userTitle = parsed.error.error_user_title
              userMsg = parsed.error.error_user_msg || parsed.error.error_user_message
            }
          } catch (e) {
            // No-Op. Add the error message to the message variable.
          }
        }

        if (userTitle || userMsg) {
          message = `${userTitle ? userTitle + ': ' : ''}${userMsg || ''}`.trim()
        }

        throw new IntegrationError(String(message), 'CREATE_AUDIENCE_FAILED', 400)
      }

      const r = await response.json()
      if (!r[EXTERNAL_ID_KEY]) {
        throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: r[EXTERNAL_ID_KEY]
      }
    },
    async getAudience(request, getAudienceInput) {

      const { externalId } = getAudienceInput

      const url = `https://graph.facebook.com/${API_VERSION}/${externalId}`

      const response = await request(url, { method: 'GET' })

      const r = await response.json()
      if (!r[EXTERNAL_ID_KEY]) {
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
      }

      if (externalId !== r[EXTERNAL_ID_KEY]) {
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
      name: 'Associated Entity Added',
      partnerAction: 'sync',
      mapping: defaultValues(sync.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_added_track'
    },
    {
      name: 'Associated Entity Removed',
      partnerAction: 'sync',
      mapping: defaultValues(sync.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_removed_track'
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
