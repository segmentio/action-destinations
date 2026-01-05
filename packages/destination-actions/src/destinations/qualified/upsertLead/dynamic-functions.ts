import { RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import { LeadFieldsResponse } from './types'
import { base_url } from './constants'

export async function dynamicReadFields(
  request: RequestClient, 
  type: 'string' | 'boolean' | 'number'
): Promise<DynamicFieldResponse> {
  try {
    const response: LeadFieldsResponse = await request(base_url + '/leads/fields', {
      method: 'GET',
      skipResponseCloning: true
    })

    return {
    choices: response.data
        .filter((item) => item.type === type)
        .map((field) => ({
          label: `${field.label} - ${field.type}`,
          value: field.name
        }))
    }
  } catch (err) {
    return {
      choices: [],
      error: {
        message: err.message ?? 'Unknown error: dynamicReadFields',
        code: err.code
      }
    }
  }
}