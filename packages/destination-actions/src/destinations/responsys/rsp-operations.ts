import { Payload as PETPayload } from './asyncMergeConnectionsPetRecords/generated-types'
import { Payload as ProfileMemberListPayload } from './asyncMergeProfileListMembers/generated-types'
import { RecordData, RequestBodyPET, RequestBody } from './types'
import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'

export const buildRecordData = (userDataArray: Record, mapTemplateName: string) => {
  // Check if userData is an array
  if (Array.isArray(userData)) {
    const keysFromFirstObject = Object.keys(userData[0])
    return {
      records: userData.map((record) => Object.values(record)),
      fieldNames: keysFromFirstObject,
      mapTemplateName: mapTemplateName
    }
  }
  const keysFromFirstObject = Object.keys(userData)
  return {
    records: [Object.values(userData)],
    fieldNames: keysFromFirstObject,
    mapTemplateName: mapTemplateName
  }
}

export const sendConnectionsPETData = async (request: RequestClient, payload: PETPayload[], settings: Settings) => {

  interface UserData {
    [key: string]: unknown;
  }

  const {
    insertOnNoMatch,
    matchColumnName1,
    matchColumnName2,
    updateOnMatch,
    mapTemplateName
  } = payload[0]

  const userDataArray = payload.map((obj) => {
    const userData: UserData = { ...obj.userData };
    return userData;
  });

  const recordData = buildRecordData(userDataArray, mapTemplateName)
  const requestBody: RequestBodyPET = {
    recordData: recordData as RecordData,
    insertOnNoMatch,
    updateOnMatch,
    matchColumnName1,
    matchColumnName2: matchColumnName2 || ''
  }

  const path = `/rest/asyncApi/v1.3/lists/${settings.profileListName}/listExtensions/${settings.profileExtensionTable}/members`

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
  const recordData = buildRecordData(payloadData, mapTemplateName)
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
