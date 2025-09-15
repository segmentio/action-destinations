export interface BingCAPIRequestItem {
  data: {
    userData: {
      clientUserAgent?: string
      anonymousId?:string
      externalId?: string
      em?: string
      ph?: string
      clientIpAddress?: string
      msclkid?: string
    }
    eventTime: number
    eventSourceUrl?: string
    eventType: 'pageLoad' | 'custom'
    eventId?: string
    eventName?: string
    pageLoadId?: string
    referrerUr?: string
    pageTitle?: string
    keywords?: string
    customData?: {
      eventCategory?: string
      eventLabel?: string
      eventValue?: number
      searchTerm?: string
      transactionId?: string
      currency?: string
      itemIds?: string[]
      pageType?: string
      ecommTotalValue?: number
      ecommCategory?: string
      items?: Array<{
        id?: string
        name?: string
        price?: number
        quantity?: number
      }>
      hotelData?: {
        totalPrice?: number
        basePrice?: number
        checkInDate?: string
        checkOutDate?: string
        lengthOfStay?: number
        partnerHotelId?: string
        bookingHref?:string
      }
    }
  }
}

export interface MSMultiStatusResponse {
  eventsReceived: number,
  error: {
    code: string,
    message: string,
    details: Array<{
      index: number,
      propertyName: string,
      attemptedValue: unknown,
      errorMessage: string
    }>
  },
  traceId: string
}