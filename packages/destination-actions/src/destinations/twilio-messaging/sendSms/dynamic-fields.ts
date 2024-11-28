
import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { GET_INCOMING_PHONE_NUMBERS_URL, GET_MESSAGING_SERVICE_SIDS_URL, GET_TEMPLATES_URL, GET_TEMPLATE_VARIABLES_URL, GET_TEMPLATE_URL } from './constants'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { parseFieldValue } from './utils'

interface ResultError {
  response: {
    data: {
      status: number
      message: string
    }
  }
}

interface ErrorResponse {
  choices: never[]
  error: {
    message: string
    code: string
  }
}

function isErrorResponse(response: unknown): response is ErrorResponse {
  return (response as ErrorResponse).error !== undefined
}

function createErrorResponse(message?: string, code?: string): ErrorResponse {
  return {
    choices: [],
    error: { message: message ?? "Unknown error", code: code ?? "404" }
  }
}

async function getData<T>(request: RequestClient, url: string): Promise<T | ErrorResponse> {
  try {
    const response = await request(url, {
      method: 'GET',
      skipResponseCloning: true
    })
    return response as T
  } catch (err) {
    const error = err as ResultError
    return createErrorResponse(error.response.data.message, String(error.response.data.status))
  }
}

export async function dynamicFromPhoneNumber(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
    interface ResponseType {
      data: {
        incoming_phone_numbers: Array<{
          phone_number: string
          capabilities: {
            sms: boolean
            mms: boolean
          } 
        }>
      }
    }
   
    const response = await getData<ResponseType>(request, GET_INCOMING_PHONE_NUMBERS_URL.replace('{accountSid}', settings.accountSID))

    if(isErrorResponse(response)) {
      return response
    }
  
    const numbers = response.data.incoming_phone_numbers ?? []

    if(numbers.length === 0) { 
      return createErrorResponse('No numbers found. Please create a phone number in your Twilio account.')
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
}

export async function dynamicMessagingServiceSid(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
  interface ResponseType {
    data: {
      services: Array<{
        account_sid: string
        friendly_name: string
        sid: string      
      }>
    }
  }

  const response = await getData<ResponseType>(request, GET_MESSAGING_SERVICE_SIDS_URL.replace('{accountSid}', settings.accountSID))

  if(isErrorResponse(response)) {
    return response
  }

  const sids = response.data.services ?? []

  if(sids.length === 0) { 
    return createErrorResponse('No Messaging Services found. Please create a Messaging Service in your Twilio account.')
  }

  return {
      choices: sids.map((s) => {
          return {
              label: `${s.friendly_name} [${s.sid}]`,
              value: `${s.friendly_name} [${s.sid}]`
          }
      })
  }
}

export async function dynamicTemplateSid(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
  interface ResponseType {
    data: {
      contents: Array<{
        friendly_name: string
        sid: string
        types: {
          "twilio/text"?: {
            body: string
          },
          "twilio/media"?: {
            body: string
          }
        }
      }>
    }
  }

  const { templateType } = payload

  if(!templateType) {
    return createErrorResponse('Select a Template Type first.')
  }
  if(templateType === 'inline') {
    return createErrorResponse("To select a pre-defined template, set the Template Type field to 'Pre-defined' first.")
  }

  const response = await getData<ResponseType>(request, GET_TEMPLATES_URL)

  if(isErrorResponse(response)) {
    return response
  }
  
  const contents = response.data.contents ?? []

  if(contents.length === 0) { 
    return createErrorResponse('No templates found. Please create a Content Template in Twilio first.') 
  }

  return { 
    choices: contents
      .filter((c) => c.types['twilio/text'] || c.types['twilio/media'])
      .map((c) => ({
        label: `${c.friendly_name} [${c.sid}]`,
        value: `${c.friendly_name} [${c.sid}]`,
      })) 
  }
}

export async function dynamicMediaUrls(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
  interface ResponseType {
    data: {
      friendly_name: string
      sid: string
      types: {
        "twilio/media"?: {
          body: string
          media: string[]
        }
      }
    }
  }

  const { templateType, templateSid, mediaUrls } = payload

  if(!templateType) {
    return createErrorResponse('Select a Template Type first.')
  }
  if(templateType === 'inline') {
    return createErrorResponse("To select a pre-defined template, set the Template Type field to 'Pre-defined' first.")
  }
  if([undefined, '', null].includes(templateSid)) {
    return createErrorResponse('Select a Template SID first.')
  }
  if(/^HX[0-9a-fA-F]{32}$/.test(templateSid as string) === false){
    return createErrorResponse('Invalid Template SID. SID should match with the pattern HX[0-9a-fA-F]{32}')
  }

  const response = await getData<ResponseType>(request, GET_TEMPLATE_URL.replace('{contentSid}', templateSid as string))

  if(isErrorResponse(response)) {
    return response
  }

  const urls = response.data?.types?.['twilio/media']?.media ?? []

  if(urls.length === 0) { 
    return createErrorResponse ('No Media URLs found for this Content Template. If media files are required please create them in Twilio first.')
  }

  const selectedUrls: string[] = mediaUrls?.map((m) => m.url) ?? []

  const filteredUrls = urls.filter((url) => !selectedUrls.includes(url))

  if(filteredUrls.length === 0) { 
    return createErrorResponse('No additional Media URLs found for this Content Template.')
  }

  return {
    choices: filteredUrls.map((url) => ({
      label: url,
      value: url
    }))
  }
}

export async function dynamicContentVariables(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
  
  interface ResponseType {
    data: {
      variables: {
        [key: string]: string
      }
    }
  }

  const templateSid = parseFieldValue(payload.templateSid)

  if (!templateSid) {
    return createErrorResponse("Select a value from the 'Pre-defined Template SID' field first")
  }

  const response = await getData<ResponseType>(request, GET_TEMPLATE_VARIABLES_URL.replace('{contentSid}', templateSid))  

  if(isErrorResponse(response)) {
    return response
  }

  const variables = response.data.variables ?? {}

  if(Object.keys(variables).length === 0) { 
    return createErrorResponse('No variables found for this Content item. If variable are required please createthem in Twilio first.')
  }

  const selectedVariables: string[] = Object.keys(payload.contentVariables ?? {}).filter(key => key.trim() !== '')
  const filteredVariables: string[] = Object.keys(variables).filter((v) => !selectedVariables.includes(v))

  return {
      choices: filteredVariables.map((key) => ({
            label: key,
            value: key
      }))
  }
}