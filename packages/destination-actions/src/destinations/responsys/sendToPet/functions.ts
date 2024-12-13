import { IntegrationError, ModifiedResponse, RequestClient } from '@segment/actions-core'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'
import { Settings } from '../generated-types'
import { getAsyncResponse, sendDebugMessageToSegmentSource, stringifyObject, upsertListMembers } from '../utils'
import { ResponsysCustomTraitsRequestBody, ResponsysRecordData, ResponsysAsyncResponse } from '../types'
import { Payload } from './generated-types'

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
  const usingAsyncApi = payload.length > 0 ? payload[0].use_responsys_async_api : false

  // Rate limits per endpoint.
  // Can be obtained through `/rest/api/ratelimit`, but at the point
  // this project is, there's no good way to calling it without a huge
  // drop in performance.
  // We are using here the most common values observed in our customers.

  // getAllPets (`lists/${settings.profileListName}/listExtensions`, GET): 1000 requests per minute.
  // Around 1 request every 60ms.
  const getAllPetsWaitInterval = 60

  // createPet (`lists/${settings.profileListName}/listExtensions`, POST): 10 requests per minute.
  // Around 1 request every 6000ms.
  const createPetWaitInterval = 6000

  // sendToPet (`lists/${settings.profileListName}/listExtensions/${petName}/members`, POST): 500 requests per minute.
  // Around 1 request every 120ms.
  const sendToPetWaitInterval = 120

  // First, update the profile list. No PETs will accept records from non-existing profiles.
  await upsertListMembers(request, authTokens, payload, settings, usingAsyncApi)

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

  // Take a break.
  await new Promise((resolve) => setTimeout(resolve, getAllPetsWaitInterval))
  const allPets = await getAllPets(request, settings)

  const responses: ModifiedResponse<unknown>[] = []
  for (const [folderName, petRecords] of Object.entries(folderRecords)) {
    for (const [petName, records] of Object.entries(petRecords)) {
      const correspondingPet = allPets.find(
        (item: { objectName: string; folderName: string }) => item.objectName === petName
      )

      if (correspondingPet && correspondingPet.folderName !== folderName) {
        throw new IntegrationError(
          `PET ${petName} already exists in another folder: ${correspondingPet.folderName}, not ${folderName}.`,
          'INVALID_ARGUMENT',
          400
        )
      }

      if (!correspondingPet) {
        // Take a break.
        await new Promise((resolve) => setTimeout(resolve, createPetWaitInterval))
        await createPet(request, settings, petName, userDataFieldNames, folderName)
        allPets.push({ objectName: petName, folderName })
      }

      const resolvedRecords: string[][] = records.map((userData) => {
        return userDataFieldNames.map((fieldName) => {
          return fieldName in userData ? (userData as Record<string, string>)[fieldName] : ''
        })
      })

      // Per https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/REST/Async/asyncApi-v1.3-lists-listName-members-post.htm,
      // we can only send 200 records at a time.
      for (let i = 0; i < resolvedRecords.length; i += 200) {
        const chunk = resolvedRecords.slice(i, i + 200)
        const recordData: ResponsysRecordData = {
          fieldNames: userDataFieldNames.map((field) => field.toUpperCase()),
          records: chunk,
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

        // Take a break.
        // In this particular case, only waiting the regular time is not enough, so
        // we are waiting twice the time.
        await new Promise((resolve) => setTimeout(resolve, sendToPetWaitInterval * 2))
        const response: ModifiedResponse<ResponsysAsyncResponse> = await request(endpoint.href, {
          method: 'POST',
          skipResponseCloning: true,
          body: JSON.stringify(requestBody)
        })

        if (usingAsyncApi) {
          const requestId = response.data.requestId
          const asyncResponse = await getAsyncResponse(requestId, authTokens, settings)
          await sendDebugMessageToSegmentSource(request, requestBody, asyncResponse, settings)
          responses.push(asyncResponse)
        }

        await sendDebugMessageToSegmentSource(request, requestBody, response, settings)
        responses.push(response as ModifiedResponse<unknown>)
      }
    }

    return responses
  }
}
