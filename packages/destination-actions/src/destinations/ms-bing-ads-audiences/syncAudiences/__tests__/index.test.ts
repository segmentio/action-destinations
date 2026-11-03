import nock from 'nock'
import { createTestIntegration, createTestEvent, InvalidAuthenticationError } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../constants'
import * as utils from '../../utils'

const testDestination = createTestIntegration(Destination)

const settings = {
  developerToken: 'fake-dev-token',
  customerAccountId: 'fake-customer-id',
  customerId: 'fake-customer-id'
}

const baseMapping = {
  audience_id: 'aud_123',
  identifier_type: 'Email',
  enable_batching: true,
  batch_size: 1000,
  audience_key: 'aud_key',
  computation_class: 'audience'
}

// Mock the utils module to spy on handleHttpError function
jest.mock('../../utils', () => {
  const originalModule = jest.requireActual('../../utils')
  return {
    ...originalModule,
    handleHttpError: jest.fn().mockImplementation(async (msResponse, error, listItemsMap, payload) => {
      // Call the original implementation
      return originalModule.handleHttpError(msResponse, error, listItemsMap, payload)
    }),
    // @ts-ignore
    sendDataToMicrosoftBingAds: jest
      .fn()
      .mockImplementation(originalModule.sendDataToMicrosoftBingAds as (payload: any) => Promise<any>)
  }
})

describe('MS Bing Ads Audiences syncAudiences', () => {
  beforeEach(() => {
    nock.cleanAll()
    jest.clearAllMocks()
  })

  it('should add a user by email (perform)', async () => {
    nock(BASE_URL)
      .post('/CustomerListUserData/Apply', {
        CustomerListUserData: {
          ActionType: 'Add',
          AudienceId: 'aud_123',
          CustomerListItemSubType: 'Email',
          CustomerListItems: ['5a95f052958dac8ed1d66d74eb481b3ccdbbc953b583c5ff0325be6b091d6281']
        }
      })
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      properties: { aud_key: true },
      context: { traits: { email: 'demo@segment.com' } }
    })

    const response = await testDestination.testAction('syncAudiences', {
      event,
      mapping: baseMapping,
      useDefaultMappings: true,
      settings
    })

    expect(response[0].status).toBe(200)
  })

  it('should remove a user by email (perform)', async () => {
    nock(BASE_URL)
      .post('/CustomerListUserData/Apply', {
        CustomerListUserData: {
          ActionType: 'Remove',
          AudienceId: 'aud_123',
          CustomerListItemSubType: 'Email',
          CustomerListItems: ['be010506b3f28f79dc75023e96ff2a989a024af39222031d5d287f58aa7ee0fb']
        }
      })
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      context: { traits: { email: 'remove@segment.com' } }
    })

    const response = await testDestination.testAction('syncAudiences', {
      event,
      mapping: { ...baseMapping },
      useDefaultMappings: true,
      settings
    })

    expect(response[0].status).toBe(200)
  })

  it('should add a user by CRM ID (perform)', async () => {
    nock(BASE_URL)
      .post('/CustomerListUserData/Apply', {
        CustomerListUserData: {
          ActionType: 'Add',
          AudienceId: 'aud_123',
          CustomerListItemSubType: 'CRM',
          CustomerListItems: ['crm_123']
        }
      })
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'crm_123',
      properties: { aud_key: true }
    })

    const response = await testDestination.testAction('syncAudiences', {
      event,
      mapping: { ...baseMapping, identifier_type: 'CRM' },
      useDefaultMappings: true,
      settings
    })

    expect(response[0].status).toBe(200)
  })

  it('should bulk add multiple users (performBatch)', async () => {
    nock(BASE_URL)
      .post('/CustomerListUserData/Apply', {
        CustomerListUserData: {
          ActionType: 'Add',
          AudienceId: 'aud_123',
          CustomerListItemSubType: 'Email',
          CustomerListItems: [
            'fa0779840f54498c090fcd179780c15a101115a62dbfe245169885dd9b2504d8',
            '8c45724ef458e6667e3e243a86c1a808a397b603840324218c47688ef12b2f28'
          ]
        }
      })
      .reply(200, {})

    const events = [
      createTestEvent({
        type: 'identify',
        properties: { aud_key: true },
        context: { traits: { email: 'one@segment.com' } }
      }),
      createTestEvent({
        type: 'identify',
        properties: { aud_key: true },
        context: { traits: { email: 'two@segment.com' } }
      })
    ]

    const response = await testDestination.testBatchAction('syncAudiences', {
      events,
      mapping: baseMapping,
      useDefaultMappings: true,
      settings
    })

    expect(response[0].status).toBe(200)
  })

  it('should bulk remove multiple users (performBatch)', async () => {
    nock(BASE_URL)
      .post('/CustomerListUserData/Apply', {
        CustomerListUserData: {
          ActionType: 'Remove',
          AudienceId: 'aud_123',
          CustomerListItemSubType: 'Email',
          CustomerListItems: [
            '09ebf1d948391bed7a05c7fe0a1be045a530385a926d6e752ec3bb4c3aed8284',
            '2ec0506839de572cd8f7b77638d9b95b0eacc010bf6973bf02d35e2d09ffeb76'
          ]
        }
      })
      .reply(200, {})

    const events = [
      createTestEvent({ type: 'identify', context: { traits: { email: 'bye1@segment.com' } } }),
      createTestEvent({ type: 'identify', context: { traits: { email: 'bye2@segment.com' } } })
    ]

    const response = await testDestination.testBatchAction('syncAudiences', {
      events,
      mapping: { ...baseMapping },
      useDefaultMappings: true,
      settings
    })

    expect(response[0].status).toBe(200)
  })

  it('should add users by CRM ID (performBatch)', async () => {
    nock(BASE_URL)
      .post('/CustomerListUserData/Apply', {
        CustomerListUserData: {
          ActionType: 'Add',
          AudienceId: 'aud_123',
          CustomerListItemSubType: 'CRM',
          CustomerListItems: ['crm_111', 'crm_222']
        }
      })
      .reply(200, {})

    const events = [
      createTestEvent({ type: 'identify', userId: 'crm_111', properties: { aud_key: true } }),
      createTestEvent({ type: 'identify', userId: 'crm_222', properties: { aud_key: true } })
    ]

    const response = await testDestination.testBatchAction('syncAudiences', {
      events,
      mapping: { ...baseMapping, identifier_type: 'CRM' },
      useDefaultMappings: true,
      settings
    })

    expect(response[0].status).toBe(200)
  })

  it('should handle HTTP error correctly in batch mode', async () => {
    nock(BASE_URL).post('/CustomerListUserData/Apply').reply(500, { error: 'Internal Server Error' })

    const events = [
      // Add events
      createTestEvent({
        type: 'identify',
        traits: { aud_key: true },
        context: { traits: { email: 'add1@segment.com' } }
      })
    ]

    const response = await testDestination.testBatchAction('syncAudiences', {
      events,
      mapping: baseMapping,
      useDefaultMappings: true,
      settings
    })

    // Verify handleHttpError was called
    expect(utils.handleHttpError).toHaveBeenCalled()

    // Verify handleHttpError was called with the correct parameters
    let handleHttpErrorMock = utils.handleHttpError as jest.Mock
    expect(handleHttpErrorMock).toHaveBeenCalled()

    // Verify the first argument is an instance of MultiStatusResponse
    const msResponseArg = handleHttpErrorMock.mock.calls[0][0]
    expect(msResponseArg).toBeDefined()

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(500)
    expect(response[0].body).toBeDefined()

    // Check handleHttpError arguments more thoroughly to ensure it correctly processes errors
    handleHttpErrorMock = utils.handleHttpError as jest.Mock
    const payloadArg = handleHttpErrorMock.mock.calls[0][3]

    // Verify payloads were passed correctly
    expect(payloadArg.length).toBe(1)
    expect(payloadArg[0].email).toBe('add1@segment.com')
  })

  describe('debug logging (actions-ms-bing-ads-audiences-debug-logging flag)', () => {
    const DEBUG_FLAG = 'actions-ms-bing-ads-audiences-debug-logging'

    const makeLogger = () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() } as any)

    const addEvent = () =>
      createTestEvent({
        type: 'identify',
        properties: { aud_key: true },
        context: { traits: { email: 'demo@segment.com' } }
      })

    it('does not log when the flag is off', async () => {
      nock(BASE_URL).post('/CustomerListUserData/Apply').reply(200, {})
      const logger = makeLogger()

      await testDestination.testAction('syncAudiences', {
        event: addEvent(),
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: false }
      })

      expect(logger.warn).not.toHaveBeenCalled()
    })

    it('logs the tracking id and metadata when on, without leaking hashed identifiers', async () => {
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(200, { PartialErrors: [] }, { TrackingId: 'abc-123-track' })
      const logger = makeLogger()

      await testDestination.testAction('syncAudiences', {
        event: addEvent(),
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      expect(logger.warn).toHaveBeenCalledTimes(1)
      const logged = (logger.warn as jest.Mock).mock.calls[0][0] as string
      expect(logged).toContain('[ms-bing-ads-audiences][DEBUG]')
      expect(logged).toContain('trackingId=abc-123-track')
      expect(logged).toContain('identifierType=Email')
      expect(logged).toContain('itemCount=1')
      // The hashed identifier must never be logged.
      expect(logged).not.toContain('5a95f052958dac8ed1d66d74eb481b3ccdbbc953b583c5ff0325be6b091d6281')
    })

    it('falls back to a body-level tracking id when no header is present', async () => {
      nock(BASE_URL).post('/CustomerListUserData/Apply').reply(200, { TrackingId: 'body-track-789', PartialErrors: [] })
      const logger = makeLogger()

      await testDestination.testAction('syncAudiences', {
        event: addEvent(),
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      const logged = (logger.warn as jest.Mock).mock.calls[0][0] as string
      expect(logged).toContain('trackingId=body-track-789')
    })

    it('redacts PartialError free-text fields that can echo identifiers', async () => {
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(200, {
          PartialErrors: [
            {
              ErrorCode: 'InvalidCustomerListItem',
              Code: 4001,
              Index: 0,
              Type: 'BatchError',
              Message: 'Invalid value crm_secret_12345',
              Details: 'crm_secret_12345',
              FieldPath: 'CustomerListItems[0]=crm_secret_12345'
            }
          ]
        })
      const logger = makeLogger()

      await testDestination.testBatchAction('syncAudiences', {
        events: [addEvent()],
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      const logged = (logger.warn as jest.Mock).mock.calls[0][0] as string
      expect(logged).toContain('InvalidCustomerListItem')
      // The free-text fields (and any identifier they echo) must not be logged.
      expect(logged).not.toContain('crm_secret_12345')
      expect(logged).not.toContain('Message')
      expect(logged).not.toContain('FieldPath')
    })

    it('does not let a throwing logger break the delivery', async () => {
      // Debug logging runs after Bing has accepted the records; a throwing logger must not
      // fail the delivery (which would trigger a duplicate re-send on retry).
      nock(BASE_URL).post('/CustomerListUserData/Apply').reply(200, { PartialErrors: [] })
      const logger = makeLogger()
      ;(logger.warn as jest.Mock).mockImplementation(() => {
        throw new Error('logger down')
      })

      const response = await testDestination.testAction('syncAudiences', {
        event: addEvent(),
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      expect(response[0].status).toBe(200)
    })

    it('logs a delivery-error summary (tracking id + status) on the error path', async () => {
      // The success-path [DEBUG] line never fires on a failed call; instead the catch path logs a
      // [DELIVERY_ERROR] summary so the Bing tracking id is available for support tickets.
      nock(BASE_URL).post('/CustomerListUserData/Apply').reply(500, { message: 'boom' })
      const logger = makeLogger()

      const response = await testDestination.testBatchAction('syncAudiences', {
        events: [addEvent()],
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      const warned = (logger.warn as jest.Mock).mock.calls.map((c) => c[0]).join('\n')
      expect(warned).toContain('[ms-bing-ads-audiences][DELIVERY_ERROR]')
      // The success-path DEBUG line must NOT appear on a failed delivery.
      expect(warned).not.toContain('[ms-bing-ads-audiences][DEBUG]')
      expect(utils.handleHttpError).toHaveBeenCalled()
      expect(response[0].status).toBe(500)
    })
  })

  it('should throw non-HTTP errors in batch mode', async () => {
    // Create a custom error that is NOT an HTTPError
    const customError = new Error('Custom non-HTTP error')

    // Mock sendDataToMicrosoftBingAds to throw a non-HTTP error
    const sendDataMock = utils.sendDataToMicrosoftBingAds as jest.Mock
    sendDataMock.mockImplementationOnce(() => {
      throw customError
    })

    const events = [
      createTestEvent({
        type: 'identify',
        properties: { aud_key: true },
        context: { traits: { email: 'test@segment.com' } }
      })
    ]

    // Expect the testBatchAction to throw the custom error
    await expect(
      testDestination.testBatchAction('syncAudiences', {
        events,
        mapping: baseMapping,
        useDefaultMappings: true,
        settings
      })
    ).rejects.toThrow('Custom non-HTTP error')

    // Verify handleHttpError was NOT called (since it's not an HTTPError)
    const handleHttpErrorMock = utils.handleHttpError as jest.Mock
    expect(handleHttpErrorMock).not.toHaveBeenCalled()
  })

  describe('Bing fault handling / 401 auto-refresh', () => {
    const DEBUG_FLAG = 'actions-ms-bing-ads-audiences-debug-logging'

    // parseBingFault normalizes Bing's non-standard fault envelope into the status we record per
    // item. The status is what the framework's OAuth retry keys on, so getting 401 right here is
    // what makes token refresh-and-retry work.
    it('parseBingFault: token expired (code 109, HTTP 401) -> status 401', () => {
      const fault = {
        Errors: [{ Code: 109, ErrorCode: 'AuthenticationTokenExpired', Message: 'expired' }],
        TrackingId: 'track-109',
        Type: 'AdApiFaultDetail'
      }
      const { status, errormessage, trackingId } = utils.parseBingFault(fault, 401, 'Unauthorized')
      expect(status).toBe(401)
      expect(trackingId).toBe('track-109')
      expect(errormessage).toContain('AuthenticationTokenExpired')
    })

    it('parseBingFault: invalid token (code 105) returned as HTTP 500 -> normalized to 401', () => {
      const fault = { Errors: [{ Code: 105, ErrorCode: 'AuthenticationTokenInvalid', Message: 'bad token' }] }
      expect(utils.parseBingFault(fault, 500, 'Internal Server Error').status).toBe(401)
    })

    it('parseBingFault: no access (code 106) -> keeps real status, NOT 401 (non-retryable)', () => {
      const fault = { Errors: [{ Code: 106, ErrorCode: 'UserIsNotAuthorized', Message: 'no access' }] }
      expect(utils.parseBingFault(fault, 403, 'Forbidden').status).toBe(403)
    })

    it('parseBingFault: ApiFaultDetail (OperationErrors) parsed like Errors', () => {
      const fault = { OperationErrors: [{ Code: 109, ErrorCode: 'AuthenticationTokenExpired', Message: 'expired' }] }
      expect(utils.parseBingFault(fault, 401, 'Unauthorized').status).toBe(401)
    })

    it('parseBingFault: non-auth error (117 rate limit) keeps its real HTTP status', () => {
      const fault = { Errors: [{ Code: 117, ErrorCode: 'CallRateExceeded', Message: 'slow down' }] }
      expect(utils.parseBingFault(fault, 429, 'Too Many Requests').status).toBe(429)
    })

    it('parseBingFault: empty/unknown body falls back to the HTTP status and message', () => {
      const { status, errormessage } = utils.parseBingFault(undefined, 500, 'Server Error')
      expect(status).toBe(500)
      expect(errormessage).toBe('Server Error')
    })

    it('logs the tracking id on a Bing 401 delivery failure (for support tickets)', async () => {
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(
          401,
          {
            Errors: [{ Code: 109, ErrorCode: 'AuthenticationTokenExpired', Message: 'Authentication token expired.' }],
            TrackingId: 'track-e2e',
            Type: 'AdApiFaultDetail'
          },
          { TrackingId: 'track-e2e' }
        )
      const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as any

      await testDestination.testBatchAction('syncAudiences', {
        events: [
          createTestEvent({
            type: 'identify',
            properties: { aud_key: true },
            context: { traits: { email: 'one@segment.com' } }
          })
        ],
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      const warned = (logger.warn as jest.Mock).mock.calls.map((c) => c[0]).join('\n')
      expect(warned).toContain('[ms-bing-ads-audiences][DELIVERY_ERROR]')
      expect(warned).toContain('trackingId=track-e2e')
    })

    // executeBatch (unlike testBatchAction, which returns the raw HTTP responses) returns the
    // multistatus array, so response[0].status IS the per-item status the framework's OAuth retry
    // reads. executeBatch does not apply defaultMappings, so provide a full explicit mapping.
    const explicitMapping = {
      ...baseMapping,
      email: { '@path': '$.context.traits.email' },
      traits_or_props: { '@path': '$.properties' }
    }
    const batchEvent = () =>
      createTestEvent({
        type: 'identify',
        properties: { aud_key: true },
        context: { traits: { email: 'one@segment.com' } }
      })

    // Batch path: the framework's OAuth retry keys on a per-item status of 401 in the multistatus
    // array. This is the exact field the original bug got wrong (recorded undefined), so assert the
    // recorded per-item status is 401.
    it('batch: records a per-item status of 401 for an expired-token (109) fault', async () => {
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(401, {
          Errors: [{ Code: 109, ErrorCode: 'AuthenticationTokenExpired', Message: 'Authentication token expired.' }],
          TrackingId: 'track-109-batch',
          Type: 'AdApiFaultDetail'
        })

      const response = await testDestination.executeBatch('syncAudiences', {
        events: [batchEvent()],
        mapping: explicitMapping,
        settings
      })

      expect(response[0]).toMatchObject({ status: 401 })
    })

    // Batch path: a no-access (106) fault must NOT be normalized to 401 — a refresh can't grant
    // access, so recording 401 would cause a pointless refresh loop. The real 403 must survive.
    it('batch: keeps the real per-item status (403) for a no-access (106) fault, does NOT force 401', async () => {
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(403, {
          Errors: [{ Code: 106, ErrorCode: 'UserIsNotAuthorized', Message: 'no access' }],
          Type: 'AdApiFaultDetail'
        })

      const response = await testDestination.executeBatch('syncAudiences', {
        events: [batchEvent()],
        mapping: explicitMapping,
        settings
      })

      expect(response[0]).toMatchObject({ status: 403 })
    })

    // Single-event (perform) path: a refreshable auth fault is re-thrown as InvalidAuthenticationError
    // (status 401) so the framework refreshes the token and retries. This is the headline behavior and
    // has no other coverage — every other error-path test uses the batch multistatus path.
    it('perform: re-throws a refreshable 401 (109) as InvalidAuthenticationError', async () => {
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(401, {
          Errors: [{ Code: 109, ErrorCode: 'AuthenticationTokenExpired', Message: 'Authentication token expired.' }],
          Type: 'AdApiFaultDetail'
        })

      const event = createTestEvent({
        type: 'identify',
        properties: { aud_key: true },
        context: { traits: { email: 'demo@segment.com' } }
      })

      await expect(
        testDestination.testAction('syncAudiences', { event, mapping: baseMapping, useDefaultMappings: true, settings })
      ).rejects.toBeInstanceOf(InvalidAuthenticationError)
    })

    // Single-event path: the same must hold when a refreshable code (105) arrives on a NON-401 HTTP
    // status — this is the defensive normalization that lets refresh fire regardless of Bing's status.
    it('perform: normalizes a refreshable code (105) on HTTP 500 to InvalidAuthenticationError', async () => {
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(500, {
          Errors: [{ Code: 105, ErrorCode: 'AuthenticationTokenInvalid', Message: 'bad token' }],
          Type: 'AdApiFaultDetail'
        })

      const event = createTestEvent({
        type: 'identify',
        properties: { aud_key: true },
        context: { traits: { email: 'demo@segment.com' } }
      })

      await expect(
        testDestination.testAction('syncAudiences', { event, mapping: baseMapping, useDefaultMappings: true, settings })
      ).rejects.toBeInstanceOf(InvalidAuthenticationError)
    })

    // Single-event path: a NON-refreshable fault (106 no-access) must surface as its real error, NOT
    // masquerade as an auth problem — otherwise it would trigger a refresh loop that can never succeed.
    it('perform: does NOT convert a non-refreshable (106) fault into InvalidAuthenticationError', async () => {
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(403, {
          Errors: [{ Code: 106, ErrorCode: 'UserIsNotAuthorized', Message: 'no access' }],
          Type: 'AdApiFaultDetail'
        })

      const event = createTestEvent({
        type: 'identify',
        properties: { aud_key: true },
        context: { traits: { email: 'demo@segment.com' } }
      })

      const error = await testDestination
        .testAction('syncAudiences', { event, mapping: baseMapping, useDefaultMappings: true, settings })
        .catch((e) => e)

      expect(error).toBeDefined()
      expect(error).not.toBeInstanceOf(InvalidAuthenticationError)
    })
  })
})
