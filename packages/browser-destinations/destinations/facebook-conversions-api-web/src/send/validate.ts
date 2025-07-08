import { Payload } from './generated-types'

export function validate(payload: Payload) {
    const { 
        event_config: { event_name },
        content_ids,
        contents
    } = payload

    if(['AddToCart', 'Purchase', 'ViewContent'].includes(event_name)){
        if(content_ids?.length === 0 || contents?.length === 0) {
            throw new Error(`content_ids or contents are required for event ${event_name}`)
        }
    }
}