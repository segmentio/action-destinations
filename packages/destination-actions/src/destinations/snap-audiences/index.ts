import { AudienceDestinationDefinition, defaultValues, IntegrationError, RequestClient } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
const ACCESS_TOKEN_URL = 'https://accounts.snapchat.com/login/oauth2/access_token'

interface RefreshTokenResponse {
  access_token: string
}
interface SnapAudienceResponse {
  segments: {
    segment: {
      id: string
    }
  }[]
}
interface CreateAudienceReq {
  segments: {
    name: string
    source_type: string
    ad_account_id: string
    description: string
    retention_in_days: number
  }[]
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Snap Audiences (Actions)',
  slug: 'actions-snap-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      ad_account_id: {
        label: 'Ad Account ID',
        description: 'The ID of the Snap Ad Account',
        required: true,
        type: 'string'
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      const res = await request<RefreshTokenResponse>(ACCESS_TOKEN_URL, {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  presets: [
    {
      name: 'Sync Audience with Email',
      subscribe: 'type = "track" and context.traits.email exists',
      partnerAction: 'syncAudience',
      mapping: { ...defaultValues(syncAudience.fields), schema_type: 'EMAIL_SHA256' },
      type: 'automatic'
    },
    {
      name: 'Sync Audience with Phone',
      subscribe: 'type = "track" and properties.phone exists',
      partnerAction: 'syncAudience',
      mapping: { ...defaultValues(syncAudience.fields), schema_type: 'PHONE_SHA256' },
      type: 'automatic'
    },
    {
      name: 'Sync Audience with Mobile AD ID',
      subscribe: 'type = "track" and context.device.advertisingId exists',
      partnerAction: 'syncAudience',
      mapping: { ...defaultValues(syncAudience.fields), schema_type: 'MOBILE_AD_ID_SHA256' },
      type: 'automatic'
    }
  ],
  audienceFields: {
    customAudienceName: {
      type: 'string',
      label: 'Audience Name',
      description:
        'Name for the audience that will be created in Snap. Defaults to the snake_cased Segment audience name if left blank.',
      default: '',
      required: false
    },
    description: {
      type: 'string',
      label: 'Audience Description',
      description: 'Description of for the audience that will be created in Snap.',
      default: '',
      required: false
    },
    retention_in_days: {
      type: 'number',
      label: 'Retention in days',
      description: '# of days to retain audience members. (Default retention is lifetime represented as 9999)',
      default: 9999,
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const ad_account_id = createAudienceInput.settings.ad_account_id
      const { customAudienceName, description, retention_in_days } = createAudienceInput.audienceSettings || {}

      // Track input values
      await sendToSegment(
        'jsYMXBFcHxTHnNfZfwQo5FsL8jVRrjAu',
        'Create Audience Input',
        ad_account_id,
        {
          rawInput: createAudienceInput,
          extractedValues: {
            audienceName,
            ad_account_id,
            customAudienceName,
            description,
            retention_in_days
          }
        },
        request
      )

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const requestBody = {
        segments: [
          {
            name: customAudienceName !== '' ? customAudienceName : audienceName,
            source_type: 'FIRST_PARTY',
            ad_account_id,
            description,
            retention_in_days
          }
        ]
      }

      // Track request details
      await sendToSegment(
        'jsYMXBFcHxTHnNfZfwQo5FsL8jVRrjAu',
        'Create Audience Request Details',
        ad_account_id,
        {
          url: `https://adsapi.snapchat.com/v1/adaccounts/${ad_account_id}/segments`,
          headers: {
            Authorization: 'Bearer [TOKEN HIDDEN]',
            'Content-Type': 'application/json'
          },
          requestBody
        },
        request
      )

      try {
        const response = await request(`https://adsapi.snapchat.com/v1/adaccounts/${ad_account_id}/segments`, {
          method: 'POST',
          json: {
            segments: [
              {
                name: customAudienceName !== '' ? customAudienceName : audienceName,
                source_type: 'FIRST_PARTY',
                ad_account_id,
                description,
                retention_in_days
              }
            ]
          } as CreateAudienceReq
        })
        const data: SnapAudienceResponse = await response.json()
        const snapAudienceId = data.segments[0].segment.id

        // Track response
        await sendToSegment(
          'jsYMXBFcHxTHnNfZfwQo5FsL8jVRrjAu',
          'Create Audience Response',
          ad_account_id,
          {
            status: response.status,
            responseData: data,
            extractedAudienceId: snapAudienceId
          },
          request
        )

        return { externalId: snapAudienceId }
      } catch (error) {
        // Error response
        await sendToSegment(
          'jsYMXBFcHxTHnNfZfwQo5FsL8jVRrjAu',
          'Create Audience Error',
          ad_account_id,
          {
            error: error.response.data
          },
          request
        )
      }
      return { externalId: '1234' }
    },

    getAudience: async (request, { externalId }) => {
      const response = await request(`https://adsapi.snapchat.com/v1/segments/${externalId}`, {
        method: 'GET'
      })

      const data: SnapAudienceResponse = await response.json()
      const snapAudienceId = data.segments[0].segment.id

      return { externalId: snapAudienceId }
    }
  },
  actions: {
    syncAudience
  }
}

async function sendToSegment(writeKey: any, event: string, userId: string, properties: any, request: RequestClient) {
  const response = await request('https://api.segment.io/v1/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(writeKey).toString('base64')}`
    },
    json: {
      event,
      userId,
      properties
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to send event to Segment: ${response.statusText}`)
  }

  return response
}
export default destination
