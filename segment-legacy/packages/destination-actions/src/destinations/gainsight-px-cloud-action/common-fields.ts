import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  segmentEvent: {
    label: 'Segment Event',
    type: 'object',
    description: 'The raw Segment event',
    required: false,
    default: {
      '@path': '$.'
    }
  }
}
