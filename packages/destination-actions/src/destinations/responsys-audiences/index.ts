import { IntegrationError, AudienceDestinationDefinition, DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'

import type { AudienceSettings, Settings } from './generated-types'
import syncAudience from './syncAudience'
import { createPet, getAllPets, getAuthToken, petExists } from './functions'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Responsys Audiences',
  slug: 'actions-responsys-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
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
      },
      optinValue: {
        label: 'Optin Value',
        description:
          "Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.",
        type: 'string',
        default: 'I'
      },
      optoutValue: {
        label: 'Optout Value',
        description:
          "Value of incoming opt-out status data that represents an optout status. For example, 'O' may represent an opt-out status.",
        type: 'string',
        default: 'O'
      },
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
      },
      rejectRecordIfChannelEmpty: {
        label: 'Reject Record If Channel Empty',
        description:
          'String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. See [Responsys API docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-members-post.html)',
        type: 'string'
      },
      segmentWriteKey: {
        label: 'Segment Source WriteKey',
        description: "Optionally forward Responses from Segment's requests to Responsys to a Segment Source.",
        type: 'string',
        required: false
      },
      segmentWriteKeyRegion: {
        label: 'Segment WriteKey Region',
        description:
          'Segment Region to forward responses from Responsys to. Segment Source WriteKey must also be populated',
        type: 'string',
        choices: [
          { label: 'US', value: 'US' },
          { label: 'EU', value: 'EU' }
        ],
        required: false,
        default: 'US'
      }
    },
    testAuthentication: async (request, { settings }) => {
      if (!settings.baseUrl.startsWith('https://'.toLowerCase())) {
        throw new IntegrationError('Responsys endpoint URL must start with https://', 'INVALID_URL', 400)
      }

      const authToken = await getAuthToken(request, settings)
      return Promise.resolve(authToken ? true : false)
    },
    refreshAccessToken: async (request, { settings }) => {
      const authToken = await getAuthToken(request, settings)
      return { accessToken: authToken }
    }
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
    async createAudience(request, { settings, personas, statsContext }) {
      // Update statistics tags and sends a call metric to Datadog. Ensures that datadog is informed 'createAudience' operation was invoked
      const statsName = 'createAudience'
      const { statsClient, tags: statsTags } = statsContext || {}
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      // Validate required fields and throws errors if any are missing.
      const audienceName =
        personas?.computation_key ||
        (settings as unknown as { personas: { computation_key: string } }).personas?.computation_key

      if (!audienceName) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      // Get access token
      const authToken = await getAuthToken(request, settings)

      const petAlreadyExists = await petExists(request, settings, audienceName, authToken)
      if (!petAlreadyExists) {
        await createPet(request, settings, audienceName, authToken)
      }

      return { externalId: audienceName }
    },
    async getAudience(request, { settings, externalId, statsContext }) {
      // Update statistics tags and sends a call metric to Datadog.
      // Ensures that Datadog is informed 'getAudience' operation was invoked.
      const statsName = 'getAudience'
      const { statsClient, tags: statsTags } = statsContext || {}
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      // Get access token
      const authToken = await getAuthToken(request, settings)
      const allPets: { profileExtension: { objectName: string } }[] = await getAllPets(request, settings, authToken)

      const correspondingAudience = allPets.find(
        (pet: { profileExtension: { objectName: string } }) => pet.profileExtension.objectName === externalId
      )

      if (!correspondingAudience) {
        statsTags?.push('error:missing-audience')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Audience not found', 'MISSING_AUDIENCE', 400)
      }

      return { externalId }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        authorization: `${auth?.accessToken}`
      },
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    }
  },

  actions: {
    syncAudience
  }
}

export default destination
