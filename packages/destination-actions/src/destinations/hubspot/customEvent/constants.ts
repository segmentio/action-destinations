import { DependsOnConditions } from '@segment/actions-core/destination-kit/types'

export const SUPPORTED_HUBSPOT_OBJECT_TYPES = [
  { label: 'Contact', value: 'contact' },
  { label: 'Company', value: 'company' },
  { label: 'Deal', value: 'deal' },
  { label: 'Ticket', value: 'ticket' }
]

export const DEPENDS_ON_OBJECT_TYPE_CONTACT: DependsOnConditions = {
  match: 'all',
  conditions: [
    {
      fieldKey: 'object_type',
      operator: 'is',
      value: 'contact'
    }
  ]
}
