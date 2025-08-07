import { InputField } from '@segment/actions-core'
import { CRM } from '../constants'

export const crm_fields: Record<string, InputField> = {
  lead_fields: {
    label: 'CRM Fields',
    type: 'object',
    description: 'Fields related to CRM events.',
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      lead_id: {
        label: 'TikTok Lead ID',
        description:
          'ID of TikTok leads. Every lead will have its own lead_id when exported from TikTok. This feature is in Beta. Please contact your TikTok representative to inquire regarding availability',
        type: 'string'
      },
      lead_event_source: {
        label: 'TikTok Lead Event Source',
        description:
          'Lead source of TikTok leads. Please set this field to the name of your CRM system, such as HubSpot or Salesforce.',
        type: 'string'
      }
    },
    default: {
      lead_id: { '@path': '$.properties.lead_id' },
      lead_event_source: { '@path': '$.properties.lead_event_source' }
    },
    required: {
      conditions: [
        {
          fieldKey: 'event_source',
          operator: 'is',
          value: CRM
        }
      ]
    },
    depends_on: {
      conditions: [
        {
          fieldKey: 'event_source',
          operator: 'is',
          value: CRM
        }
      ]
    }
  }
}
