


export interface EventJSON {
  data: Array<EventObject>
}

export interface EventObject {
    eventType: string
    eventId?: string
    eventName: string
    customData?: CustomData
}

export interface EventResponse {

}

export interface CustomData {

}