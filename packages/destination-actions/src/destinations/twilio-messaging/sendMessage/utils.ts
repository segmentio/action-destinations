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
  ALL_CONTENT_TYPES
} from './constants'
import { TwilioPayload, Sender, Content } from './types'

export async function send(request: RequestClient, payload: Payload, settings: Settings) {
  let { toPhoneNumber, fromPhoneNumber, messagingServiceSid, contentSid } = payload

  const {
    channel,
    senderType,
    contentVariables,
    validityPeriod,
    sendAt,
    inlineMediaUrls,
    inlineBody,
    contentTemplateType,
    tags
  } = payload

  const getTo = (): string => {
    switch (channel) {
      case 'SMS':
      case 'MMS':
      case 'RCS': {
        toPhoneNumber = toPhoneNumber?.trim() ?? ''
        if (!(E164_REGEX.test(toPhoneNumber) || TWILIO_SHORT_CODE_REGEX.test(toPhoneNumber))) {
          throw new PayloadValidationError(
            "'To' field should be a valid phone number in E.164 format or a Twilio Short Code"
          )
        }
        return toPhoneNumber
      }
      case 'Whatsapp': {
        toPhoneNumber = toPhoneNumber?.trim() ?? ''
        if (!E164_REGEX.test(toPhoneNumber)) {
          throw new PayloadValidationError("'To' field should be a valid phone number in E.164 format")
        }
        return `whatsapp:${toPhoneNumber}`
      }
      default: {
        throw new PayloadValidationError('Unsupported Channel')
      }
    }
  }

  const getSendAt = () => (sendAt ? { SendAt: sendAt } : {})

  const getValidityPeriod = () => (validityPeriod ? { ValidityPeriod: validityPeriod } : {})

  const getSender = (): Sender => {
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
      return { MessagingServiceSid: messagingServiceSid }
    }
    throw new PayloadValidationError('Unsupported Sender Type')
  }

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

      tags[k] = trimmedValue

      if ((tags[k] as string).length > 128) {
        throw new PayloadValidationError(
          `Tag value for key "${k}" exceeds the maximum tag value length of 128 characters.`
        )
      }
    }

    if (Object.keys(tags as { [k: string]: string }).length > 10) {
      throw new PayloadValidationError('Tags cannot contain more than 10 key-value pairs.')
    }

    return Object.keys(tags as { [k: string]: string }).length > 0 ? { Tags: JSON.stringify(tags) } : undefined
  }

  const twilioPayload: TwilioPayload = (() => ({
    To: getTo(),
    ...getSendAt(),
    ...getValidityPeriod(),
    ...getSender(),
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
