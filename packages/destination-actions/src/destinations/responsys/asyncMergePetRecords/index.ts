import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userData, enable_batching, batch_size } from '../rsp-properties'
import { RequestBody } from '../types'

import {
  buildRecordData,
  // buildRecordDataBatch,
  // buildRequestBodyPET,
  buildFetchRequest,
  handleFetchResponse
} from '../rsp-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Async Merge PET Records',
  description: '',
  fields: {
    profileListName: {
      label: 'List Name',
      description: 'Name of the profile extension table’s parent profile list.',
      type: 'string',
      required: true
    },
    profileExtensionTable: {
      label: 'Pet Name',
      description: 'Name of the profile extension table.',
      type: 'string',
      required: true
    },
    userData: userData,
    mapTemplateName: {
      label: 'Map Template Name',
      description:
        'The Map Template in Responsys that can be used to map Field Names of the Profile List to Column Names.',
      type: 'string',
      default: ''
    },
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
    insertOnNoMatch: {
      label: 'Insert On No Match',
      description: 'Indicates what should be done for records where a match is not found.',
      type: 'boolean',
      choices: [
        { label: 'true', value: 'true' },
        { label: 'false', value: 'false' }
      ],
      default: 'true'
    },
    matchColumnName1: {
      label: 'First Column Match',
      description: 'First match column for determining whether an insert or update should occur.',
      type: 'string',
      choices: [
        { label: 'RIID_', value: 'RIID_' },
        { label: 'CUSTOMER_ID_', value: 'CUSTOMER_ID_' },
        { label: 'EMAIL_ADDRESS_', value: 'EMAIL_ADDRESS_' },
        { label: 'MOBILE_NUMBER_', value: 'MOBILE_NUMBER_' },
        { label: 'EMAIL_MD5_HASH_', value: 'EMAIL_MD5_HASH_' },
        { label: 'EMAIL_SHA256_HASH_', value: 'EMAIL_SHA256_HASH_' }
      ]
    },
    matchColumnName2: {
      label: 'Second Column Match',
      description: 'Second match column for determining whether an insert or update should occur.',
      type: 'string',
      choices: [
        { label: 'RIID_', value: 'RIID_' },
        { label: 'CUSTOMER_ID_', value: 'CUSTOMER_ID_' },
        { label: 'EMAIL_ADDRESS_', value: 'EMAIL_ADDRESS_' },
        { label: 'MOBILE_NUMBER_', value: 'MOBILE_NUMBER_' },
        { label: 'EMAIL_MD5_HASH_', value: 'EMAIL_MD5_HASH_' },
        { label: 'EMAIL_SHA256_HASH_', value: 'EMAIL_SHA256_HASH_' }
      ]
    },
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
    updateOnMatch: {
      label: 'Update On Match',
      description: 'Controls how the existing record should be updated.',
      type: 'string',
      choices: [
        { label: 'REPLACE_ALL', value: 'REPLACE_ALL' },
        { label: 'NO_UPDATE', value: 'NO_UPDATE' }
      ]
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, { /*settings,*/ payload, auth }) => {
    console.log(`auth : ${JSON.stringify(auth)}`)
    console.log(`incoming request : ${JSON.stringify(request)}`)

    if (payload && payload.profileListName) {
      // If #1
      const {
        profileListName,
        profileExtensionTable,
        // defaultPermissionStatus,
        // htmlValue,
        insertOnNoMatch,
        matchColumnName1,
        matchColumnName2,
        // matchOperator,
        // optinValue,
        // optoutValue,
        // rejectRecordIfChannelEmpty,
        // textValue,
        updateOnMatch,
        userData,
        mapTemplateName
      } = payload

      const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`
      console.log(`endpoint ${endpoint}`)
      const recordData = buildRecordData(userData, mapTemplateName ?? '')

      const requestBody: RequestBody = {
        records: recordData.records,
        fieldNames: recordData.fieldNames,
        mapTemplateName: recordData.mapTemplateName,
        insertOnNoMatch,
        updateOnMatch,
        matchColumnName1,
        matchColumnName2
      }

      console.log(`requestBody : ${JSON.stringify(requestBody)}`)

      const token = (auth as { authToken?: string })?.authToken
      const fetchRequest = buildFetchRequest(token as unknown as string, requestBody)

      console.log(`request : ${JSON.stringify(fetchRequest)}`)

      let response
      try {
        response = await fetch(endpoint, fetchRequest)
      } catch (err) {
        if (err instanceof TypeError) throw new PayloadValidationError(err.message)
        throw new Error(`***ERROR STATUS*** : ${(err as Error).message}`)
      }

      // const responseBody = await response.json()
      // console.log(`responseBody : ${JSON.stringify(responseBody)}`)

      const responseBody = await handleFetchResponse(endpoint, response)
      console.log(`responseBody : ${JSON.stringify(responseBody)}`)
    } // End of If #1
  },

  performBatch: async (request, { /*settings,*/ payload, auth }) => {
    console.log(`Batching Payload: ${JSON.stringify(payload)}`)
    console.log(`incoming request : ${JSON.stringify(request)}`)

    const chunkSize = 2
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize)
      const {
        profileListName,
        profileExtensionTable,
        // defaultPermissionStatus,
        // htmlValue,
        // insertOnNoMatch,
        // matchColumnName1,
        // matchColumnName2,
        // matchOperator,
        // optinValue,
        // optoutValue,
        // rejectRecordIfChannelEmpty,
        // textValue,
        // updateOnMatch,
        userData,
        mapTemplateName
      } = chunk[0]

      const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`

      console.log(`Batching Payload: ${JSON.stringify(chunk)}`)

      // const recordData = buildRecordData(userData, mapTemplateName ?? '')

      // const requestBody = buildRequestBodyPET(
      //   chunk[0],
      //   recordData /*{
      //   // defaultPermissionStatus,
      //   // htmlValue,
      //   insertOnNoMatch,
      //   matchColumnName1,
      //   matchColumnName2,
      //   // matchOperator,
      //   // optinValue,
      //   // optoutValue,
      //   // rejectRecordIfChannelEmpty,
      //   // textValue,
      //   updateOnMatch
      // }*/
      // )

      const token = (auth as { authToken?: string })?.authToken
      const recordData = buildRecordData(userData, mapTemplateName ?? '')
      const requestBody: RequestBody = {
        ...chunk[0],
        // recordData: {
        records: recordData.records,
        fieldNames: recordData.fieldNames,
        mapTemplateName: recordData.mapTemplateName
        // },
        // profileListName: chunk[0].profileListName,
        // profileExtensionTable: chunk[0].profileExtensionTable,
        // userData: chunk[0].userData,
        // mapTemplateName: chunk[0].mapTemplateName ?? '', // Use nullish coalescing operator
        // batch_size: chunk[0].batch_size,
        // enable_batching: chunk[0].enable_batching
      }

      console.log(`requestBody : ${JSON.stringify(requestBody)}`)

      const fetchRequest = buildFetchRequest(token as unknown as string, requestBody)

      console.log(`request : ${JSON.stringify(fetchRequest)}`)

      let response
      try {
        response = await fetch(endpoint, fetchRequest)
      } catch (err) {
        if (err instanceof TypeError) throw new PayloadValidationError(err.message)
        throw new Error(`***ERROR STATUS*** : ${err.message}`)
      }

      const responseBody = await handleFetchResponse(endpoint, response)
      console.log(`responseBody : ${JSON.stringify(responseBody)}`)
    } // End of chunk for loop
  }

  // https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${payload.profileListName}/listExtensions/${payload.profileExtensionTable}/members`
  // perform: async (request, { /*settings,*/ payload, auth }) => {
  //   // Make your partner api request here!
  //   // return request('https://example.com', {
  //   //   method: 'post',
  //   //   json: data.payload
  //   // })
  //   console.log(`auth : ${JSON.stringify(auth)}`)
  //   const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${payload.profileListName}/listExtensions/${payload.profileExtensionTable}/members`
  //   console.log(`endpoint : ${endpoint}`)
  //   console.log(payload)

  //   const recordData = {
  //     records: [Object.values(payload.userData)],
  //     fieldNames: Object.keys(payload.userData),
  //     mapTemplateName: payload.mapTemplateName || ''
  //   }

  //   const requestBody = {
  //     recordData: recordData,
  //     mergeRule: {
  //       defaultPermissionStatus: payload.defaultPermissionStatus,
  //       htmlValue: payload.htmlValue,
  //       insertOnNoMatch: payload.insertOnNoMatch,
  //       matchColumnName1: payload.matchColumnName1,
  //       matchColumnName2: payload.matchColumnName2,
  //       matchOperator: payload.matchOperator,
  //       optinValue: payload.optinValue,
  //       optoutValue: payload.optoutValue,
  //       rejectRecordIfChannelEmpty: payload.rejectRecordIfChannelEmpty,
  //       textValue: payload.textValue,
  //       updateOnMatch: payload.updateOnMatch
  //     }
  //   }
  //   console.log(`requestBody : ${JSON.stringify(requestBody)}`)
  //   const token = auth.authToken
  //   request = {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `${token}`,
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify(requestBody)
  //   }

  //   console.log(`request : ${JSON.stringify(request)}`)

  //   let response
  //   try {
  //     response = await fetch(endpoint, request)
  //   } catch (err) {
  //     throw new Error(`***ERROR STATUS*** : ${err.message}`)
  //   }
  //   console.log(`response.status : ${response.status}`)
  //   if (response.status >= 500) {
  //     throw new Error(
  //       `***ERROR STATUS RETRY*** : ${response.status} from ${endpoint}. Response : ${JSON.stringify(response.json())}`
  //     )
  //   }
  //   const responseBody = await response.json()
  //   console.log(`responseBody : ${JSON.stringify(responseBody)}`)
  // }
}

export default action
