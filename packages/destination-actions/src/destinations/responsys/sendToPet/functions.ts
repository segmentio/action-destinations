import { ModifiedResponse, RequestClient } from '@segment/actions-core/*'
import { Settings } from '../generated-types'
import { getAsyncResponse, sendDebugMessageToSegmentSource, stringifyObject, upsertListMembers } from '../utils'
import { ResponsysCustomTraitsRequestBody, ResponsysRecordData, UpsertProfileListResponse } from '../types'
import { Payload } from './generated-types'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'

export const getAllPets = async (
  request: RequestClient,
  settings: Settings
): Promise<{ objectName: string; folderName: string }[]> => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'GET'
  })

  const results = response.data as { profileExtension?: { objectName: string; folderName: string } }[]
  const filteredResults = results.filter((item) => item && item.profileExtension !== undefined)
  return filteredResults.map((item) => item.profileExtension as { objectName: string; folderName: string })
}

export const createPet = async (
  request: RequestClient,
  settings: Settings,
  petName: string,
  fields: string[],
  folderName?: string
) => {
  const petFields = fields.map((field) => {
    return {
      fieldName: field.substring(0, 30),
      fieldType: 'STR500'
    }
  })

  const requestBody = {
    profileExtension: {
      objectName: petName,
      folderName: folderName || settings.defaultFolderName
    },
    fields: petFields
  }

  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })
}

export const sendToPet = async (
  request: RequestClient,
  authTokens: AuthTokens,
  payload: Payload[],
  settings: Settings,
  userDataFieldNames: string[]
) => {
  // First, update the profile list. No PETs will accept records from non-existing profiles.
  const usingAsyncApi = payload.length > 0 ? payload[0].use_responsys_async_api : false
  await upsertListMembers(request, authTokens, payload, settings, usingAsyncApi)
  // Take a break.
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // petRecords[folderName][petName] = [record1, record2, ...]
  const folderRecords: {
    [key: string]: {
      [key: string]: (
        | Record<string, string>
        | {
            [k: string]: unknown
            EMAIL_ADDRESS_?: string
            CUSTOMER_ID_?: string
          }
      )[]
    }
  } = {}
  for (const item of payload) {
    const petName = String(item.pet_name || settings.profileExtensionTable)
    const folderName = String(item.folder_name || settings.defaultFolderName)
    if (!folderRecords[folderName]) {
      folderRecords[folderName] = {}
    }

    if (!folderRecords[folderName][petName]) {
      folderRecords[folderName][petName] = []
    }

    folderRecords[folderName][petName].push(item.stringify ? stringifyObject(item.userData) : item.userData)
  }

  const allPets = await getAllPets(request, settings)
  // Take a break.
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const responses: ModifiedResponse<unknown>[] = []
  for (const [folderName, petRecords] of Object.entries(folderRecords)) {
    for (const [petName, records] of Object.entries(petRecords)) {
      const correspondingPet = allPets.find(
        (item: { objectName: string; folderName: string }) =>
          item.objectName === petName && item.folderName === folderName
      )

      if (!correspondingPet) {
        await createPet(request, settings, petName, userDataFieldNames, folderName)
        // Take a break.
        await new Promise((resolve) => setTimeout(resolve, 1000))
        allPets.push({ objectName: petName, folderName })
      }

      const resolvedRecords: string[][] = records.map((userData) => {
        return userDataFieldNames.map((fieldName) => {
          return fieldName in userData ? (userData as Record<string, string>)[fieldName] : ''
        })
      })

      const recordData: ResponsysRecordData = {
        fieldNames: userDataFieldNames.map((field) => field.toUpperCase()),
        records: resolvedRecords,
        mapTemplateName: ''
      }

      const requestBody: ResponsysCustomTraitsRequestBody = {
        recordData,
        insertOnNoMatch: settings.insertOnNoMatch,
        updateOnMatch: settings.updateOnMatch || 'REPLACE_ALL',
        matchColumnName1: settings.matchColumnName1,
        matchColumnName2: settings.matchColumnName2 || ''
      }

      const path = `/rest/${usingAsyncApi ? 'asyncApi' : 'api'}/v1.3/lists/${
        settings.profileListName
      }/listExtensions/${petName}/members`
      const endpoint = new URL(path, settings.baseUrl)

      const response: ModifiedResponse<UpsertProfileListResponse> = await request(endpoint.href, {
        method: 'POST',
        skipResponseCloning: true,
        body: JSON.stringify(requestBody)
      })
      // Take a break.
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (usingAsyncApi) {
        const requestId = response.data.requestId
        const asyncResponse = await getAsyncResponse(requestId, authTokens, settings)
        await sendDebugMessageToSegmentSource(request, requestBody, asyncResponse, settings)
      }

      await sendDebugMessageToSegmentSource(request, requestBody, response, settings)
      responses.push(response as ModifiedResponse<unknown>)
    }

    return responses
  }
}
