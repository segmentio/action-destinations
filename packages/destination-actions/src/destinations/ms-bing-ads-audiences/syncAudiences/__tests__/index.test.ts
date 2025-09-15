import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../constants'

const testDestination = createTestIntegration(Destination)

const settings = {
  developerToken: 'fake-dev-token',
  customerAccountId: 'fake-customer-id',
  customerId: 'fake-customer-id'
}

const baseMapping = {
  audience_id: 'aud_123',
  operation: 'Add',
  identifier_type: 'Email',
  enable_batching: true,
  batch_size: 1000
}

describe('MS Bing Ads Audiences syncAudiences', () => {
  beforeEach(() => {
    nock.cleanAll()
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
      traits: { email: 'demo@segment.com' }
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
      mapping: { ...baseMapping, operation: 'Remove' },
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
      userId: 'crm_123'
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
      createTestEvent({ type: 'identify', traits: { email: 'one@segment.com' } }),
      createTestEvent({ type: 'identify', traits: { email: 'two@segment.com' } })
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
      mapping: { ...baseMapping, operation: 'Remove' },
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
      createTestEvent({ type: 'identify', userId: 'crm_111' }),
      createTestEvent({ type: 'identify', userId: 'crm_222' })
    ]

    const response = await testDestination.testBatchAction('syncAudiences', {
      events,
      mapping: { ...baseMapping, identifier_type: 'CRM' },
      useDefaultMappings: true,
      settings
    })

    expect(response[0].status).toBe(200)
  })

  it('should return 400 when identifier_type is Email but no email is provided (performBatch)', async () => {
    const events = [createTestEvent({ type: 'track' })]

    const response = await testDestination.executeBatch('syncAudiences', {
      events,
      mapping: baseMapping,
      settings
    })

    expect(response).toHaveLength(1)
    expect(response[0].status).toBe(400)
    // @ts-ignore
    expect(JSON.stringify(response[0].errormessage)).toContain('Email is required')
  })

  it('should return 400 when identifier_type is CRM but no crm_id is provided (performBatch)', async () => {
    const mapping = { ...baseMapping, identifier_type: 'CRM' }
    delete (mapping as any).crm_id
    delete (mapping as any).email

    const events = [
      createTestEvent({
        type: 'identify',
        traits: {}
      })
    ]

    const response = await testDestination.executeBatch('syncAudiences', {
      events,
      mapping,
      settings
    })

    expect(response).toHaveLength(1)
    expect(response[0].status).toBe(400)
    // @ts-ignore
    expect(JSON.stringify(response[0]?.errormessage)).toContain('CRM ID is required')
  })
})
