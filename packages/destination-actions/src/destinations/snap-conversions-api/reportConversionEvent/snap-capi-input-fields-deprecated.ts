import { InputField } from '@segment/actions-core/destination-kit/types'

const brands: InputField = {
  label: 'Brand',
  description: 'Brand associated with the item. This field accepts a string or a list of strings',
  type: 'string',
  multiple: true,
  default: {
    '@path': '$.properties.brand'
  }
}

const description: InputField = {
  label: 'Description',
  description: 'A string description for additional info.',
  type: 'string'
}

const device_model: InputField = {
  label: 'Device Model',
  description: 'The user’s device model.',
  type: 'string'
}

const email: InputField = {
  label: 'Email',
  description:
    'Email address of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).',
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.properties.email' },
      then: { '@path': '$.properties.email' },
      else: { '@path': '$.traits.email' }
    }
  }
}

const ip_address: InputField = {
  label: 'IP Address',
  description:
    'IP address of the device or browser. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).',
  type: 'string',
  default: {
    '@path': '$.context.ip'
  }
}

const item_category: InputField = {
  label: 'Item Category',
  description: 'Category of the item. This field accepts a string.',
  type: 'string',
  default: {
    '@path': '$.properties.category'
  }
}

const item_ids: InputField = {
  label: 'Item ID',
  description:
    'Identfier for the item. International Article Number (EAN) when applicable, or other product or category identifier.',
  type: 'string',
  default: {
    '@path': '$.properties.product_id'
  }
}

const level: InputField = {
  label: 'Level',
  description: 'Represents a level in the context of a game.',
  type: 'string'
}

const number_items: InputField = {
  label: 'Number of Items',
  description: 'Number of items. This field accepts a string only. e.g. "5"',
  type: 'string',
  default: {
    '@path': '$.properties.quantity'
  }
}

const os_version: InputField = {
  label: 'OS Version',
  description: 'The user’s OS version.',
  type: 'string'
}

const phone_number: InputField = {
  label: 'Phone Number',
  description:
    'Phone number of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).',
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.properties.phone' },
      then: { '@path': '$.properties.phone' },
      else: { '@path': '$.traits.phone' }
    }
  }
}

const user_agent: InputField = {
  label: 'User Agent',
  description:
    'User agent from the user’s device. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).',
  type: 'string',
  default: {
    '@path': '$.context.userAgent'
  }
}

const snap_capi_input_fields_deprecated = {
  brands,
  description,
  device_model,
  email,
  ip_address,
  item_category,
  item_ids,
  level,
  number_items,
  os_version,
  phone_number,
  user_agent
}

export default snap_capi_input_fields_deprecated
