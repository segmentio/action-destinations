import { InputField } from '@segment/actions-core/destination-kit/types'

export const list_id: InputField = {
  label: 'List Id',
  description: `'Insert the ID of the default list that you'd like to subscribe users to when you call .identify().'`,
  type: 'string',
  default: {
    '@path': '$.context.personas.external_audience_id'
  },
  unsafe_hidden: true,
  required: true
}

export const email: InputField = {
  label: 'Email',
  description: `The user's email to send to Klavio.`,
  type: 'string',
  default: {
    '@path': '$.context.traits.email'
  }
}

export const external_id: InputField = {
  label: 'External ID',
  description: `A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system. One of External ID and Email required.`,
  type: 'string'
}

export const enable_batching: InputField = {
  type: 'boolean',
  label: 'Batch Data to Klaviyo',
  description: 'When enabled, the action will use the klaviyo batch API.',
  default: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  required: false,
  unsafe_hidden: true,
  default: 10000
}

export const first_name: InputField = {
  label: 'First Name',
  description: `Individual's first name.`,
  type: 'string',
  default: { '@path': '$.properties.firstName' }
}

export const last_name: InputField = {
  label: 'Last Name',
  description: `Individual's last name.`,
  type: 'string',
  default: { '@path': '$.properties.lastName' }
}

export const organization: InputField = {
  label: 'Organization',
  description: `Name of the company or organization within the company for whom the individual works.`,
  type: 'string',
  default: { '@path': '$.properties.company.name' }
}

export const title: InputField = {
  label: 'Title',
  description: `Individual's job title.`,
  type: 'string',
  default: { '@path': '$.properties.title' }
}

export const image: InputField = {
  label: 'Image',
  description: `URL pointing to the location of a profile image.`,
  type: 'string',
  default: { '@path': '$.properties.avatar' }
}

export const location: InputField = {
  label: 'Location',
  description: `Individual's address.`,
  type: 'object',
  properties: {
    address1: {
      label: 'Address 1',
      type: 'string',
      allowNull: true
    },
    address2: {
      label: 'Address 2',
      type: 'string',
      allowNull: true
    },
    city: {
      label: 'City',
      type: 'string',
      allowNull: true
    },
    region: {
      label: 'Region',
      type: 'string',
      allowNull: true
    },
    zip: {
      label: 'ZIP',
      type: 'string',
      allowNull: true
    },
    latitude: {
      label: 'Latitude',
      type: 'string',
      allowNull: true
    },
    longitude: {
      label: 'Longitide',
      type: 'string',
      allowNull: true
    },
    country: {
      label: 'Country',
      type: 'string',
      allowNull: true
    }
  },
  default: {
    city: { '@path': '$.properties.address.city' },
    region: { '@path': '$.properties.address.state' },
    zip: { '@path': '$.properties.address.postal_code' },
    address1: { '@path': '$.properties.address.street' },
    country: { '@path': '$.properties.address.country' }
  }
}

export const properties: InputField = {
  description: 'An object containing key/value pairs for any custom properties assigned to this profile.',
  label: 'Properties',
  type: 'object',
  default: { '@path': '$.properties.properties' }
}
