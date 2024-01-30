import { EventType } from './event'
import { MolocoEventPayload } from './payload'
import { convertKeysToSnakeCase } from './utils'

interface EventSvcBodyPayload extends MolocoEventPayload {
    eventType: EventType
}

// This class is used to build the body of the event that will be sent to the Moloco RMP API
// Because Moloco RMP API requires the body to be in snake case, we need to convert the keys to snake case
// This class also adds the eventType field to the body
export class BodyBuilder {
    eventType: EventType

    constructor(eventType: EventType) {
        this.eventType = eventType
    }

    build(payload: MolocoEventPayload): Record<string, any> {
        const body = payload as EventSvcBodyPayload
        body.eventType = this.eventType

        return convertKeysToSnakeCase(body)
    }
}