import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendCustomTraits from './sendCustomTraits'
import sendAudience from './sendAudience'

interface RefreshTokenResponse {
  authToken: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Responsys (Actions)',
  slug: 'actions-responsys',
  mode: 'cloud',
  description: 'Send Profile List Member and Profile Extension Table data to Responsys.',
  authentication: {
    scheme: 'oauth2',
    fields: {
      username: {
        label: 'Username',
        description: 'Responsys username',
        type: 'string',
        required: true
      },
      userPassword: {
        label: 'Password',
        description: 'Responsys password',
        type: 'string',
        required: true
      },
      baseUrl: {
        label: 'Responsys endpoint URL',
        description:
          "Responsys endpoint URL. Refer to Responsys documentation for more details. Must start with 'HTTPS://'. See [Responsys docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/GetStarted/Authentication/auth-endpoints-rest.htm).",
        type: 'string',
        format: 'uri',
        required: true
      },
      profileListName: {   
        label: 'List Name',
        description: "Name of the Profile Extension Table's Contact List.",
        type: 'string',
        required: true
      },
      profileExtensionTable: {  
        label: 'PET Name',
        description: 'Profile Extension Table (PET) Name. Required if using the "Send Custom Traits" Action.',
        type: 'string',
        required: false
      },
      insertOnNoMatch: {
        label: 'Insert On No Match',
        description: 'Indicates what should be done for records where a match is not found.',
        type: 'boolean',
        default: true, 
        required: true
      },
      matchColumnName1: {
        label: 'First Column Match',
        description: 'First match column for determining whether an insert or update should occur.',
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
        description: 'Second match column for determining whether an insert or update should occur.',
        type: 'string',
        choices: [
          { label: 'RIID', value: 'RIID' },
          { label: 'CUSTOMER_ID', value: 'CUSTOMER_ID' },
          { label: 'EMAIL_ADDRESS', value: 'EMAIL_ADDRESS' },
          { label: 'MOBILE_NUMBER', value: 'MOBILE_NUMBER' },
          { label: 'EMAIL_MD5_HASH', value: 'EMAIL_MD5_HASH' },
          { label: 'EMAIL_SHA256_HASH', value: 'EMAIL_SHA256_HASH' }
        ]
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
      }
      //TODO add writeKey and Region Settings

    },
    testAuthentication: (_, { settings }) => {
      //TOTO add validation to ensure that List Name setting value is always upper cased

      if (settings.baseUrl.startsWith('https://'.toLowerCase())) {
        return Promise.resolve('Success')
      } else {
        return Promise.reject('Responsys endpoint URL must start with https://')
      }
    },
    refreshAccessToken: async (request, { settings }) => {
      const baseUrl = settings.baseUrl?.replace(/\/$/, '')
      const endpoint = `${baseUrl}/rest/api/v1.3/auth/token`

      const res = await request<RefreshTokenResponse>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `user_name=${settings.username}&password=${settings.userPassword}&auth_type=password`
      })
      return { accessToken: res.data.authToken }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        authorization: `${auth?.accessToken}`
      }
    }
  },
  actions: {
    sendAudience,
    sendCustomTraits
  }
}

export default destination
