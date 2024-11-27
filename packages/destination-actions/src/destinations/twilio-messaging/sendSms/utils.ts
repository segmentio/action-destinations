import { PayloadValidationError } from '@segment/actions-core/*'
import { Payload } from './generated-types'
import { E164_REGEX, FIELD_REGEX, MESSAGING_SERVICE_SID_REGEX, TEMPLATE_SID_REGEX, TEMPLATE_TYPE, SENDER_TYPE } from './constants'

export function validate (payload: Payload): Payload & { urls: string[] } {
    const { 
        senderType, 
        templateType, 
        inlineBody, 
    } = payload

    let {
        fromPhoneNumber,
        toPhoneNumber,
        templateSid,
        messagingServiceSid
    } = payload 
    
    let numMediaUrls = 0
    const urls = validateMediaUrls(payload)
    numMediaUrls = urls.length

    toPhoneNumber = toPhoneNumber.trim()
    if(!E164_REGEX.test(toPhoneNumber)){
        throw new PayloadValidationError("'To' field should be a valid phone number in E.164 format")
    }

    if(senderType === SENDER_TYPE.PHONE_NUMBER) {
        fromPhoneNumber = fromPhoneNumber?.trim()

        if(!fromPhoneNumber){
            throw new PayloadValidationError("'From' field is required when choosing sender as From")
        }

        if(!E164_REGEX.test(fromPhoneNumber)){
            throw new PayloadValidationError("'From' field should be a valid phone number in E.164 format")
        }
    }
    
    if (senderType === SENDER_TYPE.MESSAGING_SERVICE) {
        messagingServiceSid = parseFieldValue(messagingServiceSid)
        if (!messagingServiceSid) {
            throw new PayloadValidationError("'Messaging Service SID' field is required when 'Choose Sender' field = Messaging Service SID");
        }
        if (!MESSAGING_SERVICE_SID_REGEX.test(messagingServiceSid ?? "")) {
            throw new PayloadValidationError("'Messaging Service SID' field value should start with 'MG' followed by 32 hexadecimal characters, totaling 34 characters.");
        }
    }
    
    if (templateType === TEMPLATE_TYPE.PRE_DEFINED) {
        templateSid = parseFieldValue(templateSid)
        if (!templateSid && numMediaUrls === 0) {
            throw new PayloadValidationError("At least one of 'Pre-defined Template SID' or 'Media URL' fields are required when 'Template Type' = Pre-defined");
        }
        if (templateSid && !TEMPLATE_SID_REGEX.test(templateSid)) {
            throw new PayloadValidationError("Template SID should start with 'HX' followed by 32 hexadecimal characters.");
        }
    }

    if(templateType === TEMPLATE_TYPE.INLINE && !inlineBody && (numMediaUrls === 0)) {
        throw new PayloadValidationError("At least one of 'Inline Template' or 'Media URL' fields are required when 'Template Type' = Inline")
    }

    return { ...payload, fromPhoneNumber, toPhoneNumber, templateSid, messagingServiceSid, urls}
}

export function parseFieldValue(value: string | undefined | null): string | undefined {
    if(!value) {
        return undefined
    }
    const match = FIELD_REGEX.exec(value)
    return match ? match[1] : value
}

export function validateMediaUrls(payload: Payload): string[]{
    const { templateType, mediaUrls, inlineMediaUrls } = payload
    const urls: string[]  = templateType === TEMPLATE_TYPE.PRE_DEFINED ? mediaUrls?.map((item) => item.url) ?? [] : inlineMediaUrls?.filter((item) => item.trim() !== '') ?? []
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
    return urls
}