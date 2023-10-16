import { ActionDefinition, DynamicFieldResponse, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { listData } from '../types'
import { executeProfileList, getListIdDynamicData } from '../functions'
import { profile_id, list_id, enable_batching } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add To List',
  description: 'Add to list',
  fields: {
    profile_id: { ...profile_id },
    list_id: { ...list_id },
    enable_batching: { ...enable_batching }
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

      const list = await executeProfileList(request, 'POST', listData, list_id)
      return list
    } catch (error) {
      throw new Error('An error occurred while processing the request')
    }
  },
  performBatch: async (request, { payload }) => {
    try {
      if (!payload[0].list_id) {
        throw new IntegrationError(
          "Insert the ID of the default list that you'd like to subscribe users",
          'Missing required fields',
          400
        )
      }

      const batch_data: listData = { data: [] }
      payload.forEach((data) => {
        if (!data.list_id) {
          return
        }
        batch_data.data.push({ type: 'profile', id: data.profile_id })
      })
      const list = await executeProfileList(request, 'POST', batch_data, payload[0].list_id)
      return list
    } catch (error) {
      throw new Error('An error occurred while processing the request')
    }
  }
}

export default action
