export const INSERT_TYPES = [
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Upsert', value: 'upsert' }
]

export const SUPPORTED_HUBSPOT_OBJECT_TYPES = [
  { label: 'Contact', value: 'contact' },
  { label: 'Company', value: 'company' },
  { label: 'Deal', value: 'deal' },
  { label: 'Ticket', value: 'ticket' },
  { label: 'Line Item', value: 'line_item' },
  { label: 'Subscription', value: 'subscription' },
  { label: 'Product', value: 'product' },
  { label: 'Appointment', value: '0-421' },
  { label: 'Order', value: 'order' },
  { label: 'Quote', value: 'quote' }
]

export const MAX_HUBSPOT_BATCH_SIZE = 100

// hs_object_id is HubSpot's internal record id. It is not a unique property in the sense the
// batch APIs expect, so it must be passed as the record id with idProperty omitted entirely.
export const HS_OBJECT_ID = 'hs_object_id'

export const ENGAGE_AUDIENCE_COMPUTATION_CLASSES = ['audience', 'journey_step']
