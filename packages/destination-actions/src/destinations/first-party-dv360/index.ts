import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'

import addToList from './addToList'
import { createAudienceRequest, getAudienceRequest } from './functions'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'First Party Dv360',
  slug: 'actions-first-party-dv360',
  mode: 'cloud',
  audienceFields: {
    advertiserId: {
      type: 'string',
      label: 'Advertiser ID',
      required: true,
      description:
        'The ID of your advertiser, used throughout Display & Video 360. Use this ID when you contact Display & Video 360 support to help our teams locate your specific account.'
    },
    audienceType: {
      type: 'string',
      label: 'Audience Type',
      choices: [
        { label: 'CUSTOMER MATCH CONTACT INFO', value: 'CUSTOMER_MATCH_CONTACT_INFO' },
        { label: 'CUSTOMER MATCH DEVICE ID', value: 'CUSTOMER_MATCH_DEVICE_ID' }
      ],
      required: true,
      description: 'The type of the audience.'
    },
    description: {
      type: 'string',
      label: 'Description',
      required: false,
      description: 'The description of the audience.'
    },
    appId: {
      type: 'string',
      label: 'App ID',
      required: false,
      description:
        'The appId matches with the type of the mobileDeviceIds being uploaded. **Required for CUSTOMER_MATCH_DEVICE_ID Audience Types.**'
    },
    membershipDurationDays: {
      type: 'string',
      label: 'Membership Duration Days',
      required: true,
      description:
        'The duration in days that an entry remains in the audience after the qualifying event. If the audience has no expiration, set the value of this field to 10000. Otherwise, the set value must be greater than 0 and less than or equal to 540.'
    },
    token: {
      type: 'string',
      label: 'Auth Token',
      required: true,
      description: 'temp until we build authentication flow'
    }
  },

  authentication: {
    scheme: 'custom',
    fields: {},
    testAuthentication: (_request) => {
      return { status: 'succeeded' }
    }
  },

  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },

    createAudience: async (_request, createAudienceInput) => {
      // Extract values from input
      const { audienceName, audienceSettings, statsContext } = createAudienceInput
      const advertiserId = audienceSettings?.advertiserId?.trim()
      const description = audienceSettings?.description
      const membershipDurationDays = audienceSettings?.membershipDurationDays
      const audienceType = audienceSettings?.audienceType
      const appId = audienceSettings?.appId
      const token = audienceSettings?.token // Temporary token variable

      // Update statistics tags and sends a call metric to Datadog. Ensures that datadog is infomred 'createAudience' operation was invoked
      const statsName = 'createAudience'
      const { statsClient, tags: statsTags } = statsContext || {}
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      // Validate required fields and throws errors if any are missing.
      if (!audienceName) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!advertiserId) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!membershipDurationDays) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing membership duration days value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!audienceType) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing audience type value', 'MISSING_REQUIRED_FIELD', 400)
      }

      // Make API request to create the audience
      const response = await createAudienceRequest(_request, {
        advertiserId,
        audienceName,
        description,
        membershipDurationDays,
        audienceType,
        appId,
        token
      })

      // Parse and return the externalId
      const r = await response.json()
      statsClient?.incr(`${statsName}.success`, 1, statsTags)
      return {
        externalId: r.firstAndThirdPartyAudienceId
      }
    },

    getAudience: async (_request, getAudienceInput) => {
      // Extract values from input
      const { audienceSettings, statsContext } = getAudienceInput
      const audienceId = getAudienceInput.externalId
      const advertiserId = audienceSettings?.advertiserId?.trim()
      const token = audienceSettings?.token // Temporary token variable

      // Update statistics tags and sends a call metric to Datadog. Ensures that datadog is infomred 'getAudience' operation was invoked
      const statsName = 'getAudience'
      const { statsClient, tags: statsTags } = statsContext || {}
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      if (!advertiserId) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing required advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!audienceId) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Failed to retrieve audience ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      // Make API request to get audience details
      const response = await getAudienceRequest(_request, { advertiserId, audienceId, token })

      if (!response.ok) {
        // Handle non-OK responses
        statsTags?.push('error:api-request-failed')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Failed to retrieve audience details', 'API_REQUEST_FAILED', response.status)
      }

      // Parse and return the response
      const audienceData = await response.json()
      statsClient?.incr(`${statsName}.success`, 1, statsTags)
      return {
        externalId: audienceData.firstAndThirdPartyAudienceId
      }
    }
  },

  onDelete: async (_request, _) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    addToList
  }
}

export default destination
