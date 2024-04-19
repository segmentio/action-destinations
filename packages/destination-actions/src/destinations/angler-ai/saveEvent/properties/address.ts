import { InputField, PathDirective } from '@segment/actions-core/index'

export const addressProperties: Record<string, InputField> = {
  address1: {
    label: 'Address 1',
    type: 'string',
    description: 'The first line of the address. This is usually the street address or a P.O. Box number.'
  },
  address2: {
    label: 'Address 2',
    type: 'string',
    description: 'The second line of the address. This is usually an apartment, suite, or unit number.'
  },
  city: {
    label: 'City',
    type: 'string',
    description: 'The name of the city, district, village, or town.'
  },
  country: {
    label: 'Country',
    type: 'string',
    description: 'The name of the country.'
  },
  countryCode: {
    label: 'Country Code',
    type: 'string',
    description:
      'The two-letter code that represents the country, for example, US. The country codes generally follow ISO 3166-1 alpha-2 guidelines.'
  },
  firstName: {
    label: 'First Name',
    type: 'string',
    description: "The customer's first name."
  },
  lastName: {
    label: 'Last Name',
    type: 'string',
    description: "The customer's last name."
  },
  phone: {
    label: 'Phone',
    type: 'string',
    description: 'The phone number for this mailing address as entered by the customer.'
  },
  province: {
    label: 'Province',
    type: 'string',
    description: 'The region of the address, such as the province, state, or district.'
  },
  provinceCode: {
    label: 'Province Code',
    type: 'string',
    description: 'The two-letter code for the region. For example, ON.'
  },
  zip: {
    label: 'ZIP',
    type: 'string',
    description: 'The ZIP or postal code of the address.'
  }
}

export function addressDefaultFields(path = ''): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    address1: { '@path': `${path}address1` },
    address2: { '@path': `${path}address2` },
    city: { '@path': `${path}city` },
    country: { '@path': `${path}country` },
    countryCode: { '@path': `${path}countryCode` },
    firstName: { '@path': `${path}firstName` },
    lastName: { '@path': `${path}lastName` },
    phone: { '@path': `${path}phone` },
    province: { '@path': `${path}province` },
    provinceCode: { '@path': `${path}provinceCode` },
    zip: { '@path': `${path}zip` }
  }
}
