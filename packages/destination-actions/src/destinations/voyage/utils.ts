import { VOYAGE_API_VERSION } from '../versioning-info'

export const BaseApiUrl = `https://api.voyagetext.com/api/${VOYAGE_API_VERSION}`

export const EventApiUri = '/customEvent'

export const EventEndpoint = BaseApiUrl + EventApiUri

export const EventTypeId = 7310

type EventBody<EventMeta> = {
  eventTypeId: number
  phone: string
  subscriberId?: string
  eventMeta: EventMeta
}

type OrderPlacedPayload = {
  DateCreated: string | number
  OrderNumber?: string
  SourceId?: string
  TokenId?: string
  CustomerId: string
  Url: string
  OrderTotal: number
  TotalSpent: number
  FirstName?: string
  LastName?: string
  Phone: string
  Email?: string
  Zip: string
  LastUpdated?: string | number
  ProductImageUrl?: string
  LinkReference?: string
  HomepageUrl?: string
}

export type OrderPlacedBody = EventBody<OrderPlacedPayload>
