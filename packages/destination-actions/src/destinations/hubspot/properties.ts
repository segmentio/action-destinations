// HubSpot API Base URL
export const HUBSPOT_BASE_URL = 'https://api.hubapi.com'

// Unique property to map Segment Group ID a HubSpot Company CRM Object
export const SEGMENT_UNIQUE_IDENTIFIER = 'segment_group_id'

// Association identifier for HubSpot
export const ASSOCIATION_TYPE = 'company_to_contact'

// The date-based API takes a numeric type ID in place of the legacy name. 'company_to_contact' resolves to 2
// (HubSpot then adds the unlabeled 280 itself), so 2 keeps date-based associations identical to legacy ones
export const ASSOCIATION_TYPE_ID = 2
