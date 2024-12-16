
import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { GET_CUSTOM_FIELDS_URL } from '../constants'
import { Payload } from './generated-types'
import type { FieldType } from '../types'

interface ErrorResponse {
  choices: never[]
  error: {
    message: string
    code: string
  }
}

function createErrorResponse(message?: string, code?: string): ErrorResponse {
  return {
    choices: [],
    error: { message: message ?? 'Unknown error', code: code ?? '404' }
  }
}

export async function dynamicCustomFields(request: RequestClient, payload: Payload, fieldType:FieldType): Promise<DynamicFieldResponse> {
    interface ResultItem {
        id: string
        name: string
        field_type: FieldType
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

      const selected = new Set(Object.keys({...payload.custom_text_fields, ...payload.custom_number_fields, ...payload.custom_date_fields }))
      const remainingFields = response.data.custom_fields.filter(field => field.field_type === fieldType).filter(field => !selected.has(field.name))
      
      if(remainingFields.length === 0) {
        return createErrorResponse(`No custom ${fieldType} fields available`)
      }

      return {
        choices: remainingFields.map(
          field => ({ 
            label: field.name, 
            value: `${field.name}:${field.field_type}`
          })
        )
      }

    } catch (err) {      
      const error = err as ResultError
      return createErrorResponse(error.response.data.errors.map((e) => e.message).join(';')  ?? 'Unknown error: dynamicCustomFields', String(error.response.status))
    }
  }