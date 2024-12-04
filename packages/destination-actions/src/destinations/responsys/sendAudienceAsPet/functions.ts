import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import {
  ResponsysAudiencePetUpdateRequestBody,
  ResponsysListMemberRequestBody,
  ResponsysMatchField,
  ResponsysMatchType,
  ResponsysMergeRule,
  ResponsysRecordData,
  UpsertProfileListResponse
} from '../types'
import { getAsyncResponse, sendDebugMessageToSegmentSource } from '../utils'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'

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

export const petExists = async (request: RequestClient, settings: Settings, computationKey: string) => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'GET'
  })

  const results = response.data as { profileExtension?: { objectName: string } }[]
  return results.find(
    (item: { profileExtension?: { objectName: string } }) => item.profileExtension?.objectName === computationKey
  )
}

export const createPet = async (request: RequestClient, settings: Settings, payload: Payload) => {
  const requestBody = {
    profileExtension: {
      objectName: payload.pet_name,
      folderName: payload.folder_name || settings.defaultFolderName
    },
    fields: [
      {
        fieldName: payload.pet_name.substring(0, 30),
        fieldType: 'STR500'
      }
    ]
  }

  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  return response
}

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
      requestBodyUserId?: ResponsysAudiencePetUpdateRequestBody
      requestBodyEmail?: ResponsysAudiencePetUpdateRequestBody
      requestBodyRiid?: ResponsysAudiencePetUpdateRequestBody
    }
  } = {}

  // First we need to make sure that all users exist in the Profile List.
  await new Promise((resolve) => setTimeout(resolve, upsertListMembersWaitInterval))
  await updateProfileListMembers(request, settings, payloads)

  // This endpoint works better with only one identifier at a time, so we need to split the payloads into groups.
  for (const payload of payloads) {
    if (!records[payload.pet_name]) {
      records[payload.pet_name] = {
        recordsWithUserId: [],
        recordsWithEmail: [],
        recordsWithRiid: []
      }
    }

    if (payload.userData.CUSTOMER_ID_) {
      records[payload.pet_name].recordsWithUserId.push(payload)
    } else if (payload.userData.EMAIL_ADDRESS_) {
      records[payload.pet_name].recordsWithEmail.push(payload)
    } else if (payload.userData.RIID_) {
      records[payload.pet_name].recordsWithRiid.push(payload)
    }
  }

  for (const [audienceKey, recordCategories] of Object.entries(records)) {
    if (recordCategories.recordsWithUserId.length > 0) {
      records[audienceKey].requestBodyUserId = buildPetUpdatePayload(recordCategories.recordsWithUserId, 'CUSTOMER_ID')
    }
    if (recordCategories.recordsWithEmail.length > 0) {
      records[audienceKey].requestBodyEmail = buildPetUpdatePayload(recordCategories.recordsWithEmail, 'EMAIL_ADDRESS')
    }
    if (recordCategories.recordsWithRiid.length > 0) {
      records[audienceKey].requestBodyRiid = buildPetUpdatePayload(recordCategories.recordsWithRiid, 'RIID')
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

const buildPetUpdatePayload = (payloads: Payload[], matchField: ResponsysMatchField) => {
  const resolvedMatchType = (matchField + '_') as ResponsysMatchType
  const firstPayload = payloads[0]
  const records = payloads.map((payload) => {
    const field = payload.userData[resolvedMatchType]
    if (field) {
      const inAudience = payload.traits_or_props[payload.computation_key] === true ? '1' : '0'
      return [field, inAudience]
    }
  }) as string[][]

  const requestBody = {
    recordData: {
      fieldNames: [resolvedMatchType, firstPayload.computation_key.substring(0, 30)],
      records: records,
      mapTemplateName: null
    },
    insertOnNoMatch: true,
    updateOnMatch: 'REPLACE_ALL',
    matchColumnName1: matchField
  }

  return requestBody
}

const updateProfileListMembers = async (request: RequestClient, settings: Settings, payloads: Payload[]) => {
  const fieldNames = ['EMAIL_ADDRESS_', 'CUSTOMER_ID_']
  const records: string[][] = []

  for (const payload of payloads) {
    const record: string[] = []
    for (const fieldName of fieldNames) {
      const resolvedFieldName = fieldName as 'EMAIL_ADDRESS_' | 'CUSTOMER_ID_' | 'RIID_'
      if (payload.userData && payload.userData[resolvedFieldName]) {
        const value = payload.userData[resolvedFieldName]
        record.push(value || '')
      }
    }

    records.push(record)
  }

  const recordData: ResponsysRecordData = {
    fieldNames: fieldNames,
    records: records,
    mapTemplateName: ''
  }

  const mergeRule: ResponsysMergeRule = {
    insertOnNoMatch: true,
    updateOnMatch: 'REPLACE_ALL',
    matchColumnName1: settings.matchColumnName1 + '_',
    optinValue: settings.optinValue,
    optoutValue: settings.optoutValue,
    rejectRecordIfChannelEmpty: settings.rejectRecordIfChannelEmpty,
    defaultPermissionStatus: payloads[0].default_permission_status || settings.defaultPermissionStatus
  }

  const requestBody: ResponsysListMemberRequestBody = {
    recordData,
    mergeRule
  }

  const path = `/rest/asyncApi/v1.3/lists/${settings.profileListName}/members`

  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  await sendDebugMessageToSegmentSource(request, requestBody, response, settings)
}

const sendPetUpdate = async (
  request: RequestClient,
  authTokens: AuthTokens,
  settings: Settings,
  computationKey: string,
  requestBody: ResponsysAudiencePetUpdateRequestBody
) => {
  const path = `/rest/asyncApi/v1.3/lists/${settings.profileListName}/listExtensions/${computationKey}/members`
  const endpoint = new URL(path, settings.baseUrl)

  await new Promise((resolve) => setTimeout(resolve, sendToPetWaitInterval * 2))
  const response: ModifiedResponse<UpsertProfileListResponse> = await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  const requestId = response.data.requestId
  await new Promise((resolve) => setTimeout(resolve, getAsyncResponseWaitInterval))
  const asyncResponse = await getAsyncResponse(requestId, authTokens, settings)
  await sendDebugMessageToSegmentSource(request, requestBody, asyncResponse, settings)
}
