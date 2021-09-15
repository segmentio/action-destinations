import { ActionDefinition, IntegrationError, HTTPError } from '@segment/actions-core'
import type { ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  formatCity,
  formatEmail,
  formatFirstName,
  formatLastName,
  formatPhone,
  formatStreet,
  formatRegion,
  cleanData
} from './formatter'

interface GoogleError {
  status: string
  error_statuses: [
    {
      error_code: string
      error_message: string
    }
  ]
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post Conversion',
  description: 'Send a conversion event to Google Ads.',
  fields: {
    // Required Fields - These fields are required by Google's EC API to successfully match conversions.
    conversion_label: {
      label: 'Conversion Label',
      description:
        'You will find this information in the event snippet for your conversion action, for example `send_to: AW-CONVERSION_ID/AW-CONVERSION_LABEL`. Enter the conversion label, the string after the forward slash, without the AW- prefix.',
      type: 'string',
      required: true,
      default: ''
    },
    email: {
      label: 'Email',
      description: 'Email address of the customer who triggered the conversion event.',
      type: 'string',
      required: true,
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    transaction_id: {
      label: 'Order ID',
      description:
        'Order ID of the conversion event. Google requires an Order ID even if the event is not an ecommerce event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.orderId'
      }
    },
    user_agent: {
      label: 'User Agent',
      description: 'User Agent of the customer who triggered the conversion event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.userAgent'
      }
    },
    conversion_time: {
      label: 'Conversion Time',
      description: 'Timestamp of the conversion event.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    // Conversion Data Fields - These fields are relevant to the conversion, but are not PII, so need not be hashed.
    value: {
      label: 'Value',
      description: 'The monetary value attributed to the conversion event.',
      type: 'number',
      default: {
        '@path': '$.properties.total'
      }
    },
    currency_code: {
      label: 'Currency Code',
      description: 'Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.',
      type: 'string',
      default: {
        '@path': '$.properties.currency'
      }
    },
    // PII Fields - These fields must be hashed using SHA 256 and encoded as websafe-base64.
    phone_number: {
      label: 'Phone Number',
      description: 'Phone number of the purchaser, in E.164 standard format, e.g. +14150000000',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.phone' },
          then: { '@path': '$.properties.phone' },
          else: { '@path': '$.traits.phone' }
        }
      }
    },
    first_name: {
      label: 'First Name',
      description: 'First name of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.firstName' },
          then: { '@path': '$.properties.firstName' },
          else: { '@path': '$.traits.firstName' }
        }
      }
    },
    last_name: {
      label: 'Last Name',
      description: 'Last name of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.lastName' },
          then: { '@path': '$.properties.lastName' },
          else: { '@path': '$.traits.lastName' }
        }
      }
    },
    street_address: {
      label: 'Street Address',
      description: 'Street address of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.street' },
          then: { '@path': '$.properties.address.street' },
          else: { '@path': '$.traits.address.street' }
        }
      }
    },
    city: {
      label: 'City',
      description: 'City of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.city' },
          then: { '@path': '$.properties.address.city' },
          else: { '@path': '$.traits.address.city' }
        }
      }
    },
    region: {
      label: 'Region',
      description: 'Region of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.state' },
          then: { '@path': '$.properties.address.state' },
          else: { '@path': '$.traits.address.state' }
        }
      }
    },
    post_code: {
      label: 'Post Code',
      description: 'Post code of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.postalCode' },
          then: { '@path': '$.properties.address.postalCode' },
          else: { '@path': '$.traits.address.postalCode' }
        }
      }
    },
    country: {
      label: 'Country',
      description: 'Country of the individual who triggered the conversion event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.address.country' },
          then: { '@path': '$.properties.address.country' },
          else: { '@path': '$.traits.address.country' }
        }
      }
    }
  },

  perform: async (request, { payload }) => {
    const conversionData = cleanData({
      oid: payload.transaction_id,
      user_agent: payload.user_agent,
      conversion_time: +new Date(payload.conversion_time) * 1000,
      label: payload.conversion_label,
      value: payload.value,
      currency_code: payload.currency_code
    })

    const address = cleanData({
      hashed_first_name: formatFirstName(payload.first_name),
      hashed_last_name: formatLastName(payload.last_name),
      hashed_street_address: formatStreet(payload.street_address),
      city: formatCity(payload.city),
      region: formatRegion(payload.region),
      postcode: payload.post_code,
      country: payload.country
    })

    if (!payload.email && !Object.keys(address).length) {
      throw new IntegrationError(
        'Either a valid email address or at least one address property (firstName, lastName, street, city, region, postalCode, or country) is required to send a valid conversion.',
        'Missing required fields.',
        400
      )
    }

    const pii_data = cleanData({
      hashed_email: formatEmail(payload.email),
      hashed_phone_number: [formatPhone(payload.phone_number)]
    })

    try {
      return await request('https://www.google.com/ads/event/api/v1', {
        method: 'post',
        json: {
          pii_data: { ...pii_data, address: [address] },
          ...conversionData
        }
      })
    } catch (err) {
      // Google returns a 400 when using invalid tokens
      // We'll catch invalid token errors and throw an internal 401 to
      // trigger the refresh token flow in this transaction
      if (err instanceof HTTPError) {
        const statusCode = err.response.status
        if (statusCode === 400) {
          const data = (err.response as ModifiedResponse).data as GoogleError
          const invalidOAuth = data.error_statuses.find((es) => es.error_code === 'INVALID_OAUTH_TOKEN')
          if (invalidOAuth) {
            throw new IntegrationError('The OAuth token is missing or invalid.', 'INVALID_OAUTH_TOKEN', 401)
          }
        }
      }
      // throw original error if unrelated to invalid/expired tokens
      throw err
    }
  }
}

export default action
