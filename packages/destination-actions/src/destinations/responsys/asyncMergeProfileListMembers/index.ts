import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userData, enable_batching, batch_size } from '../rsp-properties'
import type { RecordData, RequestBody } from '../types'

import { buildRecordData } from '../rsp-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Async Merge Profile List Members',
  description: '',
  fields: {
    profileListName: {
      label: 'List Name',
      description: "Name of the profile extension table's parent profile list.",
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
    insertOnNoMatch: {
      label: 'Insert On No Match',
      description: 'Indicates what should be done for records where a match is not found.',
      type: 'boolean',
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
        { label: 'None', value: 'NONE' },
        { label: 'And', value: 'AND' }
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
      required: true,
      choices: [
        { label: 'Replace All', value: 'REPLACE_ALL' },
        { label: 'No Update', value: 'NO_UPDATE' }
      ]
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, { settings, payload, auth }) => {
    console.log(`auth : ${JSON.stringify(auth)}`)
    console.log(`settings : ${JSON.stringify(settings)}`)
    console.log(`incoming request : ${JSON.stringify(request)}`)

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
      // Setting the endpoint
      const baseUrl = settings.baseUrl?.replace(/\/$/, '')
      const endpoint = `${baseUrl}/rest/asyncApi/v1.3/lists/${profileListName}/members`

      console.log(`endpoint ${endpoint}`)
      const recordData = buildRecordData(userData, mapTemplateName ?? '')

      const requestBody: RequestBody = {
        recordData: recordData as RecordData,
        mergeRule: {
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
        }
      }

      console.log(`requestBody : ${JSON.stringify(requestBody)}`)
      const token = auth?.accessToken ?? '' // Update 'authToken' to 'accessToken'
      // const fetchRequest = buildFetchRequest(token, requestBody)
      // console.log(`request : ${JSON.stringify(fetchRequest)}`)
      // replaced fetch() with request() from @segment/actions-core
      const response = request(endpoint, {
        method: 'POST',
        headers: {
          Authorization: token, //`${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      return response
      // Commented this out since the framework handles this
      //const responseBody = await handleFetchResponse(endpoint, response)
      //console.log(`responseBody : ${JSON.stringify(responseBody)}`)
    } // End of If #1
  },

  performBatch: async (request, { settings, payload }) => {
    console.log(`something Payload: ${payload}`)
    console.log(`incoming request : ${JSON.stringify(request)}`)
    const chunkSize = 2
    const requestBodyArr = []
    // Splitting the incoming payload into chunks to meet the Responsys API limit of 200 records per request
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize)
      const {
        //profileListName,
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
        mapTemplateName
      } = chunk[0]

      console.log(`Batching Payload: ${JSON.stringify(chunk)}`)
      const chunkData = chunk.map((obj) => obj.userData)
      //const recs = userData.map(obj => Object.values(obj));
      const recordData = buildRecordData(chunkData, mapTemplateName ?? '')

      const requestBody: RequestBody = {
        recordData: recordData as RecordData,
        mergeRule: {
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
        }
      }
      requestBodyArr.push(requestBody)

      console.log(`requestBody : ${JSON.stringify(requestBody)}`)
      // EP: Not sure if we need to fallback to empty string if auth is undefined.
      //const token = auth?.accessToken ?? ''
      // Auth token is added by extendRequest() in index.ts
      // const response = request(endpoint, {
      //   method: 'POST',
      //   body: JSON.stringify(requestBody)
      // })
      // return response

      // EP: Replaced fetch() with request() from @segment/actions-core. Since framework handles the errors, we don't need to handle them
      // const fetchRequest = buildFetchRequest(token, requestBody)

      // console.log(`request : ${JSON.stringify(fetchRequest)}`)

      // let response
      // try {
      //   response = await fetch(endpoint, fetchRequest)
      // } catch (err) {
      //   if (err instanceof TypeError) throw new PayloadValidationError(err.message)
      //   throw new Error(`***ERROR STATUS*** : ${(err as Error).message}`)
      // }

      // const responseBody = await handleFetchResponse(endpoint, response)
      // console.log(`responseBody : ${JSON.stringify(responseBody)}`)
    } // End of chunk for loop
    const profileListName = payload[0].profileListName
    // EP: processing all chunks in parallel with Promise.all()
    // Remove trailing slash from baseUrl if it exists
    const baseUrl = settings.baseUrl?.replace(/\/$/, '')
    const endpoint = `${baseUrl}/rest/asyncApi/v1.3/lists/${profileListName}/members`

    return await Promise.all(
      requestBodyArr.map(async (item) => {
        await request(endpoint, {
          method: 'POST',
          body: JSON.stringify(item)
        })
      })
    )
  }
}

export default action
