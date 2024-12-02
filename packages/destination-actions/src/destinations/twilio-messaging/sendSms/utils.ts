import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { SEND_SMS_URL, ACCOUNT_SID_TOKEN, TOKEN_REGEX, E164_REGEX, FIELD_REGEX, MESSAGING_SERVICE_SID_REGEX, CONTENT_SID_REGEX, MESSAGE_TYPE, ALL_MESSAGE_TYPES, SENDER_TYPE } from './constants'
import { TWILIO_PAYLOAD, Sender, MessageType } from './types'

export async function send(request: RequestClient, payload: Payload, settings: Settings) {
    let { 
        toPhoneNumber, 
        fromPhoneNumber, 
        messagingServiceSid,
        contentSid
    } = payload
    const { 
        senderType, 
        messageType, 
        contentVariables, 
        inlineBody, 
        inlineVariables, 
        validityPeriod,
        sendAt,
        mediaUrls,
        inlineMediaUrls,
    } = payload

    const getTo = (): string => {
        toPhoneNumber = toPhoneNumber.trim()
        if(!E164_REGEX.test(toPhoneNumber)){
            throw new PayloadValidationError("'To' field should be a valid phone number in E.164 format")
        }
        return toPhoneNumber
    }

    const getSendAt = () => sendAt ? { SendAt: sendAt } : {}

    const getValidityPeriod = () => validityPeriod ? { ValidityPeriod: validityPeriod } : {}

    const getSender = (): Sender => {
        if(senderType === SENDER_TYPE.PHONE_NUMBER) {
            fromPhoneNumber = fromPhoneNumber?.trim()
            if(!fromPhoneNumber){
                throw new PayloadValidationError("'From' field is required when choosing sender as From")
            }
            if(!E164_REGEX.test(fromPhoneNumber)){
                throw new PayloadValidationError("'From' field should be a valid phone number in E.164 format")
            }
            return { From: fromPhoneNumber }
        }
        if(senderType === SENDER_TYPE.MESSAGING_SERVICE) {
            messagingServiceSid = parseFieldValue(messagingServiceSid)
            if (!messagingServiceSid) {
                throw new PayloadValidationError("'Messaging Service SID' field is required when 'Choose Sender' field = Messaging Service SID");
            }
            if (!MESSAGING_SERVICE_SID_REGEX.test(messagingServiceSid ?? "")) {
                throw new PayloadValidationError("'Messaging Service SID' field value should start with 'MG' followed by 32 hexadecimal characters, totaling 34 characters.");
            }
            return { MessagingServiceSid: messagingServiceSid }
        }
        throw new PayloadValidationError("Unsupported Sender Type")
    }

    const getContent = (): MessageType => {
        contentSid = parseFieldValue(contentSid)
        
        if (contentSid && !CONTENT_SID_REGEX.test(contentSid)) {
            throw new PayloadValidationError("Content SID should start with 'HX' followed by 32 hexadecimal characters.")
        }
 
        if (messageType === MESSAGE_TYPE.INLINE.value && inlineBody) {
            return { Body: encodeURIComponent(replaceTokens(inlineBody, inlineVariables)) }
        }
        else {
            return {
            ContentSid: contentSid as string,
            ...(Object.keys(contentVariables ?? {}).length > 0 && { ContentVariables: JSON.stringify(contentVariables) })
            }
        }
    }

    const getMediaUrl = (): TWILIO_PAYLOAD['MediaUrl'] | {} => {
        const hasMedia = ALL_MESSAGE_TYPES[messageType as keyof typeof ALL_MESSAGE_TYPES]?.supports_media ?? false           
        
        if (hasMedia) {
            const urls: string[] = messageType === ALL_MESSAGE_TYPES.INLINE.friendly_name
                ? inlineMediaUrls
                    ?.filter((item) => item.trim() !== '')
                    .map((item) => replaceTokens(item.trim(), inlineVariables)) ?? []
                : mediaUrls
                    ?.map((item) => item.url.trim()) ?? []

            if(urls.length > 10){
                throw new PayloadValidationError('Media URL cannot contain more than 10 URLs')
            }  
        
            urls.filter(url => url.trim() !== "").some(url => {
                try {
                    new URL(url)
                    return false
                } catch {
                    throw new PayloadValidationError(`Media URL ${url} is not a valid URL.`)
                }
            })
     
            return { MediaUrl: urls }
        }
        return {}
    }

    const twilioPayload: TWILIO_PAYLOAD = (() => ({
        To: getTo(),
        ...getSendAt(),
        ...getValidityPeriod(),
        ...getSender(),
        ...getContent(),
        ...getMediaUrl()
    }))()

    const encodedSmsBody = new URLSearchParams()

    Object.entries(twilioPayload).forEach(([key, value]) => {
        if(key === 'MediaUrl' && Array.isArray(value)){
            value.forEach((url) => {
                encodedSmsBody.append(`MediaUrl`, url)
            })
        } else {
            encodedSmsBody.append(key, String(value))
        }
    })
    return await request(SEND_SMS_URL.replace(ACCOUNT_SID_TOKEN, settings.accountSID), {
        method: 'post',
        body: encodedSmsBody.toString()
    })
}

export function parseFieldValue(value: string | undefined | null): string | undefined {
    if(!value) {
        return undefined
    }
    const match = FIELD_REGEX.exec(value)
    return match ? match[1] : value
}

export function replaceTokens(str: string, tokens: {[k: string]:unknown} | undefined): string {
    return str.replace(TOKEN_REGEX, (_, key) => String(tokens?.[key] ?? ''))
}

export function validateContentSid(contentSid: string){
    return /^HX[0-9a-fA-F]{32}$/.test(contentSid)
}