import { EventType } from './event'
import {
  EventPayload as SegmentEventPayload,
  ItemPayload as SegmentItemPayload,
  MoneyPayload as SegmentMoneyPayload,
  DevicePayload as SegmentDevicePayload
} from './payload/segment'
import {
  EventPayload as MolocoEventPayload,
  ItemPayload as MolocoItemPayload,
  MoneyPayload as MolocoMoneyPayload,
  DevicePayload as MolocoDevicePayload
} from './payload/moloco'


// This function coverts the SegmentEventPayload to MolocoEventPayload
// SegmentEventPayload is the payload that went through the mapping defined in the Segment UI
// MolocoEventPayload is the payload that will be sent to the Moloco RMP API
export function convertEvent(args: { eventType: EventType, payload: SegmentEventPayload} ): MolocoEventPayload {
  const { eventType, payload } = args;

  const body: MolocoEventPayload = {
    event_type: eventType,
    channel_type: payload.channelType,
    timestamp: payload.timestamp
  };

  if (payload.eventId) {
    body.event_id = payload.eventId;
  }

  if (payload.userId) {
    body.user_id = payload.userId;
  }

  if (payload.device) {
    body.device = convertDevicePayload(payload.device);
  }

  if (payload.sessionId) {
    body.session_id = payload.sessionId;
  }

  if (payload.decisionTrackId) {
    body.decision_track_id = payload.decisionTrackId;
  }

  if (payload.items) {
    body.items = payload.items.map(convertItemPayload);
  }

  if (payload.revenue) {
    body.revenue = convertMoneyPayload(payload.revenue);
  }

  if (payload.searchQuery) {
    body.search_query = payload.searchQuery;
  }

  if (payload.pageId) {
    body.page_id = payload.pageId;
  }

  if (payload.referrerPageId) {
    body.referrer_page_id = payload.referrerPageId;
  }

  if (payload.shippingCharge) {
    body.shipping_charge = convertMoneyPayload(payload.shippingCharge);
  }

  return body;
}

function convertMoneyPayload(payload: SegmentMoneyPayload): MolocoMoneyPayload {
  return {
    amount: payload.amount,
    currency: payload.currency
  }
}

function convertItemPayload(payload: SegmentItemPayload): MolocoItemPayload {
  const itemPayload: MolocoItemPayload = {
    id: payload.id
  }

  if (payload.price) {
    itemPayload.price = convertMoneyPayload(payload.price);
  }

  if (payload.quantity) {
    itemPayload.quantity = payload.quantity;
  }

  if (payload.itemGroupId) {
    itemPayload.item_group_id = payload.itemGroupId;
  }

  if (payload.sellerId) {
    itemPayload.seller_id = payload.sellerId;
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

  if (payload.osVersion) {
    devicePayload.os_version = payload.osVersion;
  }

  if (payload.advertisingId) {
    devicePayload.advertising_id = payload.advertisingId;
  }

  if (payload.uniqueDeviceId) {
    devicePayload.unique_device_id = payload.uniqueDeviceId;
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
