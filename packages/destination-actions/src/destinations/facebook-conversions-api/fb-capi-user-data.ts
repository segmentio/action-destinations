import { InputField } from '@segment/actions-core/src/destination-kit/types'
import { createHash } from 'crypto'
import { US_STATE_CODES, COUNTRY_CODES } from './constants'
import { Payload } from './addToCart/generated-types'

// Implementation of Facebook user data object
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
export const user_data_field: InputField = {
  label: 'User Data',
  description:
  'These parameters are a set of identifiers Facebook can use for targeted attribution. You must provide at least one of the following user_data keys in your request. More information on recommended User Data parameters in Facebook’s [Best Practices for Conversions API](https://www.facebook.com/business/help/308855623839366?id=818859032317965).',
  type: 'object',
  required: true,
  properties: {
    externalId: {
      label: 'External ID',
      description:
        'Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.',
      type: 'string'
    },
    email: {
      label: 'Email',
      description: 'An email address, in lowercase. Example: joe@eg.com',
      type: 'string'
    },
    phone: {
      label: 'Phone',
      description:
        'A phone number. Include only digits with country code, area code, and number. Remove symbols, letters, and any leading zeros. In addition, always include the country code as part of the customer phone number, even if all of the data is from the same country, as the country code is used for matching.',
      type: 'string'
    },
    gender: {
      label: 'Gender',
      description: 'Gender, in lowercase. Either f or m.',
      type: 'string'
    },
    dateOfBirth: {
      label: 'Date of Birth',
      description: 'A date of birth given as year, month, and day. Example: 19971226 for December 26, 1997.',
      type: 'string'
    },
    lastName: {
      label: 'Last Name',
      description: 'A last name in lowercase.',
      type: 'string'
    },
    firstName: {
      label: 'First Name',
      description: 'A first name in lowercase.',
      type: 'string'
    },
    city: {
      label: 'City',
      description: 'A city in lower-case without spaces or punctuation. Example: menlopark.',
      type: 'string'
    },
    state: {
      label: 'State',
      description: 'A two-letter state code in lowercase. Example: ca.',
      type: 'string'
    },
    zip: {
      label: 'Zip Code',
      description:
        'If you are in the United States, this is a five-digit zip code. For other locations, follow each country`s standards. Example: 94035 (for United States)',
      type: 'string'
    },
    country: {
      label: 'Country',
      description: 'A two-letter country code in lowercase.',
      type: 'string'
    },
    client_ip_address: {
      label: 'Client IP Address',
      description: 'The IP address of the browser corresponding to the event.',
      type: 'string'
    },
    client_user_agent: {
      label: 'Client User Agent',
      description:
        'The user agent for the browser corresponding to the event. client_user_agent is required if action_source = “website”; however it is strongly recommended that you include it for any action_source.',
      type: 'string'
    },
    fbc: {
      label: 'Click ID',
      description: 'The Facebook click ID value stored in the _fbc browser cookie under your domain.',
      type: 'string'
    },
    fbp: {
      label: 'Browser ID',
      description: 'The Facebook browser ID value stored in the _fbp browser cookie under your domain.',
      type: 'string'
    },
    subscriptionID: {
      label: 'Subscription ID',
      description: 'The subscription ID for the user in this transaction.',
      type: 'string'
    },
    leadID: {
      label: 'Lead ID',
      description: 'ID associated with a lead generated by Facebook`s Lead Ads.',
      type: 'integer'
    },
    fbLoginID: {
      label: 'Facebook Login ID',
      description: 'ID issued by Facebook when a person first logs into an instance of an app.',
      type: 'integer'
    }
  },
  default: {
    externalId: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    },
    email: {
      '@path': '$.context.traits.email'
    },
    phone: {
      '@path': '$.context.traits.phone'
    },
    dateOfBirth: {
      '@path': '$.context.traits.birthday'
    },
    lastName: {
      '@path': '$.context.traits.lastName'
    },
    firstName: {
      '@path': '$.context.traits.firstName'
    },
    city: {
      '@path': '$.context.traits.address.city'
    },
    state: {
      '@path': '$.context.traits.address.state'
    },
    zip: {
      '@path': '$.context.traits.address.postalCode'
    },
    client_ip_address: {
      '@path': '$.context.ip'
    },
    client_user_agent: {
      '@path': '$.context.userAgent'
    },
    fbc: {
      '@path': '$.properties.fbc'
    },
    fbp: {
      '@path': '$.properties.fbp'
    }
  }
}

type UserData = Pick<Payload, 'user_data'>

const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

// Normalization of user data properties according to Facebooks specifications.
// https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences#hash
export const normalize_user_data = (payload: UserData) => {
  if (payload.user_data.email) {
    // Regex removes all whitespace in the string.
    payload.user_data.email = payload.user_data.email.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.phone) {
    // Regex removes all non-numeric characters from the string.
    payload.user_data.phone = payload.user_data.phone.replace(/\D/g, '')
  }

  if (payload.user_data.gender) {
    payload.user_data.gender = payload.user_data.gender.replace(/\s/g, '').toLowerCase()
    switch (payload.user_data.gender) {
      case 'male':
        payload.user_data.gender = 'm'
        break
      case 'female':
        payload.user_data.gender = 'f'
        break
    }
  }

  if (payload.user_data.lastName) {
    payload.user_data.lastName = payload.user_data.lastName.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.firstName) {
    payload.user_data.firstName = payload.user_data.firstName.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.city) {
    payload.user_data.city = payload.user_data.city.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.state) {
    payload.user_data.state = payload.user_data.state.replace(/\s/g, '').toLowerCase()

    if (US_STATE_CODES.has(payload.user_data.state)) {
      payload.user_data.state = US_STATE_CODES.get(payload.user_data.state)
    }
  }

  if (payload.user_data.zip) {
    payload.user_data.zip = payload.user_data.zip.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.country) {
    payload.user_data.country = payload.user_data.country.replace(/\s/g, '').toLowerCase()

    if (COUNTRY_CODES.has(payload.user_data.country)) {
      payload.user_data.country = COUNTRY_CODES.get(payload.user_data.country)
    }
  }

  if (payload.user_data.externalId) {
    payload.user_data.externalId = payload.user_data.externalId.replace(/\s/g, '').toLowerCase()
  }
}

export const hash_user_data = (payload: UserData): Object => {
  normalize_user_data(payload)

  return {
    em: hash(payload.user_data?.email),
    ph: hash(payload.user_data?.phone),
    ge: hash(payload.user_data?.gender),
    db: hash(payload.user_data?.dateOfBirth),
    ln: hash(payload.user_data?.lastName),
    fn: hash(payload.user_data?.firstName),
    ct: hash(payload.user_data?.city),
    st: hash(payload.user_data?.state),
    zp: hash(payload.user_data?.zip),
    country: hash(payload.user_data?.country),
    external_id: hash(payload.user_data?.externalId), // Hashing this is recommended but not required.
    client_ip_address: payload.user_data?.client_ip_address,
    client_user_agent: payload.user_data?.client_user_agent,
    fbc: payload.user_data?.fbc,
    fbp: payload.user_data?.fbp,
    subscription_id: payload.user_data?.subscriptionID,
    lead_id: payload.user_data?.leadID,
    fb_login_id: payload.user_data?.fbLoginID
  }
}
