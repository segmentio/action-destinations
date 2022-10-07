import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { hubSpotBaseURL } from '../../properties'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

const testEmail = 'vep@beri.dz'
const event = createTestEvent({
  type: 'identify',
  traits: {
    email: testEmail,
    first_name: 'John',
    last_name: 'Doe',
    address: {
      city: 'San Fransico'
    },
    graduation_date: 1664533942262,
    lifecyclestage: 'subscriber'
  }
})
const mapping = {
  lifecyclestage: {
    '@path': '$.traits.lifecyclestage'
  },
  properties: {
    graduation_date: {
      '@path': '$.traits.graduation_date'
    }
  }
}

describe('Hubspot.upsertContact', () => {
  test('should create contact successfully and set contact id in transaction context', async () => {
    const expectedPayload = {
      properties: {
        email: testEmail,
        firstname: 'John',
        lastname: 'Doe',
        city: 'San Fransico',
        graduation_date: 1664533942262
      }
    }

    const mapping = {
      properties: {
        graduation_date: {
          '@path': '$.traits.graduation_date'
        }
      }
    }
    nock(hubSpotBaseURL).patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, expectedPayload).reply(404, {
      status: 'error',
      message: 'resource not found',
      correlationId: 'be56c5f3-5841-4661-b52f-65b3aacd0244'
    })

    nock(hubSpotBaseURL).post('/crm/v3/objects/contacts', expectedPayload).reply(201, {
      id: '801',
      properties: expectedPayload.properties
    })

    const transactionContext: Record<string, string> = {}
    const setTransactionContext = (key: string, value: string) => (transactionContext[key] = value)

    await expect(
      testDestination.testAction('upsertContact', {
        mapping,
        useDefaultMappings: true,
        event,
        transactionContext: { transaction: {}, setTransaction: setTransactionContext }
      })
    ).resolves.not.toThrowError()

    expect(transactionContext['contact_id']).toEqual('801')
  })

  test('should update contact successfully and set contact id in transaction context', async () => {
    const patchExpectedPayload = {
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        email: testEmail,
        city: 'San Fransico',
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber'
      }
    }

    nock(hubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: 'subscriber'
        }
      })

    const transactionContext = {
      transaction: {} as Record<string, string>,
      setTransaction: (key: string, value: string) => (transactionContext.transaction[key] = value)
    }

    await expect(
      testDestination.testAction('upsertContact', {
        mapping,
        useDefaultMappings: true,
        event,
        transactionContext
      })
    ).resolves.not.toThrowError()

    expect(transactionContext.transaction['contact_id']).toEqual('801')
  })

  test('should throw non 404 errors', async () => {
    const patchExpectedPayload = {
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        email: testEmail,
        city: 'San Fransico',
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber'
      }
    }

    const errorResponse = {
      status: 'error',
      message: 'No properties found to update, please provide at least one.',
      correlationId: '7b13bba7-f51b-4fd3-a251-46242abb92e6',
      context: {
        properties: ['{}']
      },
      category: 'VALIDATION_ERROR'
    }

    nock(hubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(400, errorResponse)

    const transactionContext = {
      transaction: {} as Record<string, string>,
      setTransaction: (key: string, value: string) => ({ [key]: value })
    }

    await expect(
      testDestination.testAction('upsertContact', {
        mapping,
        useDefaultMappings: true,
        event,
        transactionContext
      })
    ).rejects.toThrowError()

    expect(!transactionContext.transaction['contact_id'])
  })

  test('should reset lifecyclestage and update if lifecyclestage is to be moved backwards', async () => {
    const patchExpectedPayload = {
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        city: 'San Fransico',
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber',
        email: testEmail
      }
    }

    nock(hubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: 'lead'
        }
      })

    nock(hubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, { properties: { lifecyclestage: '' } })
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: ''
        }
      })

    nock(hubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: 'subscriber'
        }
      })

    const transactionContext = {
      transaction: {} as Record<string, string>,
      setTransaction: (key: string, value: string) => (transactionContext.transaction[key] = value)
    }

    await expect(
      testDestination.testAction('upsertContact', {
        mapping,
        useDefaultMappings: true,
        event,
        transactionContext
      })
    ).resolves.not.toThrowError()

    expect(transactionContext.transaction['contact_id']).toEqual('801')
  })

  test('should fail if email is missing', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        first_name: 'John',
        last_name: 'Doe',
        address: {
          city: 'San Fransico'
        },
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber'
      }
    })

    const transactionContext = {
      transaction: {} as Record<string, string>,
      setTransaction: (key: string, value: string) => (transactionContext.transaction[key] = value)
    }

    await expect(
      testDestination.testAction('upsertContact', {
        mapping,
        useDefaultMappings: true,
        event,
        transactionContext
      })
    ).rejects.toThrowError("The root value is missing the required field 'email'.")
  })
})
