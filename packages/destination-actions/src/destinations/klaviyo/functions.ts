import { RequestClient, DynamicFieldResponse, APIError } from '@segment/actions-core'
import { API_URL } from './config'
import { listData } from './types'

export async function getListIdDynamicData(request: RequestClient, settings: any): Promise<DynamicFieldResponse> {
  try {
    const result: any = await request(`${API_URL}/lists/`, {
      method: 'get',
      headers: {
        Authorization: `Klaviyo-API-Key ${settings.api_key}`,
        Accept: 'application/json',
        revision: new Date().toISOString().slice(0, 10)
      },
      skipResponseCloning: true
    })
    const choices = JSON.parse(result.content).data.map((list: { id: string; attributes: { name: string } }) => {
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

export async function executeProfileList(
  request: RequestClient,
  method: 'DELETE' | 'POST',
  payload: listData,
  list_id: string
) {
  try {
    const list = await request(`${API_URL}/lists/${list_id}/relationships/profiles/`, {
      method: method,
      json: payload
    })
    return list
  } catch (error) {
    throw new Error('An error occurred while processing the request')
  }
}
