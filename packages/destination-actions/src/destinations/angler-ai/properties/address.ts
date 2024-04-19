import { PathDirective, InputField } from '@segment/actions-core'

export const addressProperties: Record<string, InputField> = {
  id: {
    label: 'ID',
    type: 'string',
    description: 'A unique identifier for the address.'
  },
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
  company: {
    label: 'Company',
    type: 'string',
    description: "The customer's company."
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
  country_name: {
    label: 'Country Name',
    type: 'string',
    description: "The customer's normalized country name."
  },
  customer_id: {
    label: 'Customer ID',
    type: 'string',
    description: 'A unique identifier for the customer.'
  },
  default: {
    label: 'Default',
    type: 'boolean',
    description: 'Whether this address is the default address for the customer.'
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
  name: {
    label: 'Name',
    type: 'string',
    description: "The customer's first and last names."
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
  },
  hashed_first_name: {
    label: 'Hashed First Name',
    type: 'string',
    description: 'Hashed value of first name in SHA256 (lower case).'
  },
  hashed_last_name: {
    label: 'Hashed Last Name',
    type: 'string',
    description: 'Hashed value of last name in SHA256 (lower case).'
  },
  hashed_phone: {
    label: 'Hashed Phone',
    type: 'string',
    description: 'Hashed value of phone in SHA256 (lower case).'
  },
  hashed_address1: {
    label: 'Hashed Address 1',
    type: 'string',
    description: 'Hashed value of address1 in SHA256 (lower case).'
  },
  hashed_address2: {
    label: 'Hashed Address 2',
    type: 'string',
    description: 'Hashed value of address2 in SHA256 (lower case).'
  },
  hashed_city: {
    label: 'Hashed City',
    type: 'string',
    description: 'Hashed value of city in SHA256 (lower case).'
  },
  hashed_zip: {
    label: 'Hashed Zip',
    type: 'string',
    description: 'Hashed value of zip in SHA256 (lower case).'
  },
  hashed_country_code: {
    label: 'Hashed Country Code',
    type: 'string',
    description: 'Hashed value of country code in SHA256 (lower case).'
  }
}

export function addressDefaultFields(path = ''): Record<string, PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    id: { '@path': `${path}id` },
    address1: { '@path': `${path}address1` },
    address2: { '@path': `${path}address2` },
    city: { '@path': `${path}city` },
    company: { '@path': `${path}company` },
    country: { '@path': `${path}country` },
    country_code: { '@path': `${path}country_code` },
    country_name: { '@path': `${path}country_name` },
    customer_id: { '@path': `${path}customer_id` },
    default: { '@path': `${path}default` },
    first_name: { '@path': `${path}first_name` },
    last_name: { '@path': `${path}last_name` },
    name: { '@path': `${path}name` },
    phone: { '@path': `${path}phone` },
    province: { '@path': `${path}province` },
    province_code: { '@path': `${path}province_code` },
    zip: { '@path': `${path}zip` },
    hashed_first_name: { '@path': `${path}hashed_first_name` },
    hashed_last_name: { '@path': `${path}hashed_last_name` },
    hashed_phone: { '@path': `${path}hashed_phone` },
    hashed_address1: { '@path': `${path}hashed_address1` },
    hashed_address2: { '@path': `${path}hashed_address2` },
    hashed_city: { '@path': `${path}hashed_city` },
    hashed_zip: { '@path': `${path}hashed_zip` },
    hashed_country_code: { '@path': `${path}hashed_country_code` }
  }
}
