import { InputField } from '@segment/actions-core/destination-kit/types'

export const mobile_advertising_id: InputField = {
  label: 'Mobile Advertising ID',
  description: 'Mobile Advertising ID. This could be a GAID, or IDFA.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.context.device.advertisingId'
  }
}

export const google_gid: InputField = {
  label: 'Google GID',
  description: 'Google GID.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.context.traits.google_gid'
  }
}

export const partner_provided_id: InputField = {
  label: 'Partner Provided ID',
  description: 'Partner Provided ID.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.anonymousId'
  }
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests to the TikTok Audiences.',
  type: 'boolean',
  default: true,
  required: true,
  unsafe_hidden: true
}

export const external_audience_id: InputField = {
  label: 'External Audience ID',
  description: "The Audience ID in Google's DB.",
  type: 'string',
  required: true,
  unsafe_hidden: true,
  default: {
    '@path': '$.context.personas.external_audience_id'
  }
}
