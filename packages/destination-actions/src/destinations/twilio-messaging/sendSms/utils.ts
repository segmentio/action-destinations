import { Payload } from './generated-types'

export function validate (payload: Payload): Payload {
    const { chooseSender, messagingServiceSid, from, chooseTemplateType, templateSID, body } = payload
   
    if(chooseSender === 'from' && !from) {
        throw new Error('From is required when choosing sender as From')
    }
    if(chooseSender === 'messagingServiceSid' && !messagingServiceSid) {
        throw new Error('Messaging Service SID is required when choosing sender as Messaging Service SID')
    }
    if(chooseTemplateType === 'templateSID' && !templateSID) {
        throw new Error('Template SID is required when choosing template type as Pre-defined template')
    }
    if(chooseTemplateType === 'inline' && !body) {
        throw new Error('Template Body is required when choosing template type as Inline')
    }
    return payload
}