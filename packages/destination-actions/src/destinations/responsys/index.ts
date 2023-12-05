import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
// import {
//   enable_batching,
//   batch_size
// } from './rsp-properties'

import asyncMergeProfileListMembers from './asyncMergeProfileListMembers'

import asyncMergePetRecords from './asyncMergePetRecords'

const destination: DestinationDefinition<Settings> = {
  name: 'Responsys',
  slug: 'actions-responsys',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      username: {
        label: 'USERNAME',
        description: 'Responsys Username',
        type: 'string',
        required: true
      },
      userPassword: {
        label: 'PASSWORD',
        description: 'Responsys Password',
        type: 'string',
        required: true
      },
      authUrl: {
        label: 'AUTHENTICATION URL',
        description: 'Responsys Authentication URL',
        type: 'string',
        required: false
      } //,
      //   profileListName: {
      //   label: 'List Name',
      //   description: 'Name of the profile extension table’s parent profile list.',
      //   type: 'string',
      //   required: true
      //   },
      //   mapTemplateName: {
      //   label: 'Map Template Name',
      //   description:
      //     'The Map Template in Responsys that can be used to map Field Names of the Profile List to Column Names.',
      //   type: 'string',
      //   default: ''
      // },
      // defaultPermissionStatus: {
      //   label: 'Default Permission Status',
      //   description:
      //     'This value must be specified as either OPTIN or OPTOUT and would be applied to all of the records contained in the API call. If this value is not explicitly specified, then it is set to OPTOUT.',
      //   type: 'string',
      //   choices: [
      //     { label: 'OPTIN', value: 'OPTIN' },
      //     { label: 'OPTOUT', value: 'OPTOUT' }
      //   ],
      //   default: 'OPTOUT'
      // },
      // htmlValue: {
      //   label: 'Preferred Email Format',
      //   description:
      //     "Value of incoming preferred email format data. For example, 'H' may represent a preference for HTML formatted email.",
      //   type: 'string'
      // },
      // insertOnNoMatch: {
      //   label: 'Insert On No Match',
      //   description: 'Indicates what should be done for records where a match is not found.',
      //   type: 'boolean',
      //   choices: [
      //     { label: true, value: true },
      //     { label: false, value: false }
      //   ],
      //   default: true
      // },
      // matchColumnName1: {
      //   label: 'First Column Match',
      //   description: 'First match column for determining whether an insert or update should occur.',
      //   type: 'string',
      //   choices: [
      //     { label: 'RIID_', value: 'RIID_' },
      //     { label: 'CUSTOMER_ID_', value: 'CUSTOMER_ID_' },
      //     { label: 'EMAIL_ADDRESS_', value: 'EMAIL_ADDRESS_' },
      //     { label: 'MOBILE_NUMBER_', value: 'MOBILE_NUMBER_' },
      //     { label: 'EMAIL_MD5_HASH_', value: 'EMAIL_MD5_HASH_' },
      //     { label: 'EMAIL_SHA256_HASH_', value: 'EMAIL_SHA256_HASH_' }
      //   ]
      // },
      // matchColumnName2: {
      //   label: 'Second Column Match',
      //   description: 'Second match column for determining whether an insert or update should occur.',
      //   type: 'string',
      //   choices: [
      //     { label: 'RIID_', value: 'RIID_' },
      //     { label: 'CUSTOMER_ID_', value: 'CUSTOMER_ID_' },
      //     { label: 'EMAIL_ADDRESS_', value: 'EMAIL_ADDRESS_' },
      //     { label: 'MOBILE_NUMBER_', value: 'MOBILE_NUMBER_' },
      //     { label: 'EMAIL_MD5_HASH_', value: 'EMAIL_MD5_HASH_' },
      //     { label: 'EMAIL_SHA256_HASH_', value: 'EMAIL_SHA256_HASH_' }
      //   ]
      // },
      // matchOperator: {
      //   label: 'Match Operator',
      //   description: 'Operator to join match column names.',
      //   type: 'string',
      //   choices: [
      //     { label: 'NONE', value: 'NONE' },
      //     { label: 'AND', value: 'AND' }
      //   ]
      // },
      // optinValue: {
      //   label: 'Optin Value',
      //   description:
      //     "Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.",
      //   type: 'string'
      // },
      // optoutValue: {
      //   label: 'Optout Value',
      //   description:
      //     "Value of incoming opt-out status data that represents an optout status. For example, '0' may represent an opt-out status.",
      //   type: 'string'
      // },
      // rejectRecordIfChannelEmpty: {
      //   label: 'Reject Record If Channel Empty',
      //   description:
      //     "String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. Channel codes are 'E' (Email), 'M' (Mobile), 'P' (Postal Code). For example 'E,M' would indicate that a record that has a null for Email or Mobile Number value should be rejected. This parameter can also be set to null or to an empty string, which will cause the validation to not be performed for any channel, except if the matchColumnName1 parameter is set to EMAIL_ADDRESS_ or MOBILE_NUMBER_. When matchColumnName1 is set to EMAIL_ADDRESS_ or MOBILE_NUMBER_, then the null or empty string setting is effectively ignored for that channel.",
      //   type: 'string'
      // },
      // textValue: {
      //   label: 'Text Value',
      //   description:
      //     "Value of incoming preferred email format data. For example, 'T' may represent a preference for Text formatted email.",
      //   type: 'string'
      // },
      // updateOnMatch: {
      //   label: 'Update On Match',
      //   description: 'Controls how the existing record should be updated.',
      //   type: 'string',
      //   choices: [
      //     { label: 'REPLACE_ALL', value: 'REPLACE_ALL' },
      //     { label: 'NO_UPDATE', value: 'NO_UPDATE' }
      //   ]
      // },
      // enable_batching: enable_batching,
      // batch_size: batch_size
    },
    //testAuthentication: (request) => {
    // Return a request that tests/validates the user's credentials.
    // If you do not have a way to validate the authentication fields safely,
    // you can remove the `testAuthentication` function, though discouraged.
    // return true
    //},
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      // let endpoint = `${auth.authUrl}`
      const endpoint = 'https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/api/v1.3/auth/token'
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `user_name=${(auth as any).username}&password=${(auth as any).userPassword}&auth_type=password`
      }
      console.log(requestOptions)
      let response
      try {
        response = await fetch(endpoint, requestOptions)
      } catch (err: any) {
        throw new Error(`***ERROR STATUS*** : ${err.message}`)
      }
      if (response.status >= 500 || response.status === 429) {
        throw new Error(
          `***ERROR STATUS*** : ${response.status} from ${endpoint}. Response : ${JSON.stringify(
            await response.json()
          )}`
        )
      }
      return await response.json()
    }
  },
  extendRequest({ auth }) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (auth && auth.accessToken) {
      headers.authorization = `Bearer ${auth.accessToken}`
    }

    return {
      headers
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    asyncMergeProfileListMembers,
    asyncMergePetRecords
  }
}

export default destination
