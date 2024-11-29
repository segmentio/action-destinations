import { PayloadValidationError } from '@segment/actions-core/*'
import { Payload } from './generated-types'
import { TOKEN_REGEX, E164_REGEX, FIELD_REGEX, MESSAGING_SERVICE_SID_REGEX, TEMPLATE_SID_REGEX, MESSAGE_TYPE, SENDER_TYPE } from './constants'

export function validate (payload: Payload): Payload {
    const { 
        messageType, 
        senderType,
    } = payload

    let {
        fromPhoneNumber,
        toPhoneNumber,
        messagingServiceSid,
        templateSid
    } = payload 

    const validateToPhoneNumber = () => {
        toPhoneNumber = toPhoneNumber.trim()
        if(!E164_REGEX.test(toPhoneNumber)){
            throw new PayloadValidationError("'To' field should be a valid phone number in E.164 format")
        }
        return toPhoneNumber
    }

    const validateFromPhoneNumber = () => {
        if(senderType === SENDER_TYPE.PHONE_NUMBER) {
            fromPhoneNumber = fromPhoneNumber?.trim()
            if(!fromPhoneNumber){
                throw new PayloadValidationError("'From' field is required when choosing sender as From")
            }
            if(!E164_REGEX.test(fromPhoneNumber)){
                throw new PayloadValidationError("'From' field should be a valid phone number in E.164 format")
            }
        }
        return fromPhoneNumber ?? undefined
    }

    const validateMessagingServiceSid = () => {
        if(senderType === SENDER_TYPE.MESSAGING_SERVICE) {
            messagingServiceSid = parseFieldValue(messagingServiceSid)
            if (!messagingServiceSid) {
                throw new PayloadValidationError("'Messaging Service SID' field is required when 'Choose Sender' field = Messaging Service SID");
            }
            if (!MESSAGING_SERVICE_SID_REGEX.test(messagingServiceSid ?? "")) {
                throw new PayloadValidationError("'Messaging Service SID' field value should start with 'MG' followed by 32 hexadecimal characters, totaling 34 characters.");
            }
        }
        return messagingServiceSid ?? undefined
    }

    const validateTemplateSid = () => {
        if(messageType !== MESSAGE_TYPE.INLINE.value) {
            templateSid = parseFieldValue(templateSid)
            if (templateSid && !TEMPLATE_SID_REGEX.test(templateSid)) {
                throw new PayloadValidationError("Template SID should start with 'HX' followed by 32 hexadecimal characters.");
            }
        }
        return templateSid ?? undefined
    }

    toPhoneNumber = validateToPhoneNumber()
    fromPhoneNumber = validateFromPhoneNumber()
    messagingServiceSid = validateMessagingServiceSid()
    templateSid = validateTemplateSid()

    return { ...payload, fromPhoneNumber, toPhoneNumber, templateSid, messagingServiceSid}
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

export function validateMediaUrls(urls: string[]) {
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
}