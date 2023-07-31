import { InputField } from '@segment/actions-core/destination-kit/types'

export const selected_advertiser_id: InputField = {
  label: 'Advertiser ID',
  description: 'The advertiser ID to use when syncing audiences.',
  type: 'string',
  dynamic: true,
  required: true
}

export const id_type: InputField = {
  label: 'ID Type',
  description:
    'Encryption type to be used for populating the audience. This field is set only when Segment creates a new audience.',
  type: 'string',
  choices: [
    { label: 'Email', value: 'EMAIL_SHA256' },
    { label: 'Google Advertising ID', value: 'GAID_SHA256' },
    { label: 'Android Advertising ID', value: 'AAID_SHA256' },
    { label: 'iOS Advertising ID', value: 'IDFA_SHA256' }
  ],
  required: true
}

export const audience_id: InputField = {
  label: 'Audience ID',
  description:
    'Audience ID for the TikTok Audience you want to sync your Engage audience to. This is returned after you create an audience and can also be found in the TikTok Audiences dashboard.',
  type: 'string',
  dynamic: true,
  required: true
}

export const custom_audience_name: InputField = {
  label: 'Custom Audience Name',
  description:
    'Custom audience name of audience to be created. Please note that names over 70 characters will be truncated to 67 characters with "..." appended.',
  type: 'string',
  required: true
}

export const email: InputField = {
  label: 'User Email',
  description: "The user's email address to send to TikTok.",
  type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.traits.email' in Personas events.
  default: {
    '@path': '$.context.traits.email'
  }
}

export const send_email: InputField = {
  label: 'Send Email',
  description: 'Send email to TikTok. Segment will hash this value before sending',
  type: 'boolean',
  default: true
}

export const advertising_id: InputField = {
  label: 'User Advertising ID',
  description: "The user's mobile advertising ID to send to TikTok. This could be a GAID, IDFA, or AAID",
  type: 'hidden', // This field is hidden from customers because the desired value always appears at path '$.context.device.advertisingId' in Personas events.
  default: {
    '@path': '$.context.device.advertisingId'
  }
}

export const send_advertising_id: InputField = {
  label: 'Send Mobile Advertising ID',
  description:
    'Send mobile advertising ID (IDFA, AAID or GAID) to TikTok. Segment will hash this value before sending.',
  type: 'boolean',
  default: true
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
