import { Features } from '@segment/actions-core'
import { HUBSPOT_BASE_URL } from './properties'

export const HUBSPOT_DATE_BASED_API_VERSION_FLAG = 'actions-hubspot-date-based-api-version' // gitleaks:allow

export const HUBSPOT_DATE_BASED_API_VERSION = '2026-03'

/** Deprecated 2027-02-16. */
export const HUBSPOT_LEGACY_OAUTH_API_VERSION = 'v1'

const LEGACY_CRM_API_VERSION = 'v3'
const LEGACY_CRM_ASSOCIATIONS_API_VERSION = 'v4'

/** Copy paths verbatim from HubSpot's docs; the two schemes do not map onto each other by rule. */
export interface HubspotUrls {
  objects: string
  /** Record-level associations, served from a different family than `associations`. */
  recordAssociations: string
  properties: string
  schemas: string
  lists: string
  associations: string
  events: string
}

const DATE_BASED_URLS: HubspotUrls = {
  objects: `${HUBSPOT_BASE_URL}/crm/objects/${HUBSPOT_DATE_BASED_API_VERSION}`,
  recordAssociations: `${HUBSPOT_BASE_URL}/crm/objects/${HUBSPOT_DATE_BASED_API_VERSION}`,
  properties: `${HUBSPOT_BASE_URL}/crm/properties/${HUBSPOT_DATE_BASED_API_VERSION}`,
  schemas: `${HUBSPOT_BASE_URL}/crm-object-schemas/${HUBSPOT_DATE_BASED_API_VERSION}/schemas`,
  lists: `${HUBSPOT_BASE_URL}/crm/lists/${HUBSPOT_DATE_BASED_API_VERSION}`,
  associations: `${HUBSPOT_BASE_URL}/crm/associations/${HUBSPOT_DATE_BASED_API_VERSION}`,
  events: `${HUBSPOT_BASE_URL}/events/${HUBSPOT_DATE_BASED_API_VERSION}`
}

const LEGACY_URLS: HubspotUrls = {
  objects: `${HUBSPOT_BASE_URL}/crm/${LEGACY_CRM_API_VERSION}/objects`,
  recordAssociations: `${HUBSPOT_BASE_URL}/crm/${LEGACY_CRM_ASSOCIATIONS_API_VERSION}/objects`,
  properties: `${HUBSPOT_BASE_URL}/crm/${LEGACY_CRM_API_VERSION}/properties`,
  schemas: `${HUBSPOT_BASE_URL}/crm/${LEGACY_CRM_API_VERSION}/schemas`,
  lists: `${HUBSPOT_BASE_URL}/crm/${LEGACY_CRM_API_VERSION}/lists`,
  associations: `${HUBSPOT_BASE_URL}/crm/${LEGACY_CRM_ASSOCIATIONS_API_VERSION}/associations`,
  events: `${HUBSPOT_BASE_URL}/events/${LEGACY_CRM_API_VERSION}`
}

export function useDateBasedApiVersion(features?: Features): boolean {
  return features?.[HUBSPOT_DATE_BASED_API_VERSION_FLAG] === true
}

/** Absent `features` resolves to legacy: destination-kit does not populate it everywhere. */
export function hubspotUrls(features?: Features): HubspotUrls {
  return useDateBasedApiVersion(features) ? DATE_BASED_URLS : LEGACY_URLS
}
