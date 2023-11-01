import { ActionDefinition, DynamicFieldResponse, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import { GetProfileResponseData, listData } from '../types'
import { executeProfileList, getListIdDynamicData, getProfile } from '../functions'
import { email, list_id } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove profile from list',
  description: 'Remove profile from list',
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
    if (!email || !list_id) {
      throw new IntegrationError(
        "Insert the ID of the default list that you'd like to subscribe users",
        'Missing required fields',
        400
      )
    }
    try {
      const profileData: GetProfileResponseData = await getProfile(request, email)
      const v = JSON.parse(profileData.content)
      if (!v && v.data[0] != undefined) {
        const listData: listData = {
          data: [
            {
              type: 'profile',
              id: v.id
            }
          ]
        }

        const list = await executeProfileList(request, 'DELETE', listData, list_id)
        return list
      }
      return
    } catch (error) {
      throw new Error('An error occurred while processing the request')
    }
  }
}

export default action
