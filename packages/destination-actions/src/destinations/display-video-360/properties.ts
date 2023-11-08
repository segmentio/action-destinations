import { InputField } from '@segment/actions-core/destination-kit/types'

export const user_identifier: InputField = {
  label: 'User Identifier',
  description:
    'The type of identifier for the user to add to the audience. Can only be one of the following. Basic User Lists only support Publisher Provided ID. Customer Match Lists support all four identifiers.',
  type: 'string',
  required: true,
  choices: [
    { label: 'Publisher Provided ID', value: 'publisherProvidedId' },
    { label: 'Hashed Email', value: 'hashedEmail' },
    { label: 'Hashed Phone Number', value: 'hashedPhoneNumber' },
    { label: 'Mobile ID', value: 'mobileId' }
  ],
  default: 'publisherProvidedId'
}

export const identifier_value: InputField = {
  label: 'Identifier Value',
  description: 'The value of the identifier for the user to add to the audience.',
  type: 'string',
  required: true,
  default: {
    '@path': '$.anonymousId'
  }
}

export const enable_batching: InputField = {
  label: 'Enable Batching',
  description: 'Enable batching of requests to the TikTok Audiences.',
  type: 'boolean',
  default: true,
  required: true
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
