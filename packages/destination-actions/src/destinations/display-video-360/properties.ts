import { InputField } from '@segment/actions-core/destination-kit/types'

export const user_identifier: InputField = {
  label: 'User Identifier',
  description:
    'The identifier for the user to add to the audience. Can only be one of the following. Basic User Lists only support Publisher Provided ID. Customer Match Lists support all four identifiers.',
  type: 'string',
  required: true,
  choices: [
    { label: 'Publisher Provided ID', value: '$.anonymousId' },
    { label: 'Hashed Email', value: '$.email' },
    { label: 'Hashed Phone Number', value: '$.phoneNumber' },
    { label: 'Mobile ID', value: '$.context.device' } // TODO: Fix
  ],
  default: {
    '@path': '$.anonymousId'
  }
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests to the TikTok Audiences.',
  type: 'boolean',
  default: true
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
