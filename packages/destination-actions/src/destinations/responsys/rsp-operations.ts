import { Payload as PETPayload } from './asyncMergePetRecords/generated-types'
import { Payload as ProfileMemberListPayload } from './asyncMergeProfileListMembers/generated-types'
import { DynamicData, RecordData, RequestBodyPET, RequestBody } from './types'
import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'

export const buildRecordData = (userData: DynamicData, mapTemplateName: string) => {
  // Check if userData is an array
  if (Array.isArray(userData)) {
    const keysFromFirstObject = Object.keys(userData[0])
    return {
      records: userData.map((record) => Object.values(record)),
      fieldNames: keysFromFirstObject,
      mapTemplateName: mapTemplateName || ''
    }
  }
  const keysFromFirstObject = Object.keys(userData)
  return {
    records: [Object.values(userData)],
    fieldNames: keysFromFirstObject,
    mapTemplateName: mapTemplateName || ''
  }
}

// Needed a separate function for PET since mergeRule is not an expected key in request
export const buildRequestBodyPET = (payload: PETPayload, recordData: RecordData /*, mergeRule*/) => {
  const matchColumnName1 = payload.matchColumnName1 ? String(payload.matchColumnName1) : ''
  const matchColumnName2 = payload.matchColumnName2 ? String(payload.matchColumnName2) : ''
  return {
    recordData: recordData,
    insertOnNoMatch: payload.insertOnNoMatch,
    updateOnMatch: payload.updateOnMatch,
    matchColumnName1: matchColumnName1.replace(/_+$/, ''), //replace trailing _ otherwise it throws INVALID PARAMETER error
    matchColumnName2: matchColumnName2.replace(/_+$/, '') //replace trailing _ otherwise it throws INVALID PARAMETER error
  }
}

export const sendPETData = async (request: RequestClient, payload: PETPayload[], settings: Settings) => {
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
    matchColumnName1: matchColumnName1 || '',
    matchColumnName2: matchColumnName2 || ''
  }

  const path = `/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${profileExtensionTable}/members`

  const endpoint = new URL(path, settings.baseUrl)

  return await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })
}

export const sendProfileListMembersData = async (
  request: RequestClient,
  payload: ProfileMemberListPayload[],
  settings: Settings
) => {
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
    mapTemplateName
  } = payload[0]

  const payloadData = payload.map((obj) => obj.userData)
  const recordData = buildRecordData(payloadData, mapTemplateName ?? '')
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

  const path = `/rest/asyncApi/v1.3/lists/${profileListName}/members`

  const endpoint = new URL(path, settings.baseUrl)

  return await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })
}
