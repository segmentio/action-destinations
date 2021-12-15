export const BaseApiUrl = 'https://api.voyagetext.com/api/v1'

export const EventApiUri = '/customEvent'

export const EventEndpoint = BaseApiUrl + EventApiUri

export type EventBody<EventMeta> = {
  eventTypeId: number
  phone: string
  subscriberId?: string
  eventMeta: EventMeta
}
