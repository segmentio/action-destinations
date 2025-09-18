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
      traits: { email: 'demo@segment.com', aud_key: true }
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
      traits: { email: 'remove@segment.com' }
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
      traits: { aud_key: true }
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
      createTestEvent({ type: 'identify', traits: { email: 'one@segment.com', aud_key: true } }),
      createTestEvent({ type: 'identify', traits: { email: 'two@segment.com', aud_key: true } })
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
      createTestEvent({ type: 'identify', traits: { email: 'bye1@segment.com' } }),
      createTestEvent({ type: 'identify', traits: { email: 'bye2@segment.com' } })
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
      createTestEvent({ type: 'identify', userId: 'crm_111', traits: { aud_key: true } }),
      createTestEvent({ type: 'identify', userId: 'crm_222', traits: { aud_key: true } })
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
      createTestEvent({ type: 'identify', traits: { email: 'add1@segment.com', aud_key: true } })
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

  it('should throw non-HTTP errors in batch mode', async () => {
    // Create a custom error that is NOT an HTTPError
    const customError = new Error('Custom non-HTTP error')

    // Mock sendDataToMicrosoftBingAds to throw a non-HTTP error
    const sendDataMock = utils.sendDataToMicrosoftBingAds as jest.Mock
    sendDataMock.mockImplementationOnce(() => {
      throw customError
    })

    const events = [createTestEvent({ type: 'identify', traits: { email: 'test@segment.com', aud_key: true } })]

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
