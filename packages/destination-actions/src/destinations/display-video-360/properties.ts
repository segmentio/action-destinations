import { InputField } from '@segment/actions-core/destination-kit/types'

export const mobile_advertising_id: InputField = {
  label: 'Mobile Advertising ID',
  description: 'Mobile Advertising ID. Android Advertising ID or iOS IDFA.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.context.device.advertisingId'
  }
}

export const google_gid: InputField = {
  label: 'Google GID',
  description:
    'Google GID - ID is deprecated in some areas and will eventually sunset.  ID is included for those who were on the legacy destination.',
  type: 'string',
  required: false,
  default: {
    '@path': '$.context.DV360.google_gid'
  }
}

export const partner_provided_id: InputField = {
  label: 'Partner Provided ID',
  description:
    'Partner Provided ID - Equivalent to the Segment Anonymous ID.  Segment Audience must include Anonymous Ids to match effectively.',
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
