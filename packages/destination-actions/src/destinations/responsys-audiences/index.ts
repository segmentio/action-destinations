import { IntegrationError, AudienceDestinationDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'

import syncAudience from './syncAudience'
import { RefreshTokenResponse } from './types'
// import { getAuthToken } from './functions'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Responsys Audiences',
  slug: 'actions-responsys-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      baseUrl: {
        label: 'Responsys endpoint URL',
        description:
          "Responsys endpoint URL. Refer to Responsys documentation for more details. Must start with 'HTTPS://'. See [Responsys docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/GetStarted/Authentication/auth-endpoints-rest.htm).",
        type: 'string',
        format: 'uri',
        required: true
      },
      username: {
        label: 'Username',
        description: 'Responsys username',
        type: 'string',
        required: true
      },
      userPassword: {
        label: 'Password',
        description: 'Responsys password',
        type: 'password',
        required: true
      },
      profileListName: {
        label: 'Default Profile List Name',
        description: "Name of the Profile Extension Table's Contact List.",
        type: 'string',
        required: false
      },
      defaultFolderName: {
        label: 'Default Folder Name',
        description: 'Name of the folder where the Profile Extension Table is located.',
        type: 'string',
        required: false
      }
    },
    testAuthentication: async (request, { settings }) => {
      if (!settings.baseUrl.startsWith('https://'.toLowerCase())) {
        throw new IntegrationError('Responsys endpoint URL must start with https://', 'INVALID_URL', 400)
      }

      const baseUrl = settings.baseUrl?.replace(/\/$/, '')
      const endpoint = `${baseUrl}/rest/api/v1.3/auth/token`

      const res = await request<RefreshTokenResponse>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `user_name=${encodeURIComponent(settings.username)}&password=${encodeURIComponent(
          settings.userPassword
        )}&auth_type=password`
      })

      return Promise.resolve(res.data.authToken ? true : false)
    }
  },

  onDelete: async (request, { settings, payload }) => {
    console.log(request, settings, payload)
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  audienceFields: {
    insertOnNoMatch: {
      label: 'Insert On No Match',
      description: 'Indicates what should be done for records where a match is not found.',
      type: 'boolean',
      default: true,
      required: true
    },
    updateOnMatch: {
      label: 'Update On Match',
      description: 'Controls how the existing record should be updated. Defaults to Replace All.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Replace All', value: 'REPLACE_ALL' },
        { label: 'No Update', value: 'NO_UPDATE' }
      ],
      default: 'REPLACE_ALL'
    },
    matchColumnName1: {
      label: 'First Column Match',
      description: `First match column for determining whether an insert or update should occur.
                    A trailing underscore (_) is added to the match column name at the time of request 
                    to Responsys. 
                    This aligns with Responsys’ naming conventions for match columns.`,
      type: 'string',
      choices: [
        { label: 'RIID', value: 'RIID' },
        { label: 'CUSTOMER_ID', value: 'CUSTOMER_ID' },
        { label: 'EMAIL_ADDRESS', value: 'EMAIL_ADDRESS' },
        { label: 'MOBILE_NUMBER', value: 'MOBILE_NUMBER' },
        { label: 'EMAIL_MD5_HASH', value: 'EMAIL_MD5_HASH' },
        { label: 'EMAIL_SHA256_HASH', value: 'EMAIL_SHA256_HASH' }
      ],
      default: 'EMAIL_ADDRESS',
      required: true
    },
    matchColumnName2: {
      label: 'Second Column Match',
      description: `Second match column for determining whether an insert or update should occur.
                    A trailing underscore (_) is added to the match column name at the time of request 
                    to Responsys. 
                    This aligns with Responsys’ naming conventions for match columns.`,
      type: 'string',
      choices: [
        { label: 'RIID', value: 'RIID' },
        { label: 'CUSTOMER_ID', value: 'CUSTOMER_ID' },
        { label: 'EMAIL_ADDRESS', value: 'EMAIL_ADDRESS' },
        { label: 'MOBILE_NUMBER', value: 'MOBILE_NUMBER' },
        { label: 'EMAIL_MD5_HASH', value: 'EMAIL_MD5_HASH' },
        { label: 'EMAIL_SHA256_HASH', value: 'EMAIL_SHA256_HASH' }
      ],
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },
    async createAudience(request, { settings, audienceName, audienceSettings, personas, statsContext }) {
      console.log(audienceSettings, personas, request, settings)

      // Update statistics tags and sends a call metric to Datadog. Ensures that datadog is informed 'createAudience' operation was invoked
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

      // Get access token
      /* const authToken = await getAuthToken(request, settings)

      const petAlreadyExists = await petExists(request, settings, payload.pet_name)
      if (!petAlreadyExists) {
        await createPet(request, settings, payload)
      } */

      return { externalId: '123' }
    }
  },

  actions: {
    syncAudience
  }
}

export default destination
