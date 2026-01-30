import { RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import { LeadFieldsResponse, LeadFieldType } from './types'
import { base_url } from './constants'

export async function dynamicReadFields(
  request: RequestClient,
  types: LeadFieldType[],
  isCompany = false
): Promise<DynamicFieldResponse> {
  try {
    const response: LeadFieldsResponse = await request(base_url + `${isCompany ? 'companies' : 'leads'}/fields`, {
      method: 'GET',
      skipResponseCloning: true
    })
    const choices = {
      choices: response.data.data
        .filter((field) => {
          return types.includes(field.type as LeadFieldType)
        })
        .map((field) => ({
          label: `${field.label} [${field.type}]`,
          value: field.name
        }))
    }
    if (choices.choices.length === 0) {
      return {
        choices: [],
        error: {
          message: `No fields found for types: ${types.join(', ')}`,
          code: 'no_fields_found'
        }
      }
    }
    return choices
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
