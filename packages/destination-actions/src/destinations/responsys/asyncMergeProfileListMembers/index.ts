import type { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { userData, enable_batching, batch_size } from '../rsp-properties'

import {
  buildRecordData,
  // buildRecordDataBatch,
  buildRequestBody,
  buildFetchRequest,
  handleFetchResponse
} from '../rsp-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Async Merge Profile List Members',
  description: '',
  fields: {
    profileListName: {
      label: 'List Name',
      description: 'Name of the profile extension table’s parent profile list.',
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
    defaultPermissionStatus: {
      label: 'Default Permission Status',
      description:
        'This value must be specified as either OPTIN or OPTOUT and would be applied to all of the records contained in the API call. If this value is not explicitly specified, then it is set to OPTOUT.',
      type: 'string',
      choices: [
        { label: 'OPTIN', value: 'OPTIN' },
        { label: 'OPTOUT', value: 'OPTOUT' }
      ],
      default: 'OPTOUT'
    },
    htmlValue: {
      label: 'Preferred Email Format',
      description:
        "Value of incoming preferred email format data. For example, 'H' may represent a preference for HTML formatted email.",
      type: 'string'
    },
    insertOnNoMatch: {
      label: 'Insert On No Match',
      description: 'Indicates what should be done for records where a match is not found.',
      type: 'boolean',
      choices: [
        { label: true, value: true },
        { label: false, value: false }
      ],
      default: true
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
    matchOperator: {
      label: 'Match Operator',
      description: 'Operator to join match column names.',
      type: 'string',
      choices: [
        { label: 'NONE', value: 'NONE' },
        { label: 'AND', value: 'AND' }
      ]
    },
    optinValue: {
      label: 'Optin Value',
      description:
        "Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.",
      type: 'string'
    },
    optoutValue: {
      label: 'Optout Value',
      description:
        "Value of incoming opt-out status data that represents an optout status. For example, '0' may represent an opt-out status.",
      type: 'string'
    },
    rejectRecordIfChannelEmpty: {
      label: 'Reject Record If Channel Empty',
      description:
        "String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. Channel codes are 'E' (Email), 'M' (Mobile), 'P' (Postal Code). For example 'E,M' would indicate that a record that has a null for Email or Mobile Number value should be rejected. This parameter can also be set to null or to an empty string, which will cause the validation to not be performed for any channel, except if the matchColumnName1 parameter is set to EMAIL_ADDRESS_ or MOBILE_NUMBER_. When matchColumnName1 is set to EMAIL_ADDRESS_ or MOBILE_NUMBER_, then the null or empty string setting is effectively ignored for that channel.",
      type: 'string'
    },
    textValue: {
      label: 'Text Value',
      description:
        "Value of incoming preferred email format data. For example, 'T' may represent a preference for Text formatted email.",
      type: 'string'
    },
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

    if (payload && payload.profileListName) {
      // If #1
      const {
        profileListName,
        defaultPermissionStatus,
        htmlValue,
        insertOnNoMatch,
        matchColumnName1,
        matchColumnName2,
        matchOperator,
        optinValue,
        optoutValue,
        rejectRecordIfChannelEmpty,
        textValue,
        updateOnMatch,
        userData,
        mapTemplateName
      } = payload

      const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/members`
      console.log(`endpoint ${endpoint}`)
      const recordData = buildRecordData(userData, mapTemplateName)

      const requestBody = buildRequestBody(payload, recordData, {
        defaultPermissionStatus,
        htmlValue,
        insertOnNoMatch,
        matchColumnName1,
        matchColumnName2,
        matchOperator,
        optinValue,
        optoutValue,
        rejectRecordIfChannelEmpty,
        textValue,
        updateOnMatch
      })

      console.log(`requestBody : ${JSON.stringify(requestBody)}`)

      const token = auth.authToken
      const fetchRequest = buildFetchRequest(token, requestBody)

      console.log(`request : ${JSON.stringify(fetchRequest)}`)

      let response
      try {
        response = await fetch(endpoint, fetchRequest)
      } catch (err) {
        if (err instanceof TypeError) throw new PayloadValidationError(err.message)
        throw new Error(`***ERROR STATUS*** : ${err.message}`)
      }

      // const responseBody = await response.json()
      // console.log(`responseBody : ${JSON.stringify(responseBody)}`)

      const responseBody = await handleFetchResponse(endpoint, response)
      console.log(`responseBody : ${JSON.stringify(responseBody)}`)
    } // End of If #1
  },

  performBatch: async (request, { /*settings,*/ payload, auth }) => {
    console.log(`something Payload: ${payload}`)
    const chunkSize = 2
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize)
      const {
        profileListName,
        defaultPermissionStatus,
        htmlValue,
        insertOnNoMatch,
        matchColumnName1,
        matchColumnName2,
        matchOperator,
        optinValue,
        optoutValue,
        rejectRecordIfChannelEmpty,
        textValue,
        updateOnMatch,
        userData,
        mapTemplateName
      } = chunk[0]

      const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/members`

      console.log(`Batching Payload: ${JSON.stringify(chunk)}`)

      const recordData = buildRecordData(userData, mapTemplateName)

      const requestBody = buildRequestBody(chunk[0], recordData, {
        defaultPermissionStatus,
        htmlValue,
        insertOnNoMatch,
        matchColumnName1,
        matchColumnName2,
        matchOperator,
        optinValue,
        optoutValue,
        rejectRecordIfChannelEmpty,
        textValue,
        updateOnMatch
      })

      console.log(`requestBody : ${JSON.stringify(requestBody)}`)

      const token = auth.authToken
      const fetchRequest = buildFetchRequest(token, requestBody)

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

  ////////////////////////////////////////////////////////////////////////////////////////////////
  // perform: async (request, { settings, payload, auth }) => {
  //   console.log(`auth : ${JSON.stringify(auth)}`)
  //   const profileListName = payload.profileListName
  //   const defaultPermissionStatus = payload.defaultPermissionStatus,
  //   const htmlValue = payload.htmlValue,
  //   const insertOnNoMatch = payload.insertOnNoMatch,
  //   const matchColumnName1 = payload.matchColumnName1,
  //   const matchColumnName2 = payload.matchColumnName2,
  //   const matchOperator = payload.matchOperator,
  //   const optinValue = payload.optinValue,
  //   const optoutValue = payload.optoutValue,
  //   const rejectRecordIfChannelEmpty = payload.rejectRecordIfChannelEmpty,
  //   const textValue = payload.textValue,
  //   const updateOnMatch = payload.updateOnMatch
  //   const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/members`
  //   const userData = payload.userData
  //   const mapTemplateName = payload.mapTemplateName

  //   console.log(`endpoint : ${endpoint}`)
  //   console.log(payload)

  //   const recordData = {
  //     records: [Object.values(userData)],
  //     fieldNames: Object.keys(userData),
  //     mapTemplateName: mapTemplateName || ''
  //   }

  //   const requestBody = {
  //     recordData: recordData,
  //     mergeRule: {
  //       defaultPermissionStatus: defaultPermissionStatus,
  //       htmlValue: htmlValue,
  //       insertOnNoMatch: insertOnNoMatch,
  //       matchColumnName1: matchColumnName1,
  //       matchColumnName2: matchColumnName2,
  //       matchOperator: matchOperator,
  //       optinValue: optinValue,
  //       optoutValue: optoutValue,
  //       rejectRecordIfChannelEmpty: rejectRecordIfChannelEmpty,
  //       textValue: textValue,
  //       updateOnMatch: updateOnMatch
  //     }
  //   }
  //   console.log(`requestBody : ${JSON.stringify(requestBody)}`)
  //   const token = auth.authToken
  //   request = {
  //     method: 'POST',
  //     headers: {
  //       Authorization: 'EDFZ-RQU0HzJIp6_YdQh5NvJZD3x-jkDz5Lnkirh4Y27y64Sqg', //`${token}`,
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
  // },
  // performBatch: async (request, { settings, payload, auth }) => {
  //   const profileListName = payload[0].profileListName
  //   const defaultPermissionStatus = payload[0].defaultPermissionStatus,
  //   const htmlValue = payload[0].htmlValue,
  //   const insertOnNoMatch = payload[0].insertOnNoMatch,
  //   const matchColumnName1 = payload[0].matchColumnName1,
  //   const matchColumnName2 = payload[0].matchColumnName2,
  //   const matchOperator = payload[0].matchOperator,
  //   const optinValue = payload[0].optinValue,
  //   const optoutValue = payload[0].optoutValue,
  //   const rejectRecordIfChannelEmpty = payload[0].rejectRecordIfChannelEmpty,
  //   const textValue = payload[0].textValue,
  //   const updateOnMatch = payload[0].updateOnMatch
  //   const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/members`
  //   const userData = payload[0].userData
  //   const mapTemplateName = payload[0].mapTemplateName

  //   console.log(`Batching Payload: ${JSON.stringify(payload)}`)

  //   const firstObject = userData;
  //   const keysFromFirstObject = Object.keys(firstObject);
  //   console.log(`keysFromFirstObject ${keysFromFirstObject}`)

  //   const recordsObj = {
  //     "keys": keysFromFirstObject,
  //     "userData": payload.map(obj => Object.values(obj.userData))
  //   };
  //   console.log(`recordsObj: ${JSON.stringify(recordsObj)}`)

  //   const recordData = {
  //     records: Object.values(recordsObj.userData),
  //     fieldNames: recordsObj.keys,
  //     mapTemplateName: mapTemplateName || ''
  //   }

  //   const requestBody = {
  //     recordData: recordData,
  //     mergeRule: {
  //       defaultPermissionStatus: defaultPermissionStatus,
  //       htmlValue: htmlValue,
  //       insertOnNoMatch: insertOnNoMatch,
  //       matchColumnName1: matchColumnName1,
  //       matchColumnName2: matchColumnName2,
  //       matchOperator: matchOperator,
  //       optinValue: optinValue,
  //       optoutValue: optoutValue,
  //       rejectRecordIfChannelEmpty: rejectRecordIfChannelEmpty,
  //       textValue: textValue,
  //       updateOnMatch: updateOnMatch
  //     }
  //   }
  //   console.log(`requestBody : ${JSON.stringify(requestBody)}`)
  //   const token = auth.authToken
  //   request = {
  //     method: 'POST',
  //     headers: {
  //       Authorization: 'EDFZ-RQU0HzJIp6_YdQh5NvJZD3x-jkDz5Lnkirh4Y27y64Sqg', //`${token}`,
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
  ////////////////////////////////////////////////////////////////////////////////////////////////////
}

export default action
