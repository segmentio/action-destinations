import { Payload as PETPayload } from './asyncMergePetRecords/generated-types'
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

interface UserData {
  [key: string]: unknown;
  EMAIL_ADDRESS_: string | undefined;
  CUSTOMER_ID_: string | undefined;
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

  const userDataArray = payload.map((obj) => {
    const userData: UserData = { ...obj.userData, EMAIL_ADDRESS_: obj.email, CUSTOMER_ID_: obj.customer_id };
    if (typeof obj.engage_audience_key === 'string') {
      userData[obj.engage_audience_key.toUpperCase()] = obj.properties_or_traits[obj.engage_audience_key];
    }
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
