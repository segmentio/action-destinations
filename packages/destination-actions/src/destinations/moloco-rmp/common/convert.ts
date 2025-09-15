import { PayloadValidationError } from '@segment/actions-core'
import { EventType } from './event'
import { Settings } from '../generated-types'
import {
  EventPayload as SegmentEventPayload,
  ItemPayload as SegmentItemPayload,
  DevicePayload as SegmentDevicePayload
} from './payload/segment'
import {
  EventPayload as MolocoEventPayload,
  ItemPayload as MolocoItemPayload,
  DevicePayload as MolocoDevicePayload
} from './payload/moloco'


// This function coverts the SegmentEventPayload to MolocoEventPayload
// SegmentEventPayload is the payload that went through the mapping defined in the Segment UI
// MolocoEventPayload is the payload that will be sent to the Moloco MCM API
export function convertEvent(args: { eventType: EventType, payload: SegmentEventPayload, settings: Settings }): MolocoEventPayload {
  const { eventType, payload, settings } = args;

  return {
    event_type: eventType,
    channel_type: settings.channel_type,
    timestamp: payload.timestamp,
    id: payload.event_id ?? undefined,
    user_id: payload.user_id ?? undefined,
    device: payload.device ? convertDevicePayload(payload.device): undefined,
    session_id: payload.session_id ?? undefined,
    revenue: payload.revenue ? {
      amount: payload.revenue.price,
      currency: payload.revenue.currency
    } : undefined,
    search_query: payload.search_query ?? undefined,
    referrer_page_id: payload.referrer_page_id ?? undefined,
    shipping_charge: payload.shipping_charge ?{
      amount: payload.shipping_charge.price,
      currency: payload.shipping_charge.currency
    }: undefined,
    items: payload.items ? payload.items.map(item => convertItemPayload({ payload: item, defaultCurrency: payload.default_currency })) : undefined,
    page_id: payload.page_id || (payload.page_identifier_tokens ? convertPageIdentifierTokensToPageId(payload.page_identifier_tokens) : undefined)
  } as MolocoEventPayload
}

function convertItemPayload(args: { payload: SegmentItemPayload, defaultCurrency: string | undefined }): MolocoItemPayload {
  const { payload, defaultCurrency } = args;
  
  const actualCurrency = payload.currency ?? defaultCurrency

  if ((payload.price !== undefined && actualCurrency === undefined) || (payload.price === undefined && actualCurrency !== undefined)) {
    throw new PayloadValidationError('Price and Currency/Default Currency should be both present or both absent');
  }

  return {
    id: payload.id,
    quantity: payload.quantity,
    seller_id: payload.seller_id,
    price: payload.price && actualCurrency ? {
      amount: payload.price,
      currency: actualCurrency
    } : undefined
  } as MolocoItemPayload;
}

function convertOs(os: string): string {
  os = os.toUpperCase();

  if (os === 'IPADOS') {
    os = 'IOS';
  }

  return os
}

function convertDevicePayload(payload: SegmentDevicePayload): MolocoDevicePayload {
  return {
    os: payload.os ? convertOs(payload.os) : undefined,
    os_version: payload.os_version ?? undefined,
    advertising_id: payload.advertising_id ?? undefined,
    unique_device_id: payload.unique_device_id ?? undefined,
    model: payload.model ?? undefined,
    ua: payload.ua ?? undefined,
    language: payload.language ?? undefined,
    ip: payload.ip ?? undefined,
  } as MolocoDevicePayload
}

function convertPageIdentifierTokensToPageId(tokens: { [k: string]: unknown } | undefined): string {
  if (tokens === undefined) {
    return ''
  }
  return Object.entries(tokens).map(([key, value]) => `${key}:${value}`).join(';')
}
