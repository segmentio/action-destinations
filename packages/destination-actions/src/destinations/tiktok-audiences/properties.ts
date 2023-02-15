import { InputField } from '@segment/actions-core/src/destination-kit/types'

export const custom_audience_name: InputField = {
  label: 'Custom Audience Name',
  description:
    'Custom audience name of audience to be created. Please note that names over 70 characters will be truncated to 67 characters with "..." appended. This field is set only when Segment creates a new audience. Updating this field after Segment has created an audience will not update the audience name in TikTok.',
  type: 'string',
  default: {
    '@path': '$.properties.audience_key'
  }
}

export const id_type: InputField = {
  label: 'ID Type',
  description: 'Encryption type to be used for populating the audience.',
  type: 'string',
  choices: [
    { label: 'Email', value: 'EMAIL_SHA256' },
    { label: 'Phone', value: 'PHONE_SHA256' },
    { label: 'Google Advertising ID', value: 'GAID_SHA256' },
    { label: 'Android Advertising ID', value: 'AAID_SHA256' },
    { label: 'iOS Advertising ID', value: 'IDFA_SHA256' }
  ]
}

export const email: InputField = {
  label: 'User Email',
  description: "The user's email address to send to TikTok.",
  type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.traits.email' in Personas events.
  default: {
    '@path': '$.context.traits.email'
  }
}

export const phone: InputField = {
  label: 'User Phone',
  description: "The user's phone number to send to TikTok.",
  type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.traits.phone' in Personas events.
  default: {
    '@path': '$.context.traits.phone'
  }
}

export const advertising_id: InputField = {
  label: 'User Advertising ID',
  description: "The user's Advertising ID to send to TikTok. This could be a GAID, IDFA, or AAID",
  type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.device.advertisingId' in Personas events.
  default: {
    '@path': '$.context.device.advertisingId'
  }
}

export const event_name: InputField = {
  label: 'Event Name',
  description: 'The name of the current Segment event.',
  type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
  default: {
    '@path': '$.event'
  }
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests to the TikTok Audiences.',
  type: 'boolean',
  default: true
}

export const personas_audience_key: InputField = {
  label: 'Segment Engage Audience Key',
  description:
    'The `audience_key` of the Engage audience you want to sync to TikTok. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
  type: 'string'
}
