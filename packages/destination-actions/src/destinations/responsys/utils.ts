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
  RIID_,
  CUSTOMER_ID_
}: {
  EMAIL_ADDRESS_?: string
  RIID_?: string
  CUSTOMER_ID_?: string
}): void => {
  if (!EMAIL_ADDRESS_ && !RIID_ && !CUSTOMER_ID_) {
    throw new PayloadValidationError(
      'At least one of the following fields is required: Email Address, RIID, or Customer ID'
    )
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
    const audiencePayloads = payload as unknown[] as AudiencePayload[]
    userDataArray = audiencePayloads.map((obj) => {
      const traitValue = obj.computation_key ? { [obj.computation_key.toUpperCase() as unknown as string]: true } : {}  // Check if computation_key exists, if yes, add it with value true
      userDataFieldNames.push(obj.computation_key)
      return {
        ...obj.userData,
        ...traitValue
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

  const response = await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  if (settings.segmentWriteKey && settings.segmentWriteKeyRegion) {
    try {
      const body = response.data
      await request(
        settings.segmentWriteKeyRegion === 'EU'
          ? 'events.eu1.segmentapis.com/v1/track'
          : 'https://api.segment.io/v1/track',
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(settings.segmentWriteKey + ': ').toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'track',
            event: 'Responsys Response Message Received',
            properties: body,
            anonymousID: '__responsys__API__response__'
          })
        }
      )
    } catch (error) {
      // do nothing
    }
  }
  return response
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

  const response = await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  if (settings.segmentWriteKey && settings.segmentWriteKeyRegion) {
    try {
      const body = response.data
      await request(
        settings.segmentWriteKeyRegion === 'EU'
          ? 'events.eu1.segmentapis.com/v1/track'
          : 'https://api.segment.io/v1/track',
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(settings.segmentWriteKey + ': ').toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'track',
            event: 'Responsys Response Message Received',
            properties: body,
            anonymousId: '__responsys__API__response__'
          })
        }
      )
    } catch (error) {
      // do nothing
    }
  }
  return response
}
