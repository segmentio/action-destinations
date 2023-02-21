import { InputField } from '@segment/actions-core'

export const enable_batching: InputField = {
  type: 'boolean',
  label: 'Send multiple profiles in a single request',
  description:
    'When enabled, the action will send upto 100 profiles in a single request. When disabled, the action will send 1 profile per request.',
  default: true
}
