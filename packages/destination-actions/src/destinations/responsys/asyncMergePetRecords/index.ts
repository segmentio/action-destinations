import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userData, enable_batching, batch_size } from '../rsp-properties'
import { RequestBodyPET, RecordData } from '../types'

import { buildRecordData, buildFetchRequest, handleFetchResponse } from '../rsp-operations'

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
    updateOnMatch: {
      label: 'Update On Match',
      description: 'Controls how the existing record should be updated.',
      type: 'string',
      required: true,
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
        insertOnNoMatch,
        matchColumnName1,
        matchColumnName2,
        updateOnMatch,
        userData,
        mapTemplateName
      } = payload

      const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`
      console.log(`endpoint ${endpoint}`)
      const recordData = buildRecordData(userData, mapTemplateName ?? '')

      const requestBody: RequestBodyPET = {
        recordData: recordData as RecordData,
        insertOnNoMatch: !!insertOnNoMatch,
        updateOnMatch: updateOnMatch || '',
        matchColumnName1: matchColumnName1?.replace(/_+$/, '') || '',
        matchColumnName2: matchColumnName2?.replace(/_+$/, '') || ''
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
        insertOnNoMatch,
        matchColumnName1,
        matchColumnName2,
        updateOnMatch,
        mapTemplateName
      } = chunk[0]

      const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`

      console.log(`Batching Payload: ${JSON.stringify(chunk)}`)

      const token = (auth as { authToken?: string })?.authToken
      const chunkData = chunk.map((obj) => obj.userData)
      const recordData = buildRecordData(chunkData, mapTemplateName ?? '')
      const requestBody: RequestBodyPET = {
        recordData: recordData as RecordData,
        insertOnNoMatch: !!insertOnNoMatch,
        updateOnMatch: updateOnMatch || '',
        matchColumnName1: matchColumnName1?.replace(/_+$/, '') || '',
        matchColumnName2: matchColumnName2?.replace(/_+$/, '') || ''
      }

      console.log(`requestBody : ${JSON.stringify(requestBody)}`)

      const fetchRequest = buildFetchRequest(token as unknown as string, requestBody)

      console.log(`request : ${JSON.stringify(fetchRequest)}`)

      let response
      try {
        response = await fetch(endpoint, fetchRequest)
      } catch (err) {
        if (err instanceof TypeError) throw new PayloadValidationError(err.message)
        throw new Error(`***ERROR STATUS*** : ${(err as Error).message}`)
      }

      const responseBody = await handleFetchResponse(endpoint, response)
      console.log(`responseBody : ${JSON.stringify(responseBody)}`)
    } // End of chunk for loop
  }
}

export default action
