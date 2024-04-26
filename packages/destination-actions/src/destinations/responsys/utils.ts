import { Payload as CustomTraitsPayload } from './sendCustomTraits/generated-types'
import { Payload as AudiencePayload } from './sendAudience/generated-types'
import { Payload as ListMemberPayload } from './upsertListMember/generated-types'
import { RecordData, CustomTraitsRequestBody, MergeRule, ListMemberRequestBody, Data } from './types'
import {
  RequestClient,
  IntegrationError,
  PayloadValidationError,
  RetryableError,
  StatsContext
} from '@segment/actions-core'
import type { Settings } from './generated-types'

export const validateCustomTraits = ({
  profileExtensionTable,
  timestamp,
  statsContext,
  retry
}: {
  profileExtensionTable?: string
  timestamp: string | number
  statsContext: StatsContext | undefined
  retry?: number
}): void => {
  const statsClient = statsContext?.statsClient
  const statsTag = statsContext?.tags
  if (retry !== undefined && retry > 0 && shouldRetry(timestamp, retry)) {
    if (statsClient && statsTag) {
      statsClient?.incr('responsysShouldRetryTRUE', 1, statsTag)
    }
    throw new RetryableError('Event timestamp is within the retry window. Artificial delay to retry this event.', 429)
  } else {
    if (statsClient && statsTag) {
      statsClient?.incr('responsysShouldRetryFALSE', 1, statsTag)
    }
  }
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

export const shouldRetry = (timestamp: string | number, retry: number): boolean => {
  return (new Date().getTime() - new Date(timestamp).getTime()) / 1000 < retry
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

const stringifyObject = (obj: Record<string, unknown>): Record<string, string> => {
  const stringifiedObj: Record<string, string> = {}
  for (const key in obj) {
    stringifiedObj[key] = typeof obj[key] !== 'string' ? JSON.stringify(obj[key]) : (obj[key] as string)
  }
  return stringifiedObj
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
      const traitValue = obj.computation_key
        ? { [obj.computation_key.toUpperCase() as unknown as string]: obj.traits_or_props[obj.computation_key] }
        : {}
      if (!userDataFieldNames.includes(obj.computation_key.toUpperCase() as unknown as string)) {
        userDataFieldNames.push(obj.computation_key.toUpperCase() as unknown as string)
      }
      return {
        ...(obj.stringify ? stringifyObject(obj.userData) : obj.userData),
        ...(obj.stringify ? stringifyObject(traitValue) : traitValue)
      }
    })
  } else {
    const customTraitsPayloads = payload as unknown[] as CustomTraitsPayload[]
    userDataArray = customTraitsPayloads.map((obj) => (obj.stringify ? stringifyObject(obj.userData) : obj.userData))
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
            properties: {
              body,
              responsysRequest: {
                ...requestBody,
                recordCount: requestBody.recordData.records.length
              }
            },
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

export const upsertListMembers = async (
  request: RequestClient,
  payload: ListMemberPayload[],
  settings: Settings,
  userDataFieldNames: string[]
) => {
  const userDataArray = payload.map((obj) => (obj.stringify ? stringifyObject(obj.userData) : obj.userData))

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
    matchColumnName1: settings.matchColumnName1 + '_',
    matchColumnName2: settings.matchColumnName2 ? settings.matchColumnName2 + '_' : '',
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
            requestBody: {
              ...requestBody,
              recordCount: requestBody.recordData.records.length
            },
            properties: {
              body,
              responsysRequest: {
                ...requestBody,
                recordCount: requestBody.recordData.records.length
              }
            },
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
