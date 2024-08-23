import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

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
