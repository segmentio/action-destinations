
import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { GET_CUSTOM_FIELDS_URL } from '../constants'

export async function dynamicCustomFields(request: RequestClient): Promise<DynamicFieldResponse> {
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
          }
        }
    }

    try {
      const response: ResponseType = await request(GET_CUSTOM_FIELDS_URL, {
        method: 'GET',
        skipResponseCloning: true
      })
  
      return {
        choices: response.data.custom_fields.map((field) => {
          return {
            label: field.name,
            value: field.name
          }
        })
      }
    } catch (err) {      
      console.log(err)
      const error = err as ResultError
      return {
        choices: [],
        error: {
          message: error.response.data.errors.map((e) => e.message).join(';')  ?? 'Unknown error: dynamicCustomFields',
          code: "404"
        }
      }
    }
  }