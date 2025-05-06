export interface DubTrackLeadPayload {
  clickId: string;
  eventName: string;
  externalId: string;
  eventQuantity?: number;
  customerName?: string;
  customerEmail?: string;
  customerAvatar?: string;
  metadata?: Record<string, unknown>;
}
