import { ActionDefinition, IntegrationError, HTTPError, PayloadValidationError } from '@segment/actions-core'
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
  title: 'Upload Enhanced Conversion (Legacy)',
  description: 'Upload a conversion enhancement to the legacy Google Enhanced Conversions API.',
  hidden: true,
  fields: {
    // Required Fields - These fields are required by Google's EC API to successfully match conversions.
    conversion_label: {
      label: 'Conversion Label',
      description:
        'The Google Ads conversion label. You can find it in your Google Ads account using the instructions in the article [Google Ads conversions](https://support.google.com/tagmanager/answer/6105160?hl=en).',
      type: 'string',
      required: true,
      default: ''
    },
    email: {
      label: 'Email',
      description: 'Email address of the individual who triggered the conversion event.',
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
        'Order ID or Transaction ID of the conversion event. Google requires an Order ID even if the event is not an ecommerce event. Learn more in the article [Use a transaction ID to minimize duplicate conversions](https://support.google.com/google-ads/answer/6386790?hl=en&ref_topic=3165803).',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.orderId'
      }
    },
    user_agent: {
      label: 'User Agent',
      description:
        'User agent of the individual who triggered the conversion event. This should match the user agent of the request that sent the original conversion so the conversion and its enhancement are either both attributed as same-device or both attributed as cross-device. This field is optional but recommended.',
      type: 'string',
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
      description:
        'Currency of the purchase or items associated with the conversion event, in 3-letter ISO 4217 format.',
      type: 'string',
      default: {
        '@path': '$.properties.currency'
      }
    },
    is_app_incrementality: {
      label: 'App Conversion for Incrementality Study',
      description: 'Set to true if this is an app conversion for an incrementality study.',
      type: 'boolean',
      default: false
    },
    pcc_game: {
      label: 'PCC Game Flag',
      description:
        'Alpha feature offered by Google for gaming industry. When set to true, Segment will send pcc_game = 1 to Google.',
      type: 'boolean',
      default: false
    },
    // PII Fields - These fields must be hashed using SHA 256 and encoded as websafe-base64.
    phone_number: {
      label: 'Phone Number',
      description:
        'Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000.',
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
      },
      category: 'hashedPII'
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
      label: 'Postal Code',
      description: 'Postal code of the individual who triggered the conversion event.',
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

  perform: async (request, { payload, settings }) => {
    /* Enforcing this here since Conversion ID is required for the Enhanced Conversions API 
    but not for the Google Ads API. */
    if (!settings.conversionTrackingId) {
      throw new PayloadValidationError(
        'Conversion ID is required for this action. Please set it in destination settings.'
      )
    }

    const conversionData = cleanData({
      oid: payload.transaction_id,
      user_agent: payload.user_agent,
      conversion_time: +new Date(payload.conversion_time) * 1000,
      label: payload.conversion_label,
      value: payload.value,
      currency_code: payload.currency_code,
      is_app_incrementality: payload.is_app_incrementality ? 1 : 0,
      pcc_game: payload.pcc_game ? 1 : 0
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
      throw new PayloadValidationError(
        'Either a valid email address or at least one address property (firstName, lastName, street, city, region, postalCode, or country) is required to send a valid conversion.'
      )
    }

    const pii_data = cleanData({
      hashed_email: formatEmail(payload.email),
      hashed_phone_number: [formatPhone(payload.phone_number)]
    })

    try {
      return await request('https://www.google.com/ads/event/api/v1', {
        method: 'post',
        searchParams: {
          conversion_tracking_id: settings.conversionTrackingId
        },
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
          const invalidOAuth = data?.error_statuses?.find((es) => es.error_code === 'INVALID_OAUTH_TOKEN')
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
