import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse, JSONObject } from '@segment/actions-core'
import {
  TOKEN_REGEX,
  CONTENT_SID_TOKEN,
  ACCOUNT_SID_TOKEN,
  GET_INCOMING_PHONE_NUMBERS_URL,
  GET_INCOMING_SHORT_CODES_URL,
  GET_MESSAGING_SERVICE_SIDS_URL,
  GET_ALL_CONTENTS_URL,
  GET_CONTENT_VARIABLES_URL,
  GET_CONTENT_URL,
  INLINE_CONTENT_TYPES,
  PREDEFINED_CONTENT_TYPES,
  SENDER_TYPE,
  CHANNELS
} from './constants'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { parseFieldValue, validateContentSid } from './utils'
import { ContentTypeName, Channel } from './types'

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
    error: { message: message ?? 'Unknown error', code: code ?? '404' }
  }
}

async function getData<T>(request: RequestClient, url: string): Promise<T | ErrorResponse> {
  try {
    const response = await request(url, {
      method: 'GET',
      skipResponseCloning: true
    })
    return response as unknown as T
  } catch (err) {
    const error = err as ResultError
    return createErrorResponse(error.response.data.message, String(error.response.data.status))
  }
}

export async function dynamicSenderType(payload: Payload): Promise<DynamicFieldResponse> {
  const { channel } = payload

  if (!channel) {
    return createErrorResponse("Select from 'Channel' field first.")
  }

  if (channel === CHANNELS.MESSENGER) {
    return {
      choices: [
        { label: SENDER_TYPE.MESSENGER_SENDER_ID, value: SENDER_TYPE.MESSENGER_SENDER_ID },
        { label: SENDER_TYPE.MESSAGING_SERVICE, value: SENDER_TYPE.MESSAGING_SERVICE }
      ]
    }
  } else {
    return {
      choices: [
        { label: SENDER_TYPE.PHONE_NUMBER, value: SENDER_TYPE.PHONE_NUMBER },
        { label: SENDER_TYPE.MESSAGING_SERVICE, value: SENDER_TYPE.MESSAGING_SERVICE }
      ]
    }
  }
}

export async function dynamicFromPhoneNumber(
  request: RequestClient,
  payload: Payload,
  settings: Settings
): Promise<DynamicFieldResponse> {
  interface PhoneNumResponseType {
    data: {
      incoming_phone_numbers: Array<{
        phone_number: string
        capabilities: {
          sms: boolean
          mms: boolean
          rcs: boolean
        }
      }>
    }
  }

  interface ShortCodeResponseType {
    data: {
      short_codes: Array<{
        short_code: string
        sms_url: string | null
      }>
    }
  }

  const { channel } = payload
  const numbers: string[] = []
  const supportsShortCodes = channel === CHANNELS.SMS || channel === CHANNELS.MMS || channel === CHANNELS.RCS

  if (channel === CHANNELS.MESSENGER) {
    return createErrorResponse("Use 'From Messenger Sender ID' field for specifying the sender ID.")
  }

  if (channel === CHANNELS.WHATSAPP) {
    return createErrorResponse(
      'For WhatsApp channel, please manually enter your WhatsApp Business phone number in E.164 format.'
    )
  }

  if (supportsShortCodes) {
    const shortCodeResp = await getData<ShortCodeResponseType>(
      request,
      GET_INCOMING_SHORT_CODES_URL.replace(ACCOUNT_SID_TOKEN, settings.accountSID)
    )

    if (isErrorResponse(shortCodeResp)) {
      return shortCodeResp
    }

    const shortCodes: string[] = shortCodeResp.data?.short_codes
      .filter(
        (s) => (channel === CHANNELS.MMS && s.sms_url !== null) || channel === CHANNELS.SMS || channel === CHANNELS.RCS
      )
      .map((s) => s.short_code)

    numbers.push(...shortCodes)
  }

  const PhoneNumResp = await getData<PhoneNumResponseType>(
    request,
    GET_INCOMING_PHONE_NUMBERS_URL.replace(ACCOUNT_SID_TOKEN, settings.accountSID)
  )

  if (isErrorResponse(PhoneNumResp)) {
    return PhoneNumResp
  }

  const phoneNumbers: string[] = PhoneNumResp.data.incoming_phone_numbers
    .filter(
      (n) =>
        (channel === CHANNELS.SMS && n.capabilities.sms) ||
        (n.capabilities.mms && channel === CHANNELS.MMS) ||
        (n.capabilities.rcs && channel === CHANNELS.RCS)
    )
    .map((n) => n.phone_number)

  numbers.push(...phoneNumbers)
  numbers.sort((a, b) => a.length - b.length || a.localeCompare(b))

  if (numbers.length === 0) {
    return createErrorResponse(
      `No phone numbers ${supportsShortCodes ? 'or short codes' : ''} found. Please create a phone number ${
        supportsShortCodes ? 'or short code' : ''
      } in your Twilio account.`
    )
  }

  return {
    choices: numbers.map((n) => {
      return {
        label: n,
        value: n
      }
    })
  }
}

export async function dynamicMessagingServiceSid(
  request: RequestClient,
  settings: Settings
): Promise<DynamicFieldResponse> {
  interface ResponseType {
    data: {
      services: Array<{
        account_sid: string
        friendly_name: string
        sid: string
      }>
    }
  }

  const response = await getData<ResponseType>(
    request,
    GET_MESSAGING_SERVICE_SIDS_URL.replace(ACCOUNT_SID_TOKEN, settings.accountSID)
  )

  if (isErrorResponse(response)) {
    return response
  }

  const sids = response.data.services ?? []

  if (sids.length === 0) {
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

export async function dynamicContentTemplateType(payload: Payload): Promise<DynamicFieldResponse> {
  const { channel } = payload

  if (!channel) {
    return createErrorResponse("Select from 'Channel' field first.")
  }

  return await Promise.resolve({
    choices: Object.values({ ...INLINE_CONTENT_TYPES, ...PREDEFINED_CONTENT_TYPES })
      .filter((t) => t.supported_channels.includes(channel as Channel))
      .map((t) => ({
        label: t.friendly_name,
        value: t.friendly_name
      }))
  })
}

export async function dynamicContentSid(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
  interface ResponseType {
    data: {
      contents: Array<{
        friendly_name: string
        sid: string
        types: {
          [key in ContentTypeName]: JSONObject
        }
      }>
    }
  }

  const { contentTemplateType } = payload

  if (contentTemplateType === INLINE_CONTENT_TYPES.INLINE.friendly_name) {
    return createErrorResponse("Inline messages do not use 'pre-defined' Content Templates.")
  }

  const response = await getData<ResponseType>(request, GET_ALL_CONTENTS_URL)

  if (isErrorResponse(response)) {
    return response
  }

  const contents = response.data.contents ?? []

  if (contents.length === 0) {
    return createErrorResponse('No Content Templates found. Please create a Content Template in Twilio first.')
  }

  const name = Object.values(PREDEFINED_CONTENT_TYPES).find((type) => type.friendly_name === contentTemplateType)
    ?.name as ContentTypeName

  return {
    choices: contents
      .filter((c) => c.types[name])
      .map((c) => ({
        label: `${c.friendly_name} [${c.sid}]`,
        value: `${c.friendly_name} [${c.sid}]`
      }))
  }
}

export async function dynamicMediaUrls(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
  interface ResponseType {
    data: {
      friendly_name: string
      sid: string
      types: {
        [key in ContentTypeName]: {
          media: string[]
        }
      }
    }
  }

  const { contentTemplateType, mediaUrls } = payload
  const contentSid = parseFieldValue(payload.contentSid)

  if (contentTemplateType === INLINE_CONTENT_TYPES.INLINE.friendly_name) {
    return createErrorResponse("Use the 'Inline Media URLs' field for specifying Media URLs for an inline message.")
  }
  if ([undefined, '', null].includes(contentSid)) {
    return createErrorResponse("Select 'Content Template SID' first.")
  }
  if (validateContentSid(contentSid as string) === false) {
    return createErrorResponse('Invalid Content Template SID. SID should match with the pattern HX[0-9a-fA-F]{32}')
  }

  const response = await getData<ResponseType>(
    request,
    GET_CONTENT_URL.replace(CONTENT_SID_TOKEN, contentSid as string)
  )

  if (isErrorResponse(response)) {
    return response
  }

  const name = Object.values(PREDEFINED_CONTENT_TYPES).find((type) => type.friendly_name === contentTemplateType)
    ?.name as ContentTypeName

  const urls = response.data?.types?.[name]?.media ?? []

  if (urls.length === 0) {
    return createErrorResponse(
      'No Media URLs found for this Content Template. If media files are required please create them in Twilio first.'
    )
  }

  const selectedUrls: string[] = mediaUrls?.map((m) => m.url) ?? []

  const filteredUrls = urls.filter((url) => !selectedUrls.includes(url))

  if (filteredUrls.length === 0) {
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
      types: JSONObject
    }
  }

  const contentSid = parseFieldValue(payload.contentSid)

  if (!contentSid) {
    return createErrorResponse("Select from 'Content Template' field first")
  }

  const response = await getData<ResponseType>(
    request,
    GET_CONTENT_VARIABLES_URL.replace(CONTENT_SID_TOKEN, contentSid)
  )

  if (isErrorResponse(response)) {
    return response
  }

  const types = response?.data?.types ?? {}
  const variables = [...JSON.stringify(types).matchAll(TOKEN_REGEX)].map((match) => match[1])

  if (variables.length === 0) {
    return createErrorResponse(
      'No Variables found for the selected Content Template. If variable are required please createthem in Twilio first.'
    )
  }

  const selectedVariables: string[] = Object.keys(payload.contentVariables ?? {}).filter((key) => key.trim() !== '')
  const filteredVariables: string[] = variables.filter((v) => !selectedVariables.includes(v))

  return {
    choices: filteredVariables.map((key) => ({
      label: key,
      value: key
    }))
  }
}
