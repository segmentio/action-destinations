import { PayloadValidationError } from '@segment/actions-core/*'
import { Payload } from './generated-types'
import { E164_REGEX, MESSAGING_SERVICE_SID_REGEX, TEMPLATE_SID_REGEX } from './constants'

export function validate (payload: Payload): Payload {
    const { chooseSender, messagingServiceSid, chooseTemplateType, templateSID, body, media_url } = payload
    let numMediaUrls = 0

    payload.to = payload.to.trim()
    if(!E164_REGEX.test(payload.to)){
        throw new Error("'To' field should be a valid phone number in E.164 format")
    }

    if(media_url) {
        if(media_url.length > 10){
            throw new Error('Media URL cannot contain more than 10 URLs')
        }
        media_url.some(url => {
            try {
                new URL(url)
                return false
            } catch {
                throw new PayloadValidationError(`Media URL ${url} is not a valid URL.`)
            }
        })
        numMediaUrls = media_url.length
    }

    if(chooseSender === 'from') {
        if(!payload.from){
            throw new Error("'From' field is required when choosing sender as From")
        }

        payload.from = payload.from.trim()

        if(!E164_REGEX.test(payload.from)){
            throw new Error("'From' field should be a valid phone number in E.164 format")
        }
    }
    
    if (chooseSender === 'messagingServiceSid') {
        if (!messagingServiceSid) {
            throw new Error("'Messaging Service SID' field is required when 'Choose Sender' field = Messaging Service SID");
        }
        if (!MESSAGING_SERVICE_SID_REGEX.test(messagingServiceSid ?? "")) {
            throw new Error("'Messaging Service SID' field value should start with 'MG' followed by 32 hexadecimal characters, totaling 34 characters.");
        }
    }
    
    if (chooseTemplateType === 'templateSID') {
        if (!templateSID && numMediaUrls === 0) {
            throw new Error("At least one of 'Pre-defined Template SID' or 'Media URL' fields are required when 'Template Type' = Pre-defined");
        }
        if (templateSID && !TEMPLATE_SID_REGEX.test(templateSID)) {
            throw new Error("Template SID should start with 'HX' followed by 32 hexadecimal characters.");
        }
    }

    if(chooseTemplateType === 'inline' && !body && (numMediaUrls === 0)) {
        throw new Error("At least one of 'Inline Template' or 'Media URL' fields are required when 'Template Type' = Inline")
    }

    if(chooseTemplateType === 'mediaOnly' && (numMediaUrls === 0)) {
        throw new Error("'Media URL' field is required when 'Template Type' = Media only")
    }

    return payload
}

export function parseFieldValue(value: string | undefined | null): string | undefined {
    if(!value) {
        return undefined
    }
    const regex = /\[(.*?)\]/
    const match = regex.exec(value)
    return match ? match[1] : value
}