export declare const BaseApiUrl = 'https://api.voyagetext.com/api/v1'
export declare const EventApiUri = '/customEvent'
export declare const EventEndpoint: string
export declare const EventTypeId = 7310
declare type EventBody<EventMeta> = {
  eventTypeId: number
  phone: string
  subscriberId?: string
  eventMeta: EventMeta
}
declare type OrderPlacedPayload = {
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
export declare type OrderPlacedBody = EventBody<OrderPlacedPayload>
export {}
