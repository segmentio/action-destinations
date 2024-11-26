
import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { GET_INCOMING_PHONE_NUMBERS_URL, GET_MESSAGING_SERVICE_SIDS_URL, GET_TEMPLATES_URL, GET_TEMPLATE_VARIABLES_URL } from './constants'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { parseFieldValue } from './utils'

export async function dynamicFrom(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
    interface ResultItem {
      phone_number: string
      capabilities: {
        sms: boolean
        mms: boolean
      } 
    }
    interface ResponseType {
      data: {
        incoming_phone_numbers: ResultItem[]
      }
    }
  
    interface ResultError {
      data: {
        error: string
      }
    }
  
    try {
        const url = GET_INCOMING_PHONE_NUMBERS_URL.replace('{accountSID}', settings.accountSID)
        const response: ResponseType = await request(url, {
            method: 'GET',
            skipResponseCloning: true
        })
      
        const numbers = response.data.incoming_phone_numbers ?? []
        
        return {
            choices: numbers.filter((n) => {
                return n.capabilities.sms || n.capabilities.mms
            }).map((n) => {
                return {
                    label: `${n.phone_number}`,
                    value: `${n.phone_number}`
                }
            })
        }
    } catch (err) {
      const error = err as ResultError
      return {
        choices: [],
        error: {
          message: error.data.error ?? 'Unknown error: dynamicFrom',
          code: '404'
        }
      }
    }
}

export async function dynamicMessagingServiceSid(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
  interface ResultItem {
    account_sid: string
    friendly_name: string
    sid: string
  }
  interface ResponseType {
    data: {
      services: ResultItem[]
    }
  }

  interface ResultError {
    data: {
      error: string
    }
  }

  try {
      const url = GET_MESSAGING_SERVICE_SIDS_URL.replace('{accountSID}', settings.accountSID)
      const response: ResponseType = await request(url, {
          method: 'GET',
          skipResponseCloning: true
      })
    
      const sids = response.data.services ?? []

      return {
          choices: sids.map((s) => {
              return {
                  label: `${s.friendly_name} [${s.sid}]`,
                  value: `${s.friendly_name} [${s.sid}]`
              }
          })
      }
  } catch (err) {
    const error = err as ResultError
    return {
      choices: [],
      error: {
        message: error.data.error ?? 'Unknown error: dynamicMessagingServiceSid',
        code: '404'
      }
    }
  }
}

export async function dynamictemplateSid(request: RequestClient): Promise<DynamicFieldResponse> {
  interface ResultItem {
    sid: string
    friendly_name: string
  }

  interface ResponseType {
    data: {
      contents: ResultItem[]
    }
  }

  interface ResultError {
    data: {
      error: string
    }
  }

  try {
      const url = GET_TEMPLATES_URL
      const response: ResponseType = await request(url, {
          method: 'GET',
          skipResponseCloning: true
      })
    
      const sids = response.data.contents ?? []

      return {
          choices: sids.map((s) => {
              return {
                  label: `${s.friendly_name} [${s.sid}]`,
                  value: `${s.friendly_name} [${s.sid}]`
              }
          })
      }
  } catch (err) {
    const error = err as ResultError
    return {
      choices: [],
      error: {
        message: error.data.error ?? 'Unknown error: dynamictemplateSid',
        code: '404'
      }
    }
  }
}

export async function dynamicContentVariables(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
    const templateSid = parseFieldValue(payload.templateSid)

    if (!templateSid) {
      throw new Error("Select a value from the 'Pre-defined Template SID' field first")
    }
  
    interface ResultItem {
      name: string
    }

    interface ResponseType {
      data: {
        variables: ResultItem[]
      }
    }
  
    interface ResultError {
      data: {
        error: string
      }
    }
  
    try {
        const url = GET_TEMPLATE_VARIABLES_URL.replace('{contentSid}', templateSid)
        const response: ResponseType = await request(url, {
            method: 'GET',
            skipResponseCloning: true
        })
      
        const variables = response.data.variables ?? []
        
        return {
            choices: variables.map((v) => {
                return {
                    label: `${v.name}`,
                    value: `${v.name}`
                }
            })
        }
    } catch (err) {
      const error = err as ResultError
      return {
        choices: [],
        error: {
          message: error.data.error ?? 'Unknown error: dynamicContentVariables',
          code: '404'
        }
      }
    }
}
