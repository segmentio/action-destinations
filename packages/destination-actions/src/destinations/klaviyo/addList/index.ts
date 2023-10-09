import { ActionDefinition, DynamicFieldResponse, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { API_URL } from '../config'
import { listData } from '../types'
import { getListIdDynamicData } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add To List',
  description: 'Add to list',
  fields: {
    profile_id: {
      label: 'Profile Id',
      description: 'Profile Id of User',
      type: 'string'
    },
    list_id: {
      label: 'List Id',
      description: `'Insert the ID of the default list that you'd like to subscribe users to when you call .identify().'`,
      type: 'string',
      dynamic: true
    }
  },
  dynamicFields: {
    list_id: async (request, { settings }): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request, settings)
    }
  },
  perform: async (request, { payload }) => {
    const { profile_id, list_id } = payload

    if (!list_id) {
      throw new IntegrationError(
        "Insert the ID of the default list that you'd like to subscribe users",
        'Missing required fields',
        400
      )
    }
    try {
      const listData: listData = {
        data: [
          {
            type: 'profile',
            id: profile_id
          }
        ]
      }
      const list = await request(`${API_URL}/lists/${list_id}/relationships/profiles/`, {
        method: 'POST',
        json: listData
      })
      return list
    } catch (error) {
      throw new Error('An error occurred while processing the request')
    }
  }
}

export default action
