import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import {
  SEND_SMS_URL,
  ACCOUNT_SID_TOKEN,
  E164_REGEX,
  TWILIO_SHORT_CODE_REGEX,
  FIELD_REGEX,
  MESSAGING_SERVICE_SID_REGEX,
  CONTENT_SID_REGEX,
  SENDER_TYPE,
  CHANNELS,
  ALL_CONTENT_TYPES,
  MIN_SCHEDULE_TIME_MS,
  MAX_SCHEDULE_TIME_MS
} from './constants'
import { TwilioPayload, Sender, Content, Schedule } from './types'

export async function send(request: RequestClient, payload: Payload, settings: Settings) {
  let { toPhoneNumber, contentSid, toMessengerUserId } = payload

  const { channel, contentVariables, validityPeriod, inlineMediaUrls, inlineBody, contentTemplateType, tags } = payload

  const getTo = (): string => {
    switch (channel) {
      case CHANNELS.SMS:
      case CHANNELS.MMS:
      case CHANNELS.RCS: {
        toPhoneNumber = toPhoneNumber?.trim() ?? ''
        if (!(E164_REGEX.test(toPhoneNumber) || TWILIO_SHORT_CODE_REGEX.test(toPhoneNumber))) {
          throw new PayloadValidationError(
            "'To' field should be a valid phone number in E.164 format or a Twilio Short Code"
          )
        }
        return toPhoneNumber
      }
      case CHANNELS.WHATSAPP: {
        toPhoneNumber = toPhoneNumber?.trim() ?? ''
        if (!E164_REGEX.test(toPhoneNumber)) {
          throw new PayloadValidationError("'To' field should be a valid phone number in E.164 format")
        }
        return `whatsapp:${toPhoneNumber}`
      }
      case CHANNELS.MESSENGER: {
        toMessengerUserId = toMessengerUserId?.trim() ?? ''
        return `messenger:${toMessengerUserId}`
      }
      default: {
        throw new PayloadValidationError('Unsupported Channel')
      }
    }
  }

  const getValidityPeriod = () => (validityPeriod ? { ValidityPeriod: validityPeriod } : {})

  const getContent = (): Content => {
    if (contentTemplateType === ALL_CONTENT_TYPES.INLINE.friendly_name) {
      return {
        Body: inlineBody || ''
      }
    }

    contentSid = parseFieldValue(contentSid)

    if (!contentSid) {
      throw new PayloadValidationError(
        "'Content Template SID' field value is required when sending a content template message."
      )
    }

    if (!CONTENT_SID_REGEX.test(contentSid)) {
      throw new PayloadValidationError(
        "'Content Template SID' field value should start with 'HX' followed by 32 hexadecimal characters."
      )
    }

    const contentTemplate: { ContentSid: string; ContentVariables?: string } = {
      ContentSid: contentSid
    }

    if (Object.keys(contentVariables ?? {}).length > 0) {
      contentTemplate.ContentVariables = JSON.stringify(contentVariables)
    }

    return contentTemplate
  }

  const getInlineMediaUrls = (): { MediaUrl: string[] } | {} => {
    if (contentTemplateType !== ALL_CONTENT_TYPES.INLINE.friendly_name) {
      return {}
    }

    if (!inlineMediaUrls || inlineMediaUrls.length === 0) {
      return {}
    }

    const urls: string[] = inlineMediaUrls.filter((item) => item.trim() !== '').map((item) => item.trim())

    if (urls.length > 10) {
      throw new PayloadValidationError('Media URL cannot contain more than 10 URLs')
    }

    urls.forEach((url) => {
      try {
        new URL(url)
      } catch {
        throw new PayloadValidationError(`Media URL ${url} is not a valid URL.`)
      }
    })

    return urls.length > 0 ? { MediaUrl: urls } : {}
  }

  const getTags = (): { [k: string]: string } | undefined => {
    if (!tags || typeof tags !== 'object') return undefined

    const allowedPattern = /^[a-zA-Z0-9 _-]+$/

    for (const k in tags) {
      const v = tags[k]

      if (v === null || String(v).trim() === '') {
        delete tags[k]
        continue
      }

      if (typeof v === 'object') {
        throw new PayloadValidationError(`Tag value for key "${k}" cannot be an object or array.`)
      }

      if (k.length > 128) {
        throw new PayloadValidationError(`Tag key "${k}" exceeds the maximum tag key length of 128 characters.`)
      }

      const trimmedValue = String(v).trim()

      // Validate allowed characters in key and value
      if (!allowedPattern.test(k)) {
        throw new PayloadValidationError(
          `Tag key "${k}" contains invalid characters. Only alphanumeric, space, hyphen (-), and underscore (_) are allowed.`
        )
      }

      if (!allowedPattern.test(trimmedValue)) {
        throw new PayloadValidationError(
          `Tag value "${trimmedValue}" for key "${k}" contains invalid characters. Only alphanumeric, space, hyphen (-), and underscore (_) are allowed.`
        )
      }

      if (trimmedValue.length > 128) {
        throw new PayloadValidationError(
          `Tag value for key "${k}" exceeds the maximum tag value length of 128 characters.`
        )
      }

      tags[k] = trimmedValue
    }

    if (Object.keys(tags as { [k: string]: string }).length > 10) {
      throw new PayloadValidationError('Tags cannot contain more than 10 key-value pairs.')
    }

    return Object.keys(tags as { [k: string]: string }).length > 0 ? { Tags: JSON.stringify(tags) } : undefined
  }

  const twilioPayload: TwilioPayload = (() => ({
    To: getTo(),
    ...getValidityPeriod(),
    ...getSender(payload),
    ...getContent(),
    ...getInlineMediaUrls(),
    ...getTags()
  }))()

  const encodedBody = encode(twilioPayload)

  return await request(SEND_SMS_URL.replace(ACCOUNT_SID_TOKEN, settings.accountSID), {
    method: 'post',
    body: encodedBody
  })
}

export function parseFieldValue(value: string | undefined | null): string | undefined {
  if (!value) {
    return undefined
  }
  const match = FIELD_REGEX.exec(value)
  return match ? match[1] : value
}

function encode(twilioPayload: TwilioPayload): string {
  const encodedSmsBody = new URLSearchParams()

  Object.entries(twilioPayload).forEach(([key, value]) => {
    if (key === 'MediaUrl' && Array.isArray(value)) {
      value.forEach((url) => {
        encodedSmsBody.append('MediaUrl', url)
      })
    } else {
      encodedSmsBody.append(key, String(value))
    }
  })

  return encodedSmsBody.toString()
}

export function validateContentSid(contentSid: string) {
  return /^HX[0-9a-fA-F]{32}$/.test(contentSid)
}

export function getSender(payload: Payload): Sender {
  const { sendAt, senderType, channel } = payload
  let { fromPhoneNumber, messagingServiceSid, fromFacebookPageId } = payload

  if (senderType === SENDER_TYPE.PHONE_NUMBER) {
    fromPhoneNumber = fromPhoneNumber?.trim()
    if (!fromPhoneNumber) {
      throw new PayloadValidationError("'From Phone Number' field is required when sending from a phone number.")
    }
    if (!E164_REGEX.test(fromPhoneNumber)) {
      // TODO - how to support short codes?
      throw new PayloadValidationError("'From' field should be a valid phone number in E.164 format")
    }
    return channel === CHANNELS.WHATSAPP ? { From: `whatsapp:${fromPhoneNumber}` } : { From: fromPhoneNumber }
  }
  if (senderType === SENDER_TYPE.FACEBOOK_PAGE_ID) {
    fromFacebookPageId = fromFacebookPageId?.trim()
    if (!fromFacebookPageId) {
      throw new PayloadValidationError("'From Facebook Page ID' field is required when sending from a Facebook Page.")
    }
    return { From: `messenger:${fromFacebookPageId}` }
  }
  if (senderType === SENDER_TYPE.MESSAGING_SERVICE) {
    messagingServiceSid = parseFieldValue(messagingServiceSid)
    if (!messagingServiceSid) {
      throw new PayloadValidationError(
        "'Messaging Service SID' field is required when 'Choose Sender' field = Messaging Service SID"
      )
    }
    if (!MESSAGING_SERVICE_SID_REGEX.test(messagingServiceSid ?? '')) {
      throw new PayloadValidationError(
        "'Messaging Service SID' field value should start with 'MG' followed by 32 hexadecimal characters, totaling 34 characters."
      )
    }
    return {
      MessagingServiceSid: messagingServiceSid,
      ...getSendAt(sendAt)
    }
  }
  throw new PayloadValidationError('Unsupported Sender Type')
}

export function getSendAt(sendAt: string | undefined): Schedule | {} {
  if (sendAt) {
    const t = new Date(sendAt).getTime() - new Date().getTime()
    if (t >= MIN_SCHEDULE_TIME_MS && t <= MAX_SCHEDULE_TIME_MS) {
      return { SendAt: sendAt, ScheduleType: 'fixed' }
    } else {
      throw new PayloadValidationError(
        `'Send At' time of ${sendAt} is invalid. It must be at least 15 minutes and at most 35 days in the future.`
      )
    }
  }
  return {}
}
