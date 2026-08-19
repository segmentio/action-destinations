import { HS_OBJECT_ID } from '../constants'

/**
 * hs_object_id is HubSpot's internal record id rather than a unique property, so the batch object
 * APIs reject it as an idProperty. It must be sent as the record id with idProperty omitted.
 */
export function isHubspotRecordId(idFieldName: string): boolean {
  return idFieldName === HS_OBJECT_ID
}

/**
 * Returns the idProperty to spread into a batch object request, or nothing when the identifier is
 * hs_object_id.
 */
export function maybeIdProperty(idFieldName: string): { idProperty?: string } {
  return isHubspotRecordId(idFieldName) ? {} : { idProperty: idFieldName }
}

/**
 * Returns the identifier to spread into a record's properties so a newly created record carries it.
 * hs_object_id is assigned by HubSpot and read-only, so it is never written.
 */
export function maybeIdentifierProperty(idFieldName: string, idFieldValue: string): Record<string, string> {
  return isHubspotRecordId(idFieldName) ? {} : { [idFieldName]: idFieldValue }
}
