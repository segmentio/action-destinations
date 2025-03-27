import { InputField } from '@segment/actions-core/destination-kit/types'

export const selected_advertiser_id: InputField = {
  label: 'Advertiser ID',
  description: 'The advertiser ID to use when syncing audiences.',
  type: 'string',
  dynamic: true,
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
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.context.traits.email' },
      then: { '@path': '$.context.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  }
}

export const send_email: InputField = {
  label: 'Send Email?',
  description: 'Send email to TikTok. Segment will hash this value before sending',
  type: 'boolean',
  default: true
}

export const phone: InputField = {
  label: 'User Phone Number',
  description: "The user's phone number to send to TikTok.",
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.context.traits.phone' },
      then: { '@path': '$.context.traits.phone' },
      else: { '@path': '$.properties.phone' }
    }
  }
}

export const send_phone: InputField = {
  label: 'Send Phone Number?',
  description: 'Send phone number to TikTok. Segment will hash this value before sending',
  type: 'boolean',
  default: true
}

export const advertising_id: InputField = {
  label: 'User Advertising ID',
  description: "The user's mobile advertising ID to send to TikTok. This could be a GAID, IDFA, or AAID",
  type: 'string',
  default: {
    '@path': '$.context.device.advertisingId'
  }
}

export const send_advertising_id: InputField = {
  label: 'Send Mobile Advertising ID?',
  description:
    'Send mobile advertising ID (IDFA, AAID or GAID) to TikTok. Segment will hash this value before sending.',
  type: 'boolean',
  default: true
}

export const event_name: InputField = {
  label: 'Event Name',
  description: 'The name of the current Segment event.',
  type: 'string',
  unsafe_hidden: true, // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
  default: {
    '@path': '$.event'
  }
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests to the TikTok Audiences.',
  type: 'boolean',
  default: true,
  unsafe_hidden: true
}

export const external_audience_id: InputField = {
  label: 'External Audience ID',
  description: "The Audience ID in TikTok's DB.",
  type: 'string',
  unsafe_hidden: true,
  default: {
    '@path': '$.context.personas.external_audience_id'
  }
}
