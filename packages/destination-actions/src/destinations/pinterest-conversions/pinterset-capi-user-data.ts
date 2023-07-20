import { InputField } from '@segment/actions-core/destination-kit/types'
import { createHash } from 'crypto'
import { Payload } from './reportConversionEvent/generated-types'
import isEmpty from 'lodash/isEmpty'

// Implementation of Pinterest user data object
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters

export const user_data_field: InputField = {
  label: 'User Data',
  description:
    'Object containing customer information data. Note, It is required at least one of 1) em, 2) hashed_maids or 3) pair client_ip_address + client_user_agent..',
  type: 'object',
  properties: {
    email: {
      label: 'Email',
      description: 'An email address in lowercase.',
      type: 'string',
      multiple: true
    },
    hashed_maids: {
      label: 'Mobile Ad Identifier',
      description: 'User’s Google advertising ID (GAIDs) or Apple’s identifier for advertisers (IDFAs).',
      type: 'string',
      multiple: true
    },
    client_ip_address: {
      label: 'Client IP Address',
      description: 'The IP address of the browser corresponding to the event.',
      type: 'string'
    },
    client_user_agent: {
      label: 'Client User Agent',
      description: 'User agent of the device the API call originated from.',
      type: 'string'
    },
    phone: {
      label: 'Phone Number',
      description:
        'A phone number. Include only digits with country code, area code, and number. Remove symbols, letters, and any leading zeros. In addition, always include the country code, even if all of the data is from the same country, as the country code is used for matching.',
      type: 'string',
      multiple: true
    },
    first_name: {
      label: 'First Name',
      description: 'A first name in lowercase.',
      type: 'string',
      multiple: true
    },
    last_name: {
      label: 'Last Name',
      description: 'A last name in lowercase.',
      type: 'string',
      multiple: true
    },
    external_id: {
      label: 'External ID',
      description:
        'Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.',
      type: 'string',
      multiple: true
    },
    gender: {
      label: 'Gender',
      description: 'Gender in lowercase. Either f or m.',
      type: 'string',
      multiple: true
    },
    date_of_birth: {
      label: 'Date of Birth',
      description: 'A date of birth given as year, month, and day. Example: 19971226 for December 26, 1997.',
      type: 'string',
      multiple: true
    },
    city: {
      label: 'City',
      description: 'A city in lowercase without spaces or punctuation. Example: menlopark.',
      type: 'string',
      multiple: true
    },
    state: {
      label: 'State',
      description: 'A two-letter state code in lowercase. Example: ca.',
      type: 'string',
      multiple: true
    },
    zip: {
      label: 'Zip Code',
      description: 'A five-digit zip code for United States. For other locations, follow each country`s standards.',
      type: 'string',
      multiple: true
    },
    country: {
      label: 'Country',
      description: 'A two-letter country code in lowercase.',
      type: 'string',
      multiple: true
    }
  },
  default: {
    email: {
      '@if': {
        exists: { '@path': '$.properties.email' },
        then: { '@path': '$.properties.email' },
        else: { '@path': '$.traits.email' }
      }
    },
    client_ip_address: {
      '@path': '$.context.ip'
    },
    client_user_agent: {
      '@path': '$.context.userAgent'
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

// Normalization of user data properties according to Pinterest conversion event
// https://developers.pinterest.com/docs/conversions/conversion-management/#Authenticating%20for%20the%20Conversion%20Tracking%20endpoint%23Authenticating%20for%20the%20send%20conversion%20events%20endpoint#The%20%2Cuser_data%2C%20and%20%2Ccustom_data%2C%20objects

export const normalisedAndHashed = (payload: UserData) => {
  if (payload.user_data) {
    if (!isEmpty(payload.user_data?.email)) {
      // Regex removes all whitespace in the string.
      payload.user_data.email = payload.user_data?.email?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }

    if (!isEmpty(payload.user_data?.phone)) {
      // Regex removes all non-numeric characters from the string.
      payload.user_data.phone = payload.user_data?.phone?.map((el: string) =>
        hash(el.replace(/\D/g, '').toLowerCase())
      ) as string[]
    }

    if (!isEmpty(payload.user_data?.gender)) {
      payload.user_data.gender = payload.user_data?.gender?.map((el: string) => {
        el = el.replace(/\s/g, '').toLowerCase()
        switch (el) {
          case 'male':
            el = 'm'
            break
          case 'female':
            el = 'f'
            break
          case 'non-binary':
            el = 'n'
            break
        }
        return hash(el)
      }) as string[]
    }

    if (!isEmpty(payload.user_data?.last_name)) {
      payload.user_data.last_name = payload.user_data?.last_name?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }

    if (!isEmpty(payload.user_data?.first_name)) {
      payload.user_data.first_name = payload.user_data?.first_name?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }

    if (!isEmpty(payload.user_data?.city)) {
      payload.user_data.city = payload.user_data?.city?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }

    if (!isEmpty(payload.user_data?.state)) {
      payload.user_data.state = payload.user_data?.state?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }

    if (!isEmpty(payload.user_data?.zip)) {
      payload.user_data.zip = payload.user_data?.zip?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }

    if (!isEmpty(payload.user_data?.country)) {
      payload.user_data.country = payload.user_data?.country?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }

    if (!isEmpty(payload.user_data?.external_id)) {
      payload.user_data.external_id = payload.user_data?.external_id?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }
    if (!isEmpty(payload.user_data?.hashed_maids)) {
      payload.user_data.hashed_maids = payload.user_data?.hashed_maids?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }
    if (!isEmpty(payload.user_data?.date_of_birth)) {
      payload.user_data.date_of_birth = payload.user_data?.date_of_birth?.map((el: string) =>
        hash(el.replace(/\s/g, '').toLowerCase())
      ) as string[]
    }
  }
}

export const hash_user_data = (payload: UserData): Object => {
  normalisedAndHashed(payload)
  return {
    em: payload.user_data?.email,
    ph: payload.user_data?.phone,
    ge: payload.user_data?.gender,
    db: payload.user_data?.date_of_birth,
    ln: payload.user_data?.last_name,
    fn: payload.user_data?.first_name,
    ct: payload.user_data?.city,
    st: payload.user_data?.state,
    zp: payload.user_data?.zip,
    country: payload.user_data?.country,
    external_id: payload.user_data?.external_id,
    client_ip_address: payload.user_data?.client_ip_address,
    client_user_agent: payload.user_data?.client_user_agent,
    hashed_maids: payload.user_data?.hashed_maids
  }
}
