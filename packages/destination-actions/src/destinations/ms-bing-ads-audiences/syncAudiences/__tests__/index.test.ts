import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
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

    const makeLogger = () =>
      ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        crit: jest.fn(),
        log: jest.fn(),
        withTags: jest.fn(),
        level: 'info',
        name: 'test'
      } as any)

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

      expect(logger.info).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('logs response metadata when the flag is on, without leaking CustomerListItems', async () => {
      nock(BASE_URL).post('/CustomerListUserData/Apply').reply(200, { PartialErrors: [] })
      const logger = makeLogger()

      await testDestination.testAction('syncAudiences', {
        event: addEvent(),
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      expect(logger.info).toHaveBeenCalledTimes(1)
      const logged = (logger.info as jest.Mock).mock.calls[0][0] as string
      expect(logged).toContain('[ms-bing-ads-audiences][DEBUG]')
      expect(logged).toContain('identifierType=Email')
      expect(logged).toContain('itemCount=1')
      expect(logged).toContain('partialErrors=[]')
      // The hashed identifier must never be logged.
      expect(logged).not.toContain('5a95f052958dac8ed1d66d74eb481b3ccdbbc953b583c5ff0325be6b091d6281')
    })

    it('logs the Microsoft tracking id from the response header', async () => {
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

      const logged = (logger.info as jest.Mock).mock.calls[0][0] as string
      expect(logged).toContain('trackingId=abc-123-track')
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

      const logged = (logger.info as jest.Mock).mock.calls[0][0] as string
      expect(logged).toContain('trackingId=body-track-789')
    })

    it('redacts PartialError free-text fields that can echo identifiers', async () => {
      // Bing can echo the offending identifier in Message/Details/FieldPath. Only codes/index
      // should be logged, never the free-text fields.
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

      const logged = (logger.info as jest.Mock).mock.calls[0][0] as string
      expect(logged).toContain('ErrorCode')
      expect(logged).toContain('InvalidCustomerListItem')
      // The free-text fields (and any identifier they echo) must not be logged.
      expect(logged).not.toContain('crm_secret_12345')
      expect(logged).not.toContain('Message')
      expect(logged).not.toContain('FieldPath')
    })

    it('strips control characters from logged content to prevent log injection', async () => {
      // A crafted response body with newlines must not be able to forge log lines.
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(200, {
          PartialErrors: [
            { ErrorCode: 'X\nInjected', Code: 1, Index: 0, Type: 'T', Message: null, Details: null, FieldPath: null }
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

      const logged = (logger.info as jest.Mock).mock.calls[0][0] as string
      expect(logged).not.toContain('\n')
    })

    it('sanitizes a crafted audience id to prevent log injection', async () => {
      nock(BASE_URL).post('/CustomerListUserData/Apply').reply(200, { PartialErrors: [] })
      const logger = makeLogger()

      await testDestination.testAction('syncAudiences', {
        event: addEvent(),
        mapping: { ...baseMapping, audience_id: 'aud\n_injected' },
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      const logged = (logger.info as jest.Mock).mock.calls[0][0] as string
      expect(logged).not.toContain('\n')
    })

    it('truncates oversized values without exceeding the cap', async () => {
      // A long PartialError code forces truncation; the resulting log line's summary segment
      // (including the suffix) must stay within the configured cap.
      const longCode = 'C'.repeat(10000)
      nock(BASE_URL)
        .post('/CustomerListUserData/Apply')
        .reply(200, {
          PartialErrors: [
            { ErrorCode: longCode, Code: 1, Index: 0, Type: 'T', Message: null, Details: null, FieldPath: null }
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

      const logged = (logger.info as jest.Mock).mock.calls[0][0] as string
      const partialErrors = logged.split('partialErrors=')[1]
      expect(partialErrors).toContain('[truncated]')
      // The truncated segment (suffix included) must not exceed the 4096 cap.
      expect(partialErrors.length).toBeLessThanOrEqual(4096)
    })

    it('does not let a throwing logger break the action', async () => {
      nock(BASE_URL).post('/CustomerListUserData/Apply').reply(500, { message: 'boom' })
      const logger = makeLogger()
      ;(logger.error as jest.Mock).mockImplementation(() => {
        throw new Error('logger exploded')
      })

      // The throwing logger must be swallowed so handleHttpError still runs.
      const response = await testDestination.testBatchAction('syncAudiences', {
        events: [addEvent()],
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      expect(utils.handleHttpError).toHaveBeenCalled()
      expect(response[0].status).toBe(500)
    })

    it('does not crash when the response body is empty', async () => {
      // Empty body => response.data is undefined; logging must still succeed.
      nock(BASE_URL).post('/CustomerListUserData/Apply').reply(200)
      const logger = makeLogger()

      const response = await testDestination.testAction('syncAudiences', {
        event: addEvent(),
        mapping: baseMapping,
        useDefaultMappings: true,
        settings,
        logger,
        features: { [DEBUG_FLAG]: true }
      })

      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(response[0].status).toBe(200)
    })

    it('logs error status/metadata and still lets handleHttpError consume the response', async () => {
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

      expect(logger.error).toHaveBeenCalledTimes(1)
      const logged = (logger.error as jest.Mock).mock.calls[0][0] as string
      expect(logged).toContain('[ms-bing-ads-audiences][DEBUG] Apply failed')
      expect(logged).toContain('status=500')
      // Error log carries the same non-sensitive request metadata as the success log.
      expect(logged).toContain('action=Add')
      expect(logged).toContain('identifierType=Email')
      expect(logged).toContain('itemCount=1')
      // The raw error body is not logged verbatim (it can echo identifiers).
      expect(logged).not.toContain('boom')

      // handleHttpError must still be able to read the (cloned) response body.
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
})
