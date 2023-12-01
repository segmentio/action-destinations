export const buildRecordData = (userData, mapTemplateName) => {
  const keysFromFirstObject = Object.keys(userData)
  return {
    records: [Object.values(userData)],
    fieldNames: keysFromFirstObject,
    mapTemplateName: mapTemplateName || ''
  }
}

export const buildRequestBody = (payload, recordData, mergeRule) => {
  return {
    recordData: recordData,
    mergeRule: mergeRule
  }
}

// Needed a separate function for PET since mergeRule is not an expected key in request
export const buildRequestBodyPET = (payload, recordData /*, mergeRule*/) => {
  const matchColumnName1 = payload.matchColumnName1 ? payload.matchColumnName1 : ''
  const matchColumnName2 = payload.matchColumnName2 ? payload.matchColumnName2 : ''
  return {
    recordData: recordData,
    insertOnNoMatch: payload.insertOnNoMatch,
    updateOnMatch: payload.updateOnMatch,
    matchColumnName1: matchColumnName1.replace(/_+$/, ''), //replace trailing _ otherwise it throws INVALID PARAMETER error
    matchColumnName2: matchColumnName2.replace(/_+$/, '') //replace trailing _ otherwise it throws INVALID PARAMETER error
  }
}

export const buildFetchRequest = (authToken, requestBody) => {
  return {
    method: 'POST',
    headers: {
      Authorization: `${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  }
}

export const handleFetchResponse = async (endpoint, response) => {
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
