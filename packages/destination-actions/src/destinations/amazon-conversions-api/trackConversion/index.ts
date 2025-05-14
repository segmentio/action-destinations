import { IntegrationError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventData } from '../types'
import { ConsentData, ConversionTypeV2, CurrencyCodeV1, CustomAttributeV1, MatchKeyTypeV1 } from '../types'
import { createHash } from 'crypto'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion',
  description: 'Send conversion event data to Amazon Events API',
  defaultSubscription: 'type = "track"',

  fields: {
    name: {
      label: 'Event Name',
      description: 'The name of the imported event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    eventType: {
      label: 'Event Type',
      description: 'The standard Amazon event type.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Add to Shopping Cart', value: 'ADD_TO_SHOPPING_CART' },
        { label: 'Application', value: 'APPLICATION' },
        { label: 'Checkout', value: 'CHECKOUT' },
        { label: 'Contact', value: 'CONTACT' },
        { label: 'Lead', value: 'LEAD' },
        { label: 'Off Amazon Purchases', value: 'OFF_AMAZON_PURCHASES' },
        { label: 'Mobile App First Start', value: 'MOBILE_APP_FIRST_START' },
        { label: 'Page View', value: 'PAGE_VIEW' },
        { label: 'Search', value: 'SEARCH' },
        { label: 'Sign Up', value: 'SIGN_UP' },
        { label: 'Subscribe', value: 'SUBSCRIBE' },
        { label: 'Other', value: 'OTHER' }
      ],
      default: {
        '@path': '$.properties.eventType'
      }
    },
    eventActionSource: {
      label: 'Event Action Source',
      description: 'The platform from which the event was sourced.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Android', value: 'ANDROID' },
        { label: 'Fire TV', value: 'FIRE_TV' },
        { label: 'iOS', value: 'IOS' },
        { label: 'Offline', value: 'OFFLINE' },
        { label: 'Website', value: 'WEBSITE' }
      ],
      default: {
        '@path': '$.context.device.type'
      }
    },
    countryCode: {
      label: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country code (e.g., US, GB).',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.location.country'
      }
    },
    timestamp: {
      label: 'Event Timestamp',
      description: 'The reported timestamp of when the event occurred in ISO format (YYYY-MM-DDThh:mm:ssTZD).',
      type: 'string',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    value: {
      label: 'Value',
      description: 'The value of the event.',
      type: 'number',
      required: false,
      default: {
        '@path': '$.properties.value'
      }
    },
    currencyCode: {
      label: 'Currency Code',
      description: 'The currencyCode associated with the \'value\' of the event in ISO-4217 format. Only applicable for OFF_AMAZON_PURCHASES event type.',
      type: 'string',
      required: false,
      choices: [
        { label: 'AED - UAE Dirham', value: 'AED' },
        { label: 'AUD - Australian Dollar', value: 'AUD' },
        { label: 'BRL - Brazilian Real', value: 'BRL' },
        { label: 'CAD - Canadian Dollar', value: 'CAD' },
        { label: 'CNY - Chinese Yuan', value: 'CNY' },
        { label: 'EUR - Euro', value: 'EUR' },
        { label: 'GBP - British Pound', value: 'GBP' },
        { label: 'INR - Indian Rupee', value: 'INR' },
        { label: 'JPY - Japanese Yen', value: 'JPY' },
        { label: 'MXN - Mexican Peso', value: 'MXN' },
        { label: 'SAR - Saudi Riyal', value: 'SAR' },
        { label: 'SEK - Swedish Krona', value: 'SEK' },
        { label: 'SGD - Singapore Dollar', value: 'SGD' },
        { label: 'TRY - Turkish Lira', value: 'TRY' },
        { label: 'USD - US Dollar', value: 'USD' },
        { label: 'DKK - Danish Krone', value: 'DKK' },
        { label: 'NOK - Norwegian Krone', value: 'NOK' },
        { label: 'NZD - New Zealand Dollar', value: 'NZD' }
      ],
      default: {
        '@path': '$.properties.currency'
      }
    },
    unitsSold: {
      label: 'Units Sold',
      description: 'The number of items purchased (only for OFF_AMAZON_PURCHASES).',
      type: 'integer',
      required: false,
      default: {
        '@path': '$.properties.quantity'
      }
    },
    clientDedupeId: {
      label: 'Client Dedupe ID',
      description: 'The client specified id for the event. For events with the same clientDedupeId only the latest event will be kept.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.messageId'
      }
    },
    email: {
      label: 'Email',
      description: 'Customer email address (will be hashed).',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    dataProcessingOptions: {
      label: 'Data Processing Options',
      description: 'A list of flags for signaling how an event shall be processed. Events marked for limited data use will not be processed.',
      type: 'string',
      multiple: true,
      choices: [
        { label: 'Limited Data Use', value: 'LIMITED_DATA_USE' }
      ],
      required: false,
      default: {
        '@path': '$.properties.dataProcessingOptions'
      }
    },
    consent: {
      label: 'Consent',
      description: 'Describes consent given by the user for advertising purposes. For EU advertisers, it is required to provide one of geo, amazonConsent, tcf, or gpp.',
      type: 'object',
      required: false,
      properties: {
        geo: {
          label: 'Geographic Consent',
          description: "Captures the user's geographic information for consent checking.",
          type: 'object',
          required: false,
          properties: {
            ipAddress: {
              label: 'IP Address',
              description: 'IP address of the user associated with the conversion event.',
              type: 'string',
              required: false,
              default: {
                '@path': '$.context.ip'
              }
            }
          }
        },
        amazonConsent: {
          label: 'Amazon Consent Format',
          description: 'Captures whether a user has consented to data use for advertising purposes.',
          type: 'object',
          required: false,
          properties: {
            amznAdStorage: {
              label: 'Ad Storage Consent',
              description: 'Whether the user has consented to cookie based tracking.',
              type: 'string',
              required: false,
              choices: [
                { label: 'Granted', value: 'GRANTED' },
                { label: 'Denied', value: 'DENIED' }
              ]
            },
            amznUserData: {
              label: 'User Data Consent',
              description: 'Whether the user has consented to use personal data for advertising.',
              type: 'string',
              required: false,
              choices: [
                { label: 'Granted', value: 'GRANTED' },
                { label: 'Denied', value: 'DENIED' }
              ]
            }
          }
        },
        tcf: {
          label: 'TCF String',
          description: 'An encoded Transparency and Consent Framework (TCF) string describing user consent choices.',
          type: 'string',
          required: false
        },
        gpp: {
          label: 'GPP String',
          description: 'An encoded Global Privacy Platform (GPP) string describing user privacy preferences.',
          type: 'string',
          required: false
        }
      },
      default: {
        '@path': '$.properties.consent'
      }
    },
    customAttributes: {
      label: 'Custom Attributes',
      description: 'Custom attributes associated with the event to provide additional context.',
      type: 'object',
      multiple: true,
      required: false,
      properties: {
        name: {
          label: 'Name',
          description: 'Name of the custom attribute. Only letters, numbers and the underscore character are allowed.',
          type: 'string',
          required: true
        },
        dataType: {
          label: 'Data Type',
          description: 'Data type of the custom attribute.',
          type: 'string',
          required: false,
          default: 'STRING',
          choices: [
            { label: 'String', value: 'STRING' },
            { label: 'Number', value: 'NUMBER' },
            { label: 'Boolean', value: 'BOOLEAN' }
          ]
        },
        value: {
          label: 'Value',
          description: 'Value of the custom attribute. Max length 256 characters.',
          type: 'string',
          required: true
        }
      },
      default: {
        '@path': '$.properties.customAttributes'
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    // Create timestamp if not provided
    const timestamp = payload.timestamp || new Date().toISOString()

    // Hash email if provided
    let matchKeys = undefined
    if (payload.email) {
      const hashedEmail = createHash('sha256').update(payload.email.toLowerCase().trim()).digest('hex')
      matchKeys = [{
        type: MatchKeyTypeV1.EMAIL,
        values: [hashedEmail] as [string]
      }]
    }

    // Prepare event data
    const eventData: EventData = {
      name: payload.name,
      eventType: payload.eventType as ConversionTypeV2,
      eventActionSource: payload.eventActionSource,
      countryCode: payload.countryCode,
      timestamp: timestamp
    }

    // Add matchKeys if present
    if (matchKeys) {
      eventData.matchKeys = matchKeys
    }

    // Add optional fields if they exist
    if (payload.value !== undefined) eventData.value = payload.value
    if (payload.currencyCode) eventData.currencyCode = payload.currencyCode as CurrencyCodeV1
    if (payload.unitsSold !== undefined) eventData.unitsSold = payload.unitsSold
    if (payload.clientDedupeId) eventData.clientDedupeId = payload.clientDedupeId
    if (payload.dataProcessingOptions) eventData.dataProcessingOptions = payload.dataProcessingOptions
    if (payload.consent) eventData.consent = payload.consent as ConsentData
    if (payload.customAttributes) eventData.customAttributes = payload.customAttributes as CustomAttributeV1[]

    try {
      // Make API request to regional endpoint
      return await request(
        `${settings.region}/events/v1`,
        {
          method: 'POST',
          json: {
            eventData: [eventData],
            ingestionMethod: "SERVER_TO_SERVER"
          },
          headers: {
            'Amazon-Advertising-API-Scope': settings.profileId,
            'Amazon-Ads-AccountId': settings.advertiserId
          },
          timeout: 15000
        }
      )
    } catch (error) {
      // Check if the error has a response object with status
      if (error.response && error.response.status) {
        const status = error.response.status
        const errorData = error.response.data || {}
        
        switch (status) {
          case 207:
            // Multi-status response indicates partial success
            // Return the response, which will include details of success/failures
            return error.response
            
          case 401:
            throw new IntegrationError(
              'Authentication failed. Check your API credentials.',
              'AMAZON_AUTH_ERROR',
              401
            )
            
          case 403:
            throw new IntegrationError(
              'You do not have permission to access this resource.',
              'AMAZON_FORBIDDEN_ERROR',
              403
            )
            
          case 415:
            throw new IntegrationError(
              'Invalid media type. The Content-Type or Accept headers are invalid.',
              'AMAZON_MEDIA_TYPE_ERROR',
              415
            )
            
          case 429:
            // Extract retry information if available
            const retryAfter = error.response.headers?.['retry-after'] || ''
            throw new IntegrationError(
              `Rate limited by Amazon API. ${retryAfter ? `Try again after ${retryAfter} seconds.` : 'Please try again later.'}`,
              'AMAZON_RATE_LIMIT_ERROR',
              429
            )
            
          case 500:
            throw new IntegrationError(
              'Amazon API encountered an internal server error. Please try again later.',
              'AMAZON_SERVER_ERROR',
              500
            )
            
          case 400:
          default:
            // Extract detailed error information if available
            const errorMessage = errorData.message || error.message || 'Unknown error'
            throw new IntegrationError(
              `Failed to send event to Amazon: ${errorMessage}`,
              'AMAZON_API_ERROR',
              status || 400
            )
        }
      } else {
        // If there's no response object, it's likely a network or other client-side error
        throw new IntegrationError(
          `Failed to send event to Amazon: ${error.message || 'Unknown error'}`,
          'AMAZON_CONNECTION_ERROR',
          500
        )
      }
    }
  }
}

export default action
