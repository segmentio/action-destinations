import { Payload } from './asyncMergePetRecords/generated-types'
import { DynamicData, RecordData, MergeRule, RequestBody } from './types'

export const buildRecordData = (userData: DynamicData, mapTemplateName: string) => {
  const keysFromFirstObject = Object.keys(userData)
  return {
    records: [Object.values(userData)],
    fieldNames: keysFromFirstObject,
    mapTemplateName: mapTemplateName || ''
  }
}

export const buildRequestBody = (/*payload: Payload,*/ recordData: RecordData, mergeRule: MergeRule) => {
  return {
    recordData: recordData,
    mergeRule: mergeRule
  }
}

// Needed a separate function for PET since mergeRule is not an expected key in request
export const buildRequestBodyPET = (payload: Payload, recordData: RecordData /*, mergeRule*/) => {
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

export const buildFetchRequest = (authToken: string, requestBody: RequestBody) => {
  return {
    method: 'POST',
    headers: {
      Authorization: `${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  }
}

export const handleFetchResponse = async (endpoint: string, response: DynamicData) => {
  console.log(`response.status: ${response.status}`)
  if (response.status >= 500) {
    throw new Error(
      `***ERROR STATUS RETRY*** : ${response.status} from ${endpoint}. Response : ${JSON.stringify(
        await response.json()
      )}`
    )
  }
  return await response.json()
}
