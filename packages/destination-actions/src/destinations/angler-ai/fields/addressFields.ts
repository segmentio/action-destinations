import { PathDirective, InputField } from '@segment/actions-core'

export const addressProperties: Record<string, InputField> = {
  address1: {
    label: 'Address 1',
    type: 'string',
    description: "The customer's mailing address."
  },
  address2: {
    label: 'Address 2',
    type: 'string',
    description: "An additional field for the customer's mailing address."
  },
  city: {
    label: 'City',
    type: 'string',
    description: "The customer's city, town, or village."
  },
  country: {
    label: 'Country',
    type: 'string',
    description: "The customer's country."
  },
  country_code: {
    label: 'Country Code',
    type: 'string',
    description: "The two-letter country code corresponding to the customer's country"
  },
  first_name: {
    label: 'First Name',
    type: 'string',
    description: "The customer's first name."
  },
  last_name: {
    label: 'Last Name',
    type: 'string',
    description: "The customer's last name."
  },
  phone: {
    label: 'Phone',
    type: 'string',
    description: "The customer's phone number at this address."
  },
  province: {
    label: 'Province',
    type: 'string',
    description: "The customer's region name. Typically a province, a state, or a prefecture"
  },
  province_code: {
    label: 'Province Code',
    type: 'string',
    description:
      'The code for the region of the address, such as the province, state, or district. For example QC for Quebec, Canada.'
  },
  zip: {
    label: 'Zip',
    type: 'string',
    description: "The customer's postal code, also known as zip, postcode, Eircode, etc"
  }
}

export function addressDefaultFields(path = ''): Record<string, PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    address1: { '@path': `${path}address1` },
    address2: { '@path': `${path}address2` },
    city: { '@path': `${path}city` },
    country: { '@path': `${path}country` },
    country_code: { '@path': `${path}country_code` },
    first_name: { '@path': `${path}first_name` },
    last_name: { '@path': `${path}last_name` },
    phone: { '@path': `${path}phone` },
    province: { '@path': `${path}province` },
    province_code: { '@path': `${path}province_code` },
    zip: { '@path': `${path}zip` }
  }
}
