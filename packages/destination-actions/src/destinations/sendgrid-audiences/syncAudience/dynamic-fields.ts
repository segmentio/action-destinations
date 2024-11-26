
import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { GET_CUSTOM_FIELDS_URL } from '../constants'
import { Payload } from './generated-types'

export async function dynamicCustomFields(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
    interface ResultItem {
        id: string
        name: string
        field_type: string
    }
    interface ResponseType {
        data: {
            custom_fields: Array<ResultItem>
        }
    }  
    interface ResultError {
        response: {
          data: {
            errors: Array<{ message: string }>
          },
          status: number
        }
    }

    try {
      const response: ResponseType = await request(GET_CUSTOM_FIELDS_URL, {
        method: 'GET',
        skipResponseCloning: true
      })
  
      const allFields = response.data.custom_fields.map(field => field.name)
      const selectedFields = new Set(Object.keys(payload.custom_fields ?? {}))
      const availableFields = allFields.filter(field => !selectedFields.has(field))
      
      return {
        choices: availableFields.map(
          fieldName => ({ 
            label: fieldName, 
            value: fieldName 
          })
        )
      }

    } catch (err) {      
      const error = err as ResultError
      return {
        choices: [],
        error: {
          message: error.response.data.errors.map((e) => e.message).join(';')  ?? 'Unknown error: dynamicCustomFields',
          code: String(error.response.status)
        }
      }
    }
  }