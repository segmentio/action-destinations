import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'

import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import {
  ResponsysAsyncResponse,
  ResponsysAudiencePetUpdateRequestBody,
  ResponsysListMemberRequestBody,
  ResponsysMatchField,
  ResponsysMatchType,
  ResponsysMergeRule,
  ResponsysRecordData
} from '../types'
import { getAsyncResponse, sendDebugMessageToSegmentSource } from '../functions'

// Rate limits per endpoint.
// Can be obtained through `/rest/api/ratelimit`, but at the point
// this project is, there's no good way to calling it without a huge
// drop in performance.
// We are using here the most common values observed in our customers.

// updateProfileListMembers (`lists/${settings.profileListName}/members`, POST): 400 requests per minute.
// Around 1 request every 150ms.
const upsertListMembersWaitInterval = 150

// sendToPet (`lists/${settings.profileListName}/listExtensions/${petName}/members`, POST): 400 requests per minute.
// Around 1 request every 150ms.
const sendToPetWaitInterval = 150

// getAsyncResponse (`requests/${requestId}`, GET): 1000 requests per minute.
// Around 1 request every 60ms.
const getAsyncResponseWaitInterval = 60

export const updateProfileListAndPet = async (
  request: RequestClient,
  authTokens: AuthTokens,
  settings: Settings,
  payloads: Payload[]
) => {
  const records: {
    [audienceKey: string]: {
      recordsWithUserId: Payload[]
      recordsWithEmail: Payload[]
      recordsWithRiid: Payload[]
      requestBodyUserId?: ResponsysAudiencePetUpdateRequestBody[]
      requestBodyEmail?: ResponsysAudiencePetUpdateRequestBody[]
      requestBodyRiid?: ResponsysAudiencePetUpdateRequestBody[]
    }
  } = {}

  // First we need to make sure that all users exist in the Profile List.
  await new Promise((resolve) => setTimeout(resolve, upsertListMembersWaitInterval))
  await updateProfileListMembers(request, authTokens, settings, payloads)

  // This endpoint works better with only one identifier at a time, so we need to split the payloads into groups.
  for (const payload of payloads) {
    if (!records[payload.computation_key]) {
      records[payload.computation_key] = {
        recordsWithUserId: [],
        recordsWithEmail: [],
        recordsWithRiid: []
      }
    }

    if (payload.recipientData.CUSTOMER_ID_) {
      records[payload.computation_key].recordsWithUserId.push(payload)
    } else if (payload.recipientData.EMAIL_ADDRESS_) {
      records[payload.computation_key].recordsWithEmail.push(payload)
    } else if (payload.recipientData.RIID_) {
      records[payload.computation_key].recordsWithRiid.push(payload)
    }
  }

  for (const [audienceKey, recordCategories] of Object.entries(records)) {
    if (recordCategories.recordsWithUserId.length > 0) {
      records[audienceKey].requestBodyUserId = buildPetUpdatePayloads(
        recordCategories.recordsWithUserId,
        'CUSTOMER_ID',
        settings
      )
    }
    if (recordCategories.recordsWithEmail.length > 0) {
      records[audienceKey].requestBodyEmail = buildPetUpdatePayloads(
        recordCategories.recordsWithEmail,
        'EMAIL_ADDRESS',
        settings
      )
    }
    if (recordCategories.recordsWithRiid.length > 0) {
      records[audienceKey].requestBodyRiid = buildPetUpdatePayloads(recordCategories.recordsWithRiid, 'RIID', settings)
    }
  }

  // Responsys API is very restrictive, so we need to send each request separately, and in sequence.
  // This is not ideal, but it's the only way to ensure that the requests are processed correctly.
  const results = []
  for (const [computationKey, recordCategories] of Object.entries(records)) {
    if (recordCategories.requestBodyUserId) {
      results.push(
        await sendPetUpdate(request, authTokens, settings, computationKey, recordCategories.requestBodyUserId)
      )
    }

    if (recordCategories.requestBodyEmail) {
      results.push(
        await sendPetUpdate(request, authTokens, settings, computationKey, recordCategories.requestBodyEmail)
      )
    }

    if (recordCategories.requestBodyRiid) {
      results.push(await sendPetUpdate(request, authTokens, settings, computationKey, recordCategories.requestBodyRiid))
    }
  }

  return results
}

const buildPetUpdatePayloads = (
  payloads: Payload[],
  matchField: ResponsysMatchField,
  settings: Settings
): ResponsysAudiencePetUpdateRequestBody[] => {
  const resolvedMatchType = (matchField + '_') as ResponsysMatchType
  const firstPayload = payloads[0]
  const records = payloads.map((payload) => {
    const field = payload.recipientData[resolvedMatchType]
    if (field) {
      const inAudience = payload.traits_or_props[payload.computation_key] === true ? '1' : '0'
      return [field, inAudience]
    }
  }) as string[][]

  const requestBodies = []
  // Per https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/REST/Async/asyncApi-v1.3-lists-listName-members-post.htm,
  // we can only send 200 records at a time.
  for (let i = 0; i < records.length; i += 200) {
    const chunk = records.slice(i, i + 200)
    const requestBody = {
      recordData: {
        // Per https://docs.oracle.com/en/cloud/saas/marketing/responsys-user/List_DataTypeFieldname.htm,
        // the field name should have a maximum of 30 characters.
        fieldNames: [resolvedMatchType, firstPayload.computation_key.substring(0, 30)],
        records: chunk,
        mapTemplateName: null
      },
      insertOnNoMatch: settings.insertOnNoMatch,
      updateOnMatch: settings.updateOnMatch,
      matchColumnName1: matchField
    }

    requestBodies.push(requestBody)
  }

  return requestBodies
}

const updateProfileListMembers = async (
  request: RequestClient,
  authTokens: AuthTokens,
  settings: Settings,
  payloads: Payload[]
) => {
  const fieldNames = ['EMAIL_ADDRESS_', 'CUSTOMER_ID_']
  const records: string[][] = []

  for (const payload of payloads) {
    const record: string[] = []
    for (const fieldName of fieldNames) {
      const resolvedFieldName = fieldName as 'EMAIL_ADDRESS_' | 'CUSTOMER_ID_' | 'RIID_'
      if (payload.recipientData && payload.recipientData[resolvedFieldName]) {
        const value = payload.recipientData[resolvedFieldName]
        record.push(value || '')
      }
    }

    records.push(record)
  }

  // Per https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/REST/Async/asyncApi-v1.3-lists-listName-members-post.htm,
  // we can only send 200 records at a time.
  for (let i = 0; i < records.length; i += 200) {
    const chunk = records.slice(i, i + 200)
    const recordData: ResponsysRecordData = {
      fieldNames: fieldNames,
      records: chunk,
      mapTemplateName: ''
    }

    const mergeRule: ResponsysMergeRule = {
      insertOnNoMatch: true,
      updateOnMatch: 'REPLACE_ALL',
      matchColumnName1: settings.matchColumnName1 + '_',
      optinValue: settings.optinValue,
      optoutValue: settings.optoutValue,
      rejectRecordIfChannelEmpty: settings.rejectRecordIfChannelEmpty,
      defaultPermissionStatus: payloads[0].default_permission_status
    }

    const requestBody: ResponsysListMemberRequestBody = {
      recordData,
      mergeRule
    }

    const path = `/rest/asyncApi/v1.3/lists/${settings.profileListName}/members`

    const endpoint = new URL(path, settings.baseUrl)

    const response: ModifiedResponse<ResponsysAsyncResponse> = await request(endpoint.href, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const requestId = response.data.requestId
    await new Promise((resolve) => setTimeout(resolve, getAsyncResponseWaitInterval))
    const asyncResponse = await getAsyncResponse(requestId, authTokens, settings)
    await sendDebugMessageToSegmentSource(request, requestBody, asyncResponse, settings)
  }
}

const sendPetUpdate = async (
  request: RequestClient,
  authTokens: AuthTokens,
  settings: Settings,
  computationKey: string,
  requestBodies: ResponsysAudiencePetUpdateRequestBody[]
): Promise<ModifiedResponse<unknown>[]> => {
  const path = `/rest/asyncApi/v1.3/lists/${settings.profileListName}/listExtensions/${computationKey}/members`
  const endpoint = new URL(path, settings.baseUrl)

  const responses = []
  for (const requestBody of requestBodies) {
    await new Promise((resolve) => setTimeout(resolve, sendToPetWaitInterval * 2))
    const response: ModifiedResponse<ResponsysAsyncResponse> = await request(endpoint.href, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const requestId = response.data.requestId
    await new Promise((resolve) => setTimeout(resolve, getAsyncResponseWaitInterval))
    const asyncResponse = await getAsyncResponse(requestId, authTokens, settings)
    await sendDebugMessageToSegmentSource(request, requestBody, asyncResponse, settings)
    responses.push(asyncResponse)
  }

  return responses
}
