import { RequestClient, ErrorCodes } from '@segment/actions-core'
import { ParsedFacebookError, NonFacebookError, FacebookResponseError, CreateAudienceRequest, CreateAudienceResponse, GetAudienceResponse } from './types'
import { API_VERSION, BASE_URL } from './constants'

export function parseFacebookError(error: FacebookResponseError): ParsedFacebookError {
  const {
    response: {
      status,
      data: {
        error: {
          message: fbMessage,
          type,
          code,
          error_user_title,
          error_user_msg
        } = {}
      } = {}
    } = {},
    message: outerMessage
  } = (error ?? {})

  const parts = [
    error_user_title && `error_user_title: "${error_user_title}"`,
    error_user_msg && `error_user_msg: "${error_user_msg}"`,
    fbMessage && `fbmessage: "${fbMessage}"`,
    outerMessage && `message: "${outerMessage}"`,
    code && `code: "${code}"`
  ]

  const message = parts.filter(Boolean).join('. ').trim() || 'An unknown error occurred while communicating with Facebook API.'

  return {
    message,
    code: type || ErrorCodes.UNKNOWN_ERROR,
    status: status ?? 400
  }
}

export async function createAudience(request: RequestClient, name: string, adAccountId: string, description?: string): Promise<{ data?: { externalId: string }, error?: NonFacebookError }> {
  if (!name) {
    return { error: { message: 'Missing audience name value', code: ErrorCodes.CREATE_AUDIENCE_FAILED } }
  }
  if (!adAccountId) {
    return { error: { message: 'Missing ad account ID value', code: ErrorCodes.CREATE_AUDIENCE_FAILED } }
  }

  const url = `${BASE_URL}/${API_VERSION}/act_${
    adAccountId.startsWith('act_') ? adAccountId.slice(4) : adAccountId
  }/customaudiences`

  const json: CreateAudienceRequest = {
    name,
    subtype: 'CUSTOM',
    customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED',
    ...(description ? { description } : {})
  }

  try {
    const response = await request<CreateAudienceResponse>(url, {
      method: 'post',
      json
    })

    const r = await response.json()
    const id = r.id

    if (!id) {
      return {
        error: {
          message: 'Invalid response from create audience request',
          code: ErrorCodes.CREATE_AUDIENCE_FAILED 
        }
      }
    }
    return { data: { externalId: id } }
  } 
  catch (error) {
    const { message } = parseFacebookError(error as FacebookResponseError)
    return { error: { message, code: ErrorCodes.CREATE_AUDIENCE_FAILED } }
  }
}

export async function getAudience(request: RequestClient, externalId: string): Promise<{ data?: { externalId?: string; name: string }, error?: NonFacebookError }> {
  const url = `${BASE_URL}/${API_VERSION}/${externalId}`

  try {
    const response = await request<GetAudienceResponse>(url, { method: 'GET' })
    const r = await response.json()
    const { id, name } = r

    if (!id) {
      return { error: { message: 'Invalid response from get audience request', code: ErrorCodes.GET_AUDIENCE_FAILED }}
    }
    if (externalId !== id) {
      return { error: { message: `Audience not found. Audience ID mismatch. Expected: ${externalId}, Received: ${id}`, code: ErrorCodes.GET_AUDIENCE_FAILED } }
    }
    return {
      data: {
        externalId: id,
        name: name || ''
      }
    }
  } catch (error) {
    const { message } = parseFacebookError(error as FacebookResponseError)
    return { error: { message, code: ErrorCodes.GET_AUDIENCE_FAILED } }
  }
}
