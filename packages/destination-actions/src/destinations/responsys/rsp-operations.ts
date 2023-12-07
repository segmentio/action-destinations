import { Payload } from './asyncMergePetRecords/generated-types'
import { DynamicData, RecordData, RequestBody, RequestBodyPET } from './types'

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

// export const buildRequestBody = (/*payload: Payload,*/ recordData: RecordData, mergeRule: MergeRule) => {
//   return {
//     recordData: recordData,
//     mergeRule: mergeRule
//   }
// }

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

export const buildFetchRequest = (authToken: string, requestBody: RequestBody | RequestBodyPET) => {
  return {
    method: 'POST',
    headers: {
      Authorization: 'EKeaq2Zvb_4zWPl922iqaClaXVvDrlXCEtEE2inAz3vR2xf04w', //`${authToken}`,
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
