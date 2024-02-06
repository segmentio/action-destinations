import { Payload as CustomTraitsPayload } from './sendCustomTraits/generated-types'
import { Payload as AudiencePayload } from './sendAudience/generated-types'
import { Payload as ListMemberPayload } from './upsertListMember/generated-types'
import { RecordData, CustomTraitsRequestBody, MergeRule, ListMemberRequestBody, Data } from './types'
import { RequestClient, IntegrationError, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

export const validateCustomTraitsSettings = ({ profileExtensionTable }: { profileExtensionTable?: string }): void => {
  if (
    !(
      typeof profileExtensionTable !== 'undefined' &&
      profileExtensionTable !== null &&
      profileExtensionTable.trim().length > 0
    )
  ) {
    throw new IntegrationError(
      'Send Custom Traits Action requires "PET Name" setting field to be populated',
      'PET_NAME_SETTING_MISSING',
      400
    )
  }
}

export const validateListMemberPayload = ({
  EMAIL_ADDRESS_,
  RIID_
}: {
  EMAIL_ADDRESS_?: string
  RIID_?: string
}): void => {
  // TODO validate which identifier fields are required

  if (!EMAIL_ADDRESS_?.toUpperCase() || EMAIL_ADDRESS_.toUpperCase().trim().length < 6) {
    throw new PayloadValidationError('Email Address is a required field')
  }
  if (!RIID_?.toUpperCase() || RIID_.toUpperCase().trim().length < 1) {
    throw new PayloadValidationError('Recipient ID is a required field')
  }
}

export const getUserDataFieldNames = (data: Data): string[] => {
  return Object.keys((data as unknown as Data).rawMapping.userData)
}

export const transformDataFieldValues = (settings: Settings): Settings => {
  if (settings.matchColumnName1 !== '' && settings.matchColumnName1 !== undefined) {
    settings.matchColumnName1 = `${settings.matchColumnName1}_`
  }

  if (settings.matchColumnName2 !== '' && settings.matchColumnName2 !== undefined) {
    settings.matchColumnName2 = `${settings.matchColumnName2}_`
  }
  return settings
}

export const sendCustomTraits = async (
  request: RequestClient,
  payload: CustomTraitsPayload[] | AudiencePayload[],
  settings: Settings,
  userDataFieldNames: string[],
  isAudience?: boolean
) => {
  let userDataArray: unknown[]

  if (isAudience) {
    userDataFieldNames.push('SEGMENT_AUDIENCE_KEY')
    const audiencePayloads = payload as unknown[] as AudiencePayload[]
    userDataArray = audiencePayloads.map((obj) => {
      return {
        ...obj.userData,
        SEGMENT_AUDIENCE_KEY: String(obj.traits_or_props[obj.computation_key])
      }
    })
  } else {
    const customTraitsPayloads = payload as unknown[] as CustomTraitsPayload[]
    userDataArray = customTraitsPayloads.map((obj) => obj.userData)
  }

  const records: unknown[][] = userDataArray.map((userData) => {
    return userDataFieldNames.map((fieldName) => {
      return (userData as Record<string, string>) && fieldName in (userData as Record<string, string>)
        ? (userData as Record<string, string>)[fieldName]
        : ''
    })
  })

  const recordData: RecordData = {
    fieldNames: userDataFieldNames.map((field) => field.toUpperCase()),
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

export const upsertListMembers = async (
  request: RequestClient,
  payload: ListMemberPayload[],
  settings: Settings,
  userDataFieldNames: string[]
) => {
  const userDataArray = payload.map((obj) => obj.userData)

  const records: unknown[][] = userDataArray.map((userData) => {
    return userDataFieldNames.map((fieldName) => {
      return (userData as Record<string, string>) && fieldName in (userData as Record<string, string>)
        ? (userData as Record<string, string>)[fieldName]
        : ''
    })
  })

  const recordData: RecordData = {
    fieldNames: userDataFieldNames,
    records,
    mapTemplateName: ''
  }

  const mergeRule: MergeRule = {
    htmlValue: settings.htmlValue,
    optinValue: settings.optinValue,
    textValue: settings.textValue,
    insertOnNoMatch: settings.insertOnNoMatch,
    updateOnMatch: settings.updateOnMatch,
    matchColumnName1: settings.matchColumnName1,
    matchColumnName2: settings.matchColumnName2 || '',
    matchOperator: settings.matchOperator,
    optoutValue: settings.optoutValue,
    rejectRecordIfChannelEmpty: settings.rejectRecordIfChannelEmpty,
    defaultPermissionStatus: settings.defaultPermissionStatus
  }

  const requestBody: ListMemberRequestBody = {
    recordData,
    mergeRule
  }

  const path = `/rest/asyncApi/v1.3/lists/${settings.profileListName}/members`

  const endpoint = new URL(path, settings.baseUrl)

  return await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })
}
