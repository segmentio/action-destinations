import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { ResponsysAudiencePetUpdateRequestBody } from '../types'

export const petExists = async (request: RequestClient, settings: Settings, computationKey: string) => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'GET'
  })

  const results = response.data as { profileExtension?: { objectName: string } }[]
  return results.find(
    (item: { profileExtension?: { objectName: string } }) => item.profileExtension?.objectName === computationKey
  )
}

export const createPet = async (request: RequestClient, settings: Settings, payload: Payload) => {
  const requestBody = {
    profileExtension: {
      objectName: payload.computation_key,
      folderName: payload.folder_name
    },
    fields: [
      {
        name: payload.computation_key,
        fieldType: 'STRING'
      }
    ]
  }

  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  return response
}

export const updatePet = async (request: RequestClient, settings: Settings, payloads: Payload[]) => {
  const records: {
    [audienceKey: string]: {
      recordsWithUserId: Payload[]
      recordsWithEmail: Payload[]
      recordsWithRiid: Payload[]
      requestBodyUserId?: ResponsysAudiencePetUpdateRequestBody
      requestBodyEmail?: ResponsysAudiencePetUpdateRequestBody
      requestBodyRiid?: ResponsysAudiencePetUpdateRequestBody
    }
  } = {}

  for (const payload of payloads) {
    if (!records[payload.computation_key]) {
      records[payload.computation_key] = {
        recordsWithUserId: [],
        recordsWithEmail: [],
        recordsWithRiid: []
      }
    }

    if (payload.userData.CUSTOMER_ID_) {
      records[payload.computation_key].recordsWithUserId.push(payload)
    } else if (payload.userData.EMAIL_ADDRESS_) {
      records[payload.computation_key].recordsWithEmail.push(payload)
    } else if (payload.userData.RIID_) {
      records[payload.computation_key].recordsWithRiid.push(payload)
    }
  }

  for (const [computationKey, recordCategories] of Object.entries(records)) {
    if (recordCategories.recordsWithUserId.length > 0) {
      records[computationKey].requestBodyUserId = buildPetUpdatePayload(
        recordCategories.recordsWithUserId,
        'CUSTOMER_ID'
      )
    }
    if (recordCategories.recordsWithEmail.length > 0) {
      records[computationKey].requestBodyEmail = buildPetUpdatePayload(
        recordCategories.recordsWithEmail,
        'EMAIL_ADDRESS'
      )
    }
    if (recordCategories.recordsWithRiid.length > 0) {
      records[computationKey].requestBodyRiid = buildPetUpdatePayload(recordCategories.recordsWithRiid, 'RIID')
    }
  }

  // Responsys API is very restrictive, so we need to send each request separately, and in sequence.

  const promises = []
  for (const [computationKey, recordCategories] of Object.entries(records)) {
    if (recordCategories.requestBodyUserId) {
      promises.push(await sendPetUpdate(request, settings, computationKey, recordCategories.requestBodyUserId))
    }

    if (recordCategories.requestBodyEmail) {
      promises.push(await sendPetUpdate(request, settings, computationKey, recordCategories.requestBodyEmail))
    }

    if (recordCategories.requestBodyRiid) {
      promises.push(await sendPetUpdate(request, settings, computationKey, recordCategories.requestBodyRiid))
    }
  }

  return promises
}

const buildPetUpdatePayload = (payloads: Payload[], fieldType: 'CUSTOMER_ID' | 'EMAIL_ADDRESS' | 'RIID') => {
  const matchType = (fieldType + '_') as 'CUSTOMER_ID_' | 'EMAIL_ADDRESS_' | 'RIID_'
  const requestBody = {
    recordData: {
      fieldNames: [fieldType],
      records: payloads.map((payload) => {
        const field = payload.userData[matchType]
        if (field) {
          return [field]
        }
      }) as string[][],
      mapTemplateName: null
    },
    insertOnNoMatch: true,
    updateOnMatch: 'REPLACE_ALL',
    matchColumnName1: matchType
  }

  return requestBody
}

const sendPetUpdate = async (
  request: RequestClient,
  settings: Settings,
  computationKey: string,
  requestBody: ResponsysAudiencePetUpdateRequestBody
) => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions/${computationKey}/members`
  const endpoint = new URL(path, settings.baseUrl)

  return request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })
}
