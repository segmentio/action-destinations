import { IntegrationError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import { MultiStatusResponse } from '@segment/actions-core'
import { JSONLikeObject } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventData, MatchKeyV1 } from '../types'
import { ConsentData, ConversionTypeV2, CurrencyCodeV1, CustomAttributeV1, MatchKeyTypeV1 } from '../types'
import { normalizeEmail, normalizePhone, normalizePostal, normalizeStandard, smartHash } from '../utils'

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
      description: 'Customer email address associated with the event, Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      category: 'hashedPII',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    phone: {
      label: 'Phone Number',
      description: 'Customer phone number associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      category: 'hashedPII',
      default: {
        '@path': '$.traits.phone'
      }
    },
    firstName: {
      label: 'First Name',
      description: 'Customer first name associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string', 
      required: false,
      category: 'hashedPII',
      default: {
        '@path': '$.traits.firstName'
      }
    },
    lastName: {
      label: 'Last Name',
      description: 'Customer last name associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      category: 'hashedPII',
      default: {
        '@path': '$.traits.lastName'
      }
    },
    address: {
      label: 'Address',
      description: 'Customer address associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      category: 'hashedPII',
      default: {
        '@path': '$.traits.address'
      }
    },
    city: {
      label: 'City',
      description: 'Customer city associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      category: 'hashedPII',
      default: {
        '@path': '$.traits.city'
      }
    },
    state: {
      label: 'State',
      description: 'Customer state associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      category: 'hashedPII',
      default: {
        '@path': '$.traits.state'
      }
    },
    postalCode: {
      label: 'Postal Code',
      description: 'Customer postal code associated with the event. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      category: 'hashedPII',
      default: {
        '@path': '$.traits.postalCode'
      }
    },
    maid: {
      label: 'Mobile Ad ID',
      description: 'Mobile advertising ID (MAID). ADID, IDFA, or FIREADID can be passed into this field. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    rampId: {
      label: 'RAMP ID',
      description: 'RAMP ID for the customer. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.rampId'
      }
    },
    matchId: {
      label: 'Match ID',
      description: 'Match ID for the customer. Used for attribution to traffic events. Out of email, phone, firstName, lastName, address, city, state, postalCode, maid, rampId, matchId fields, at-least one valid customer identifier must be provided.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.matchId'
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
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'When enabled, Segment will send data in batching.',
      type: 'boolean',
      required: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 500,
      unsafe_hidden: true
    }
  },

  /**
   * Handles a single conversion event
   */
  perform: async (request, { payload, settings }) => {
    // Use the shared prepareEventData function to process the payload
    const eventData = prepareEventData(payload)

    // Send the request using the shared function
    const response = await sendEventsRequest(request, settings, eventData)
    
    // Check if the response is successful or partial success
    if (response.ok || response.status === 207) {
      return response
    }
    
    // Handle error responses
    throw handleAmazonApiError(response)
  },

  /**
   * Process the batch of payloads
   */
  performBatch: async (request, { settings, payload: payloads }) => {
    const multiStatusResponse = new MultiStatusResponse()
    const validPayloads: EventData[] = []
    const validPayloadIndicesBitmap: number[] = []
    
    // Process each payload and prepare for batching
    payloads.forEach((payload, index) => {
      try {
        // Try to prepare the event data - reuse logic from perform()
        const eventData = prepareEventData(payload)
        validPayloads.push(eventData)
        validPayloadIndicesBitmap.push(index)
      } catch (error) {
        // Handle validation errors immediately
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: error.status || 400,
          errortype: error.code || 'PAYLOAD_VALIDATION_FAILED',
          errormessage: error.message || 'Validation failed'
        })
      }
    })
    
    if (validPayloads.length === 0) {
      return multiStatusResponse
    }
    
    try {
      // Send the batch to Amazon API using the shared function
      const response = await sendEventsRequest(request, settings, validPayloads)
      
      if (response.ok || response.status === 207) {
        return handleBatchResponse(response, validPayloads, validPayloadIndicesBitmap, multiStatusResponse)
      }
      
      // Get detailed error information without throwing
      const apiError = handleAmazonApiError(response)
      
      // Apply the specific error details to each payload in the batch
      validPayloadIndicesBitmap.forEach((index) => {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: apiError.status || 400,
          errormessage: apiError.message,
          body: response.data
        })
      })
      
      return multiStatusResponse
    } catch (error) {
      // Handle truly unexpected errors (like network issues)
      // This should only happen for errors not related to the API response
      validPayloadIndicesBitmap.forEach((index) => {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 500,
          errormessage: error.message || 'Unknown error occurred during request processing'
        })
      })
      
      return multiStatusResponse
    }
  }
}

/**
 * Prepares event data from a payload by processing match keys and formatting event data 
 * according to Amazon Conversions API requirements
 * 
 * @param payload The payload to process
 * @returns An EventData object ready to send to the API
 */
function prepareEventData(payload: Payload): EventData {
  // Create timestamp if not provided
  const timestamp = payload.timestamp || new Date().toISOString()

  // Process match keys
  let matchKeys: MatchKeyV1[] = []

  // Process email
  if (payload.email) {
    const hashedEmail = smartHash(payload.email, normalizeEmail)
    matchKeys.push({
      type: MatchKeyTypeV1.EMAIL,
      values: [hashedEmail] as [string]
    })
  }

  // Process phone
  if (payload.phone) {
    const hashedPhone = smartHash(payload.phone, normalizePhone)
    matchKeys.push({
      type: MatchKeyTypeV1.PHONE,
      values: [hashedPhone] as [string]
    })
  }

  // Process first name
  if (payload.firstName) {
    const hashedFirstName = smartHash(payload.firstName, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.FIRST_NAME,
      values: [hashedFirstName] as [string]
    })
  }

  // Process last name
  if (payload.lastName) {
    const hashedLastName = smartHash(payload.lastName, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.LAST_NAME,
      values: [hashedLastName] as [string]
    })
  }

  // Process address
  if (payload.address) {
    const hashedAddress = smartHash(payload.address, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.ADDRESS,
      values: [hashedAddress] as [string]
    })
  }

  // Process city
  if (payload.city) {
    const hashedCity = smartHash(payload.city, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.CITY,
      values: [hashedCity] as [string]
    })
  }

  // Process state
  if (payload.state) {
    const hashedState = smartHash(payload.state, normalizeStandard)
    matchKeys.push({
      type: MatchKeyTypeV1.STATE,
      values: [hashedState] as [string]
    })
  }

  // Process postal code
  if (payload.postalCode) {
    const hashedPostalCode = smartHash(payload.postalCode, normalizePostal)
    matchKeys.push({
      type: MatchKeyTypeV1.POSTAL,
      values: [hashedPostalCode] as [string]
    })
  }

  // Process MAID - not hashed
  if (payload.maid) {
    matchKeys.push({
      type: MatchKeyTypeV1.MAID,
      values: [payload.maid] as [string]
    })
  }

  // Process RAMP_ID - not hashed
  if (payload.rampId) {
    matchKeys.push({
      type: MatchKeyTypeV1.RAMP_ID,
      values: [payload.rampId] as [string]
    })
  }

  // Process MATCH_ID - not hashed
  if (payload.matchId) {
    matchKeys.push({
      type: MatchKeyTypeV1.MATCH_ID,
      values: [payload.matchId] as [string]
    })
  }

  // Enforce the maximum limit of 11 match keys
  if (matchKeys.length > 11) {
    matchKeys = matchKeys.slice(0, 11)
  }

  // Check if we have at least one match key after processing
  if (matchKeys.length === 0) {
    throw new IntegrationError('At least one valid match key must be provided.', 'MISSING_MATCH_KEY', 400)
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

  return eventData
}

/**
 * Process the Amazon API response and update the multi-status response
 */
function handleBatchResponse(
  response: any,
  validPayloads: EventData[],
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse
): MultiStatusResponse {
  // No need to check response.ok || response.status === 207
  // because we only call this function when that condition is true
  
  // Handle success or partial success
  validPayloads.forEach((payload, index) => {
    const originalIndex = validPayloadIndicesBitmap[index]
    multiStatusResponse.setSuccessResponseAtIndex(originalIndex, {
      status: 200,
      sent: payload as unknown as JSONLikeObject,
      body: response.data || 'success'
    })
  })

  return multiStatusResponse
}

/**
 * Sends event data to the Amazon Conversions API
 *
 * @param request The request client
 * @param settings The API settings
 * @param eventData The event data to send (single event or array of events)
 * @returns The API response
 */
async function sendEventsRequest(
  request: any,
  settings: Settings,
  eventData: EventData | EventData[]
): Promise<any> {
  // Ensure eventData is always an array
  const events = Array.isArray(eventData) ? eventData : [eventData];
  
  return await request(
    `${settings.region}/events/v1`,
    {
      method: 'POST',
      json: {
        eventData: events,
        ingestionMethod: "SERVER_TO_SERVER"
      },
      headers: {
        'Amazon-Advertising-API-Scope': settings.profileId,
        'Amazon-Ads-AccountId': settings.advertiserId
      },
      timeout: 25000,
      throwHttpErrors: false
    }
  );
}

/**
 * Handle errors from the Amazon API based on status codes
 * 
 * @param response The API error response
 * @returns An IntegrationError with appropriate code and message
 */
function handleAmazonApiError(response: any): IntegrationError {
  const status = response.status;
  const errorData = response.data || {};
  
  switch (status) {
    case 401:
      return new IntegrationError(
        'Authentication failed. Check your API credentials.',
        'AMAZON_AUTH_ERROR',
        401
      );
      
    case 403:
      return new IntegrationError(
        'You do not have permission to access this resource.',
        'AMAZON_FORBIDDEN_ERROR',
        403
      );
      
    case 415:
      return new IntegrationError(
        'Invalid media type. The Content-Type or Accept headers are invalid.',
        'AMAZON_MEDIA_TYPE_ERROR',
        415
      );
      
    case 429:
      // Extract retry information if available
      const retryAfter = response.headers?.['retry-after'] || '';
      return new IntegrationError(
        `Rate limited by Amazon API. ${retryAfter ? `Try again after ${retryAfter} seconds.` : 'Please try again later.'}`,
        'AMAZON_RATE_LIMIT_ERROR',
        429
      );
      
    case 500:
      return new IntegrationError(
        'Amazon API encountered an internal server error. Please try again later.',
        'AMAZON_SERVER_ERROR',
        500
      );
      
    case 400:
    default:
      // Extract detailed error information if available
      const errorMessage = errorData.message || response.statusText || 'Unknown error';
      return new IntegrationError(
        `Failed to send event to Amazon: ${errorMessage}`,
        'AMAZON_API_ERROR',
        status || 400
      );
  }
}


export default action
