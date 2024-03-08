import { PayloadValidationError } from '@segment/actions-core'
import { EventType } from './event'
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
// MolocoEventPayload is the payload that will be sent to the Moloco RMP API
export function convertEvent(args: { eventType: EventType, payload: SegmentEventPayload }): MolocoEventPayload {
  const { eventType, payload } = args;

  const body: MolocoEventPayload = {
    event_type: eventType,
    channel_type: payload.channel_type,
    timestamp: payload.timestamp,
  };

  if (payload.event_id) {
    body.id = payload.event_id;
  }

  if (payload.user_id) {
    body.user_id = payload.user_id;
  }

  if (payload.device) {
    body.device = convertDevicePayload(payload.device);
  }
  
  if (payload.session_id) {
    body.session_id = payload.session_id;
  }

  if (payload.items) {
    body.items = []
    for (const item of payload.items) {
      const itemPayload = convertItemPayload({ payload: item, defaultCurrency: payload.default_currency });
      body.items.push(itemPayload);
    }
  }

  if (payload.revenue) {
    body.revenue = {
      amount: payload.revenue.price,
      currency: payload.revenue.currency
    }
  }

  if (payload.search_query) {
    body.search_query = payload.search_query;
  }

  if (payload.page_id || payload.page_identifier_tokens) {
    if (!(payload.page_id)) {
      body.page_id = convertPageIdentifierTokensToPageId(payload.page_identifier_tokens);
    } else {
      body.page_id = payload.page_id;
    }
  }

  if (payload.referrer_page_id) {
    body.referrer_page_id = payload.referrer_page_id;
  }

  if (payload.shipping_charge) {
    body.shipping_charge = {
      amount: payload.shipping_charge.price,
      currency: payload.shipping_charge.currency
    }
  }

  return body;
}

function convertItemPayload(args: { payload: SegmentItemPayload, defaultCurrency: string | undefined }): MolocoItemPayload {
  const { payload, defaultCurrency } = args;
  
  const itemPayload: MolocoItemPayload = {
    id: payload.id,
    quantity: payload.quantity,
    seller_id: payload.seller_id,
  }

  if (payload.price || payload.currency) {
    const currency = payload.currency || defaultCurrency;
  
    if (!(payload.price && currency)) {
      throw new PayloadValidationError('price and currency should be both present or both absent')
    }
    itemPayload.price = {
      amount: payload.price,
      currency: currency
    }
  }

  return itemPayload;
}

function convertOs(os: string): string {
  os = os.toUpperCase();

  if (os === 'IPADOS') {
    os = 'IOS';
  }

  return os
}

function convertDevicePayload(payload: SegmentDevicePayload): MolocoDevicePayload {
  const devicePayload: MolocoDevicePayload = {}

  if (payload.os) {
    devicePayload.os = convertOs(payload.os);
  }

  if (payload.os_version) {
    devicePayload.os_version = payload.os_version;
  }

  if (payload.advertising_id) {
    devicePayload.advertising_id = payload.advertising_id;
  }

  if (payload.unique_device_id) {
    devicePayload.unique_device_id = payload.unique_device_id;
  }

  if (payload.model) {
    devicePayload.model = payload.model;
  }

  if (payload.ua) {
    devicePayload.ua = payload.ua;
  }

  if (payload.language) {
    devicePayload.language = payload.language;
  }

  if (payload.ip) {
    devicePayload.ip = payload.ip;
  }

  return devicePayload
}

function convertPageIdentifierTokensToPageId(tokens: { [k: string]: unknown } | undefined): string {
  if (tokens === undefined) {
    return ''
  }
  return Object.entries(tokens).map(([key, value]) => `${key}:${value}`).join(';')
}
