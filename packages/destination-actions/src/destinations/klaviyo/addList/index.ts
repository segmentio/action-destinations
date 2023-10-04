import { ActionDefinition, DynamicFieldResponse, APIError, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

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
      try {
        const result: any = await request(`https://a.klaviyo.com/api/lists/`, {
          method: 'get',
          headers: {
            Authorization: `Klaviyo-API-Key ${settings.api_key}`,
            Accept: 'application/json',
            revision: new Date().toISOString().slice(0, 10)
          },
          skipResponseCloning: true
        })
        const choices = JSON.parse(result.content).data.map((list: any) => {
          return { value: list.id, label: list.attributes.name }
        })
        return {
          choices
        }
      } catch (err) {
        return {
          choices: [],
          nextPage: '',
          error: {
            message: (err as APIError).message ?? 'Unknown error',
            code: (err as APIError).status + '' ?? 'Unknown error'
          }
        }
      }
    }
  },
  perform: async (request, { payload }) => {
    const { profile_id, list_id } = payload

    if (!list_id) {
      throw new IntegrationError(
        "Insert the ID of the default list that you'd like to subscribe users to when you call .identify().",
        'Missing required fields',
        400
      )
    }
    try {
      const addToListData: any = {
        data: [
          {
            type: 'profile',
            id: profile_id
          }
        ]
      }
      const list = await request(`https://a.klaviyo.com/api/lists/${list_id}/relationships/profiles/`, {
        method: 'POST',
        json: addToListData
      })
      return list
    } catch (error) {
      throw new Error('An error occurred while processing the request')
    }
  }
}

export default action
