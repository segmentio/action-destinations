import { ActionDefinition, DynamicFieldResponse, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { GetProfileResponseData, KlaviyoAPIError, listData } from '../types'
import { createProfile, executeProfileList, getListIdDynamicData } from '../functions'
import { email, list_id } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add To List',
  description: 'Add to list',
  fields: {
    email: { ...email },
    list_id: { ...list_id }
  },
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
  },
  perform: async (request, { payload }) => {
    const { email, list_id } = payload
    if (!list_id || !email) {
      throw new IntegrationError(
        "Insert the ID of the default list that you'd like to subscribe users",
        'Missing required fields',
        400
      )
    }
    const listData: listData = {
      data: [
        {
          type: 'profile'
        }
      ]
    }

    try {
      const profileData: GetProfileResponseData = await createProfile(request, email)
      const id = JSON.parse(profileData?.content)?.data?.id

      if (id) {
        listData.data[0].id = id
        return await executeProfileList(request, 'POST', listData, list_id)
      }
    } catch (error) {
      const { response } = error as KlaviyoAPIError

      if (response?.status === 409) {
        const content = JSON.parse(response?.content)
        const id = content?.errors[0]?.meta?.duplicate_profile_id

        if (id) {
          listData.data[0].id = id

          return await executeProfileList(request, 'POST', listData, list_id)
        }
      }

      throw new Error('An error occurred while processing the request')
    }
  }
}

export default action
