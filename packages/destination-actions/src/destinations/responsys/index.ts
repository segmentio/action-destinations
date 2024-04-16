import { DestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendCustomTraits from './sendCustomTraits'
import sendAudience from './sendAudience'
import upsertListMember from './upsertListMember'

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
      },
      textValue: {
        label: 'Text Value',
        description:
          "Value of incoming preferred email format data. For example, 'T' may represent a preference for Text formatted email.",
        type: 'string'
      },
      matchOperator: {
        label: 'Match Operator',
        description: 'Operator to join match column names.',
        type: 'string',
        choices: [
          { label: 'None', value: 'NONE' },
          { label: 'And', value: 'AND' }
        ],
        default: 'AND'
      },
      optoutValue: {
        label: 'Optout Value',
        description:
          "Value of incoming opt-out status data that represents an optout status. For example, 'O' may represent an opt-out status.",
        type: 'string'
      },
      rejectRecordIfChannelEmpty: {
        label: 'Reject Record If Channel Empty',
        description:
          'String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. See [Responsys API docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-members-post.html)',
        type: 'string'
      },
      defaultPermissionStatus: {
        label: 'Default Permission Status',
        description: 'This value must be specified as either OPTIN or OPTOUT. defaults to OPTOUT.',
        type: 'string',
        required: true,
        choices: [
          { label: 'Opt In', value: 'OPTIN' },
          { label: 'Opt Out', value: 'OPTOUT' }
        ],
        default: 'OPTOUT'
      },
      htmlValue: {
        label: 'Preferred Email Format',
        description:
          "Value of incoming preferred email format data. For example, 'H' may represent a preference for HTML formatted email.",
        type: 'string'
      },
      optinValue: {
        label: 'Optin Value',
        description:
          "Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.",
        type: 'string'
      }
    },
    testAuthentication: (_, { settings }) => {
      if (settings.baseUrl.startsWith('https://'.toLowerCase())) {
        return Promise.resolve('Success')
      } else {
        throw new IntegrationError('Responsys endpoint URL must start with https://', 'INVALID_URL', 400)
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
        body: `user_name=${encodeURIComponent(settings.username)}&password=${encodeURIComponent(
          settings.userPassword
        )}&auth_type=password`
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
    sendCustomTraits,
    upsertListMember
  }
}

export default destination
