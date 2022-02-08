import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  identifyByKey: {
    label: 'Contact IdentifyBy key',
    description:
      'Property key by which Cordial contact should be identified. May be any primary or secondary key (e.g. cID, email, segment_id etc.)',
    type: 'string',
    required: true
  },
  identifyByValue: {
    label: 'Contact IdentifyBy value',
    description: 'Value for defined key',
    type: 'string',
    required: true,
    default: {
      '@path': '$.userId'
    }
  }
}
