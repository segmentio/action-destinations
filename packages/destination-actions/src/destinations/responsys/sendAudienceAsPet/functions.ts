import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import {
  ResponsysAudiencePetUpdateRequestBody,
  ResponsysListMemberRequestBody,
  ResponsysMatchField,
  ResponsysMatchType,
  ResponsysMergeRule,
  ResponsysRecordData
} from '../types'
import { sendDebugMessageToSegmentSource } from '../utils'

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
      folderName: payload.folder_name
    },
    fields: [
      {
        fieldName: payload.pet_name,
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

export const updateProfileListAndPet = async (request: RequestClient, settings: Settings, payloads: Payload[]) => {
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
      results.push(await sendPetUpdate(request, settings, computationKey, recordCategories.requestBodyUserId))
    }

    if (recordCategories.requestBodyEmail) {
      results.push(await sendPetUpdate(request, settings, computationKey, recordCategories.requestBodyEmail))
    }

    if (recordCategories.requestBodyRiid) {
      results.push(await sendPetUpdate(request, settings, computationKey, recordCategories.requestBodyRiid))
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
      fieldNames: [resolvedMatchType, firstPayload.computation_key],
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
        if (payload.userData && payload.userData[resolvedFieldName]) {
          const value = payload.userData[resolvedFieldName]
          record.push(value || '')
        }
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
    matchColumnName1: settings.matchColumnName1 + '_'
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
  settings: Settings,
  computationKey: string,
  requestBody: ResponsysAudiencePetUpdateRequestBody
) => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions/${computationKey}/members`
  const endpoint = new URL(path, settings.baseUrl)

  return request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })
}
