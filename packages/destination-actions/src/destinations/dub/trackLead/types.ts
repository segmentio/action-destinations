export interface DubTrackLeadPayload {
  clickId: string
  eventName: string
  externalId: string
  eventQuantity?: number
  customerName?: string
  customerEmail?: string
  customerAvatar?: string
  metadata?: Record<string, unknown>
}

export interface DubTrackSalePayload {
  clickId: string
  eventName: string
  externalId: string
  amount?: number
  paymentProcessor?: string
  invoiceId?: string
  currency?: string
  leadEventName?: string
  metadata?: Record<string, unknown>
}
