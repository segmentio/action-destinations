import { Payload as CustomTraitsPayload } from './sendCustomTraits/generated-types'
import { Payload as AudiencePayload } from './sendAudience/generated-types'
import { RecordData, CustomTraitsRequestBody, MergeRule, ListMemberRequestBody, Data } from './types'
import { RequestClient, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

export const validate = ({ profileExtensionTable }: { profileExtensionTable?: string }): void => {
  if (!(typeof profileExtensionTable !== 'undefined' && profileExtensionTable !== null && profileExtensionTable.trim().length > 0)){
    throw new IntegrationError('Send Custom Traits Action requires "PET Name" setting field to be populated', 'PET_NAME_SETTING_MISSING', 400)
  }
}

export const getUserDataFieldNames = (data: Data): string[] => {
  return Object.keys((data as unknown as Data).rawMapping.userData)
}

export const sendCustomTraits = async (
  request: RequestClient,
  payload: CustomTraitsPayload[] | AudiencePayload[],
  settings: Settings,
  userDataFieldNames: string[], 
  isAudience?: boolean
) => {

  let userDataArray: unknown[]

  if(isAudience){
    const audiencePayloads = payload as unknown[] as AudiencePayload[]
    userDataArray = audiencePayloads.map((obj) => {
        return {
          ...obj.userData,
          SEGMENT_AUDIENCE_KEY: String(obj.traits_or_props[obj.computation_key]) 
        }
    });
  } else {
    const payloads = payload as unknown[] as CustomTraitsPayload[]
    userDataArray = payloads.map((obj) => obj.userData)
  }

  const records: unknown[][] = userDataArray.map((userData) => {
    return userDataFieldNames.map((fieldName) => {
      return (userData as Record<string, unknown>) && fieldName in (userData as Record<string, unknown>) ? (userData as Record<string, unknown>)[fieldName] : '';
    });
  });

  const recordData: RecordData = {
    fieldNames: userDataFieldNames.map(field => field.toUpperCase()),
    records,
    mapTemplateName: ''
  }

  const requestBody: CustomTraitsRequestBody = {
    recordData,
    insertOnNoMatch: settings.insertOnNoMatch,
    updateOnMatch: settings.updateOnMatch,
    matchColumnName1: settings.matchColumnName1,
    matchColumnName2: settings.matchColumnName2 || ''
  }

  const path = `/rest/asyncApi/v1.3/lists/${settings.profileListName}/listExtensions/${settings.profileExtensionTable}/members`

  const endpoint = new URL(path, settings.baseUrl)

  return await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })
}

export const upsertListMember = async (
  request: RequestClient,
  payload: ListMemberPayload[],
  settings: Settings,
  userDataFieldNames: string[]
) => {
  const userDataArray = payload.map((obj) => obj.userData)

  // TODO capitalize keys for all custom trait names
  const records: unknown[][] = userDataArray.map((userData) => {
    return userDataFieldNames.map((fieldName) => {
      return userData && fieldName in userData ? userData[fieldName] : ''
    })
  })

  const recordData: RecordData = {
    fieldNames: userDataFieldNames,
    records,
    mapTemplateName: ''
  }

  const mergeRule: MergeRule = {
    htmlValue: 
    optinValue: string
    textValue: string

    insertOnNoMatch: settings.insertOnNoMatch,
    updateOnMatch: settings.updateOnMatch,
    matchColumnName1: settings.matchColumnName1,
    matchColumnName2: settings.matchColumnName2 || ''

    matchOperator: string
    optoutValue: string
    rejectRecordIfChannelEmpty: string
    defaultPermissionStatus: 'OPTIN' | 'OPTOUT'


  }

  const requestBody: ListMemberRequestBody = {
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
