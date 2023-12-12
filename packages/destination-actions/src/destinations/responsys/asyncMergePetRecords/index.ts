import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userData, enable_batching, batch_size } from '../rsp-properties'
import { RequestBodyPET, RecordData } from '../types'
import { buildRecordData } from '../rsp-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Async Merge PET Records',
  description: '',
  defaultSubscription: 'type = "identify"',
  fields: {
    profileListName: {
      label: 'List Name',
      description: "Name of the profile extension table's parent profile list.",
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
        { label: 'Replace All', value: 'REPLACE_ALL' },
        { label: 'No Update', value: 'NO_UPDATE' }
      ]
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, { settings, payload, auth }) => {
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

      // EP: URL can vary, we need to pull it from global settings. Also remove trailing slash from baseUrl if it exists
      // const baseUrl = settings.baseUrl?.replace(/\/$/, '')
      // Ensure baseUrl starts with "https://"
      const baseUrl = (
        settings.baseUrl?.startsWith('https://') ? settings.baseUrl : `https://${settings.baseUrl}`
      )?.replace(/\/$/, '')
      const endpoint = `${baseUrl}/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`
      //const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`
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
      // Auth token is added by extendRequest()
      return request(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
      //const token = (auth as { authToken?: string })?.authToken
      //const fetchRequest = buildFetchRequest(token as unknown as string, requestBody)

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
    } // End of If #1
  },

  performBatch: async (request, { settings, payload }) => {
    console.log(`Batching Payload: ${JSON.stringify(payload)}`)
    console.log(`incoming request : ${JSON.stringify(request)}`)

    const {
      profileListName,
      profileExtensionTable,
      insertOnNoMatch,
      matchColumnName1,
      matchColumnName2,
      updateOnMatch,
      mapTemplateName
    } = payload[0]

    const payloadData = payload.map((obj) => obj.userData)
    const recordData = buildRecordData(payloadData, mapTemplateName ?? '')
    const requestBody: RequestBodyPET = {
      recordData: recordData as RecordData,
      insertOnNoMatch: !!insertOnNoMatch,
      updateOnMatch: updateOnMatch || '',
      matchColumnName1: matchColumnName1?.replace(/_+$/, '') || '',
      matchColumnName2: matchColumnName2?.replace(/_+$/, '') || ''
    }
    console.log(`requestBody : ${JSON.stringify(requestBody)}`)
    // const baseUrl = settings.baseUrl?.replace(/\/$/, '')
    // Ensure baseUrl starts with "https://"
    const baseUrl = (
      settings.baseUrl?.startsWith('https://') ? settings.baseUrl : `https://${settings.baseUrl}`
    )?.replace(/\/$/, '')
    const endpoint = `${baseUrl}/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`
    return await request(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    /* EP: below is old "chunking" code, which we no longer need because enable_batching should batch the data into chunks of 200 records.
    const chunkSize = 2
    const requestBodyArr = []
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize)
      const {
        //profileListName,
        //profileExtensionTable,
        insertOnNoMatch,
        matchColumnName1,
        matchColumnName2,
        updateOnMatch,
        mapTemplateName
      } = chunk[0]
      // EP: URL can vary, we need to get it from settings
      // const endpoint = `https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`

      console.log(`Batching Payload: ${JSON.stringify(chunk)}`)
      // EP: Removed as token is added by extendRequest()
      // const token = (auth as { authToken?: string })?.authToken
      const chunkData = chunk.map((obj) => obj.userData)
      const recordData = buildRecordData(chunkData, mapTemplateName ?? '')
      const requestBody: RequestBodyPET = {
        recordData: recordData as RecordData,
        insertOnNoMatch: !!insertOnNoMatch,
        updateOnMatch: updateOnMatch || '',
        matchColumnName1: matchColumnName1?.replace(/_+$/, '') || '',
        matchColumnName2: matchColumnName2?.replace(/_+$/, '') || ''
      }
      requestBodyArr.push(requestBody)

      console.log(`requestBody : ${JSON.stringify(requestBody)}`)

      // EP: Removed the below code: replaced fetch with request(). errors are handled by thr framework

      // const fetchRequest = buildFetchRequest(token as unknown as string, requestBody)

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
    // EP: Processing all chunks in parallel with Promise.all()
    const profileListName = payload[0].profileListName
    const profileExtensionTable = payload[0].profileExtensionTable
    const baseUrl = settings.baseUrl?.replace(/\/$/, '')
    const endpoint = `${baseUrl}/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`
    return await Promise.all(
      requestBodyArr.map(async (item) => {
        await request(endpoint, {
          method: 'POST',
          body: JSON.stringify(item)
        })
      })
    )
    END old chunking code */
  }
}

export default action
