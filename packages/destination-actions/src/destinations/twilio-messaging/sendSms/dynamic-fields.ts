
import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { GET_INCOMING_PHONE_NUMBERS_URL, GET_MESSAGING_SERVICE_SIDS_URL, GET_TEMPLATES_URL, GET_TEMPLATE_VARIABLES_URL } from './constants'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { parseFieldValue, validateMediaUrls } from './utils'

interface ResultError {
  response: {
    data: {
      status: number
      message: string
    }
  }
}

export async function dynamicPhoneNumber(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
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

    try {
        const url = GET_INCOMING_PHONE_NUMBERS_URL.replace('{accountSid}', settings.accountSID)
        console.log(url)
        const response: ResponseType = await request(url, {
            method: 'GET',
            skipResponseCloning: true
        })
      
        const numbers = response.data.incoming_phone_numbers ?? []

        if(numbers.length === 0) { 
          return {
            choices: [],
            error: {
              message: 'No numbers found. Please create a phone number in your Twilio account.',
              code: '404'
            }
          }
        }
        
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
          message: error.response.data.message ?? 'Unknown error: dynamicMessagingServiceSid',
          code: String(error.response.data.status) ?? 404
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

  try {
      const url = GET_MESSAGING_SERVICE_SIDS_URL.replace('{accountSid}', settings.accountSID)
      const response: ResponseType = await request(url, {
          method: 'GET',
          skipResponseCloning: true
      })
    
      const sids = response.data.services ?? []

      if(sids.length === 0) { 
        return {
          choices: [],
          error: {
            message: 'No Messaging Services found. Please create a Messaging Service in your Twilio account.',
            code: '404'
          }
        }
      }

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
        message: error.response.data.message ?? 'Unknown error: dynamicMessagingServiceSid',
        code: String(error.response.data.status) ?? 404
      }
    }
  }
}

export async function dynamicTemplateSid(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
  interface ResultItem {
    friendly_name: string
    sid: string
    types: {
      "twilio/text"?: {
        body: string
      },
      "twilio/media"?: {
        body: string
        media: Array<string>
      }
    }
  }

  interface ResponseType {
    data: {
      contents: ResultItem[]
    }
  }

  const { templateType } = payload
  const urls = validateMediaUrls(payload)

  if(!templateType) {
    return {
      choices: [],
      error: {
        message: 'Select a Template Type first.',
        code: '404'
      }
    }
  }
  if(templateType === 'inline') {
    return {
      choices: [],
      error: {
        message: "To select a pre-defined template, set the Template Type field to 'Pre-defined' first.",
        code: '404'
      }
    }
  }

  try {
      const url = GET_TEMPLATES_URL
      const response: ResponseType = await request(url, {
          method: 'GET',
          skipResponseCloning: true
      })
  
      const contents = response.data.contents ?? []

      if(contents.length === 0) { 
        return {
          choices: [],
          error: {
            message: 'No templates found. Please create a template in Twilio first.',
            code: '404'
          }
        }
      }

      const choices = contents
        .filter((c) => 
          (c.types['twilio/text'] && urls.length === 0) ||
          (c.types['twilio/media'] && urls.length > 0)
        )
        .map((c) => ({
          label: `${c.friendly_name} [${c.sid}]`,
          value: `${c.friendly_name} [${c.sid}]`,
        }))

      return { choices }

  } catch (err) {
    const error = err as ResultError
    return {
      choices: [],
      error: {
        message: error.response.data.message ?? 'Unknown error: dynamictemplateSid',
        code: String(error.response.data.status) ?? 404
      }
    }
  }
}

export async function dynamicContentVariables(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
  
  const templateSid = parseFieldValue(payload.templateSid)

  if (!templateSid) {
    throw new Error("Select a value from the 'Pre-defined Template SID' field first")
  }

  interface ResponseType {
    data: {
      variables: {
        [key: string]: string
      }
    }
  }

  try {
      const url = GET_TEMPLATE_VARIABLES_URL.replace('{contentSid}', templateSid)
      const response: ResponseType = await request(url, {
          method: 'GET',
          skipResponseCloning: true
      })
    console.log(templateSid)
      const variables = response.data.variables ?? {}
    
      if(Object.keys(variables).length === 0) { 
        return {
          choices: [],
          error: {
            message: 'No variables found for this Content item. If variable are required please createthem in Twilio first.',
            code: '404'
          }
        }
      }

      const selectedVariables: string[] = Object.keys(payload.contentVariables ?? {}).filter(key => key.trim() !== '')
      const filteredVariables: string[] = Object.keys(variables).filter((v) => !selectedVariables.includes(v))

      return {
          choices: filteredVariables.map((key) => ({
                label: key,
                value: key
          }))
      }
  } catch (err) {

    const error = err as ResultError
    return {
      choices: [],
      error: {
        message: error.response.data.message ?? 'Unknown error: dynamicContentVariables',
        code: String(error.response.data.status) ?? 404
      }
    }
  }
}