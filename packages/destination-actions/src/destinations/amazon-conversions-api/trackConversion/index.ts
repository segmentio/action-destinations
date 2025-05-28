import { IntegrationError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import { MultiStatusResponse } from '@segment/actions-core'
import { JSONLikeObject } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventData, MatchKeyV1 } from '../types'
import { 
  ConsentData, 
  ConversionTypeV2, 
  CurrencyCodeV1, 
  CustomAttributeV1, 
  MatchKeyTypeV1,
  Region 
} from '../types'
import { 
  normalizeEmail, 
  normalizePhone, 
  normalizePostal, 
  normalizeStandard, 
  smartHash, 
  sendEventsRequest, 
  handleAmazonApiError,
  validateConsent,
  validateCountryCode
} from '../utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Conversion',
  description: 'Send conversion event data to Amazon Events API',
  defaultSubscription: 'type = "track"',
  fields,

  perform: async (request, { payload, settings }) => {
    const eventData = prepareEventData(payload, settings)
    const response = await sendEventsRequest(request, settings, eventData)
    
    // Check if the response is successful or partial success
    if (response.status === 207) {
      return response
    }
    
    // Handle error responses
    throw handleAmazonApiError(response)
  },

  performBatch: async (request, { settings, payload: payloads }) => {
    const multiStatusResponse = new MultiStatusResponse()
    const validPayloads: EventData[] = []
    const validPayloadIndicesBitmap: number[] = []
    
    // Process each payload and prepare for batching
    payloads.forEach((payload, index) => {
      try {
        const eventData = prepareEventData(payload, settings)
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
      
      if (response.status === 207) {
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
function prepareEventData(payload: Payload, settings: Settings): EventData {
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
    countryCode: validateCountryCode(payload.countryCode),
    timestamp: timestamp
  }

  if (matchKeys) {
    eventData.matchKeys = matchKeys
  }

  // Validate consent for EU region
  if (settings.region === Region.EU && !validateConsent(payload.consent)) {
    throw new IntegrationError(
      'For EU region, at least one of these consent fields is required: geo, amazonConsent, tcf, or gpp.',
      'MISSING_CONSENT',
      400
    )
  }

  Object.assign(eventData, {
    ...(payload.value !== undefined && { value: payload.value }),
    ...(payload.currencyCode && { currencyCode: payload.currencyCode as CurrencyCodeV1 }),
    ...(payload.unitsSold !== undefined && { unitsSold: payload.unitsSold }),
    ...(payload.clientDedupeId && { clientDedupeId: payload.clientDedupeId }),
    ...(payload.dataProcessingOptions && { dataProcessingOptions: payload.dataProcessingOptions }),
    ...(payload.consent && { consent: payload.consent as ConsentData }),
    ...(payload.customAttributes && { customAttributes: payload.customAttributes as CustomAttributeV1[] }),
  })

  return eventData
}


/**
 * Process the Amazon API response and update the multi-status response
 * Handles 207 multistatus responses with errors
 */
function handleBatchResponse(
  response: any,
  validPayloads: EventData[],
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse
): MultiStatusResponse {
  // Handle 207 multistatus responses
  if (response.status === 207 && response.data) {
    const responseData = response.data;
    
    const successMap: Record<number, any> = {};
    const errorMap: Record<number, any> = {};
    
    // Populate success map (adjusting for 1-based API indexing)
    if (responseData.success && Array.isArray(responseData.success)) {
      responseData.success.forEach((item: {index: number}) => {
        // Adjust API's 1-based index to JavaScript's 0-based index
        const jsIndex = item.index - 1;
        successMap[jsIndex] = item;
      });
    }
    
    // Populate error map (adjusting for 1-based API indexing)
    if (responseData.error && Array.isArray(responseData.error)) {
      responseData.error.forEach((item: {index: number}) => {
        // Adjust API's 1-based index to JavaScript's 0-based index
        const jsIndex = item.index - 1;
        errorMap[jsIndex] = item;
      });
    }
    
    validPayloads.forEach((payload, index) => {
      const originalIndex = validPayloadIndicesBitmap[index];
      
      if (errorMap[index]) {
        // Handle error case
        const errorResult = errorMap[index];
        multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
          status: parseInt(errorResult.httpStatusCode) || 400,
          sent: payload as unknown as JSONLikeObject,
          body: errorResult,
          errortype: errorResult.subErrors?.[0]?.errorType || 'API_ERROR',
          errormessage: errorResult.subErrors?.[0]?.errorMessage || 'Error processing payload'
        });
      } else if (successMap[index]) {
        // Handle success case
        multiStatusResponse.setSuccessResponseAtIndex(originalIndex, {
          status: 200,
          sent: payload as unknown as JSONLikeObject,
          body: successMap[index]
        });
      } else {
        // Fallback for any payloads not explicitly mentioned in response
        multiStatusResponse.setSuccessResponseAtIndex(originalIndex, {
          status: 200,
          sent: payload as unknown as JSONLikeObject,
          body: 'success'
        });
      }
    });
  }
  return multiStatusResponse;
}


export default action
