import { Payload as CustomTraitsPayload } from './sendCustomTraits/generated-types'
import { RequestBody, RecordData, MergeRule } from './types'
import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'


export const sendStandardTraits = async (request: RequestClient, payload: CustomTraitsPayload[], settings: Settings, userDataFieldNames: string[]) => {

  const userDataArray = payload.map((obj) => obj.userData)

  const records: unknown[][] = userDataArray.map(userData => {
    return userDataFieldNames.map(fieldName => {
        return userData && userData[fieldName] !== undefined ? userData[fieldName] : '';
    });
  });

  const recordData: RecordData = {
    fieldNames: userDataFieldNames,
    records,
    mapTemplateName: ''
  }

  const mergeRule: MergeRule = {
    insertOnNoMatch: settings.insertOnNoMatch,
    updateOnMatch: settings.updateOnMatch,
    matchColumnName1: settings.matchColumnName1,
    matchColumnName2: settings.matchColumnName2 || ''
  } 

  const requestBody: RequestBody = {
    recordData,
    mergeRule
  }

  const path = `/rest/asyncApi/v1.3/lists/${settings.profileListName}/listExtensions/${settings.profileExtensionTable}/members`

  const endpoint = new URL(path, settings.baseUrl)

  return await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })
  
}

/*
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
*/
