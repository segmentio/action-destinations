import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { HubSpotBaseURL } from '../../properties'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

describe('Hubspot.contact', () => {
  test('should create contact successfully and set contact id in transaction context', async () => {
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
        graduation_date: 1664533942262
      }
    })

    const patchExpectedPayload = {
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        city: 'San Fransico',
        graduation_date: 1664533942262
      }
    }

    const postExpectedPayload = {
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
    nock(HubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'be56c5f3-5841-4661-b52f-65b3aacd0244'
      })

    nock(HubSpotBaseURL).post('/crm/v3/objects/contacts', postExpectedPayload).reply(201, {
      id: '801',
      properties: postExpectedPayload.properties
    })

    const transactionContext: Record<string, string> = {}
    const setTransactionContext = (key: string, value: string) => (transactionContext[key] = value)

    await expect(
      testDestination.testAction('contact', {
        mapping,
        useDefaultMappings: true,
        event,
        transactionContext: { transaction: {}, setTransaction: setTransactionContext }
      })
    ).resolves.not.toThrowError()

    expect(transactionContext['contact_id']).toEqual('801')
  })
  test('should update contact successfully and set contact id in transaction context', async () => {
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

    const patchExpectedPayload = {
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        city: 'San Fransico',
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber'
      }
    }

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

    nock(HubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: 'subscriber'
        }
      })

    const transactionContext: Record<string, string> = {}
    const setTransactionContext = (key: string, value: string) => (transactionContext[key] = value)

    await expect(
      testDestination.testAction('contact', {
        mapping,
        useDefaultMappings: true,
        event,
        transactionContext: { transaction: {}, setTransaction: setTransactionContext }
      })
    ).resolves.not.toThrowError()

    expect(transactionContext['contact_id']).toEqual('801')
  })
  test('should reset lifecyclestage and update if lifecyclestage is to be moved backwards', async () => {
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

    const patchExpectedPayload = {
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        city: 'San Fransico',
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber'
      }
    }

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

    nock(HubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: 'lead'
        }
      })

    nock(HubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, { properties: { lifecyclestage: '' } })
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: ''
        }
      })

    nock(HubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: 'subscriber'
        }
      })

    const transactionContext: Record<string, string> = {}
    const setTransactionContext = (key: string, value: string) => (transactionContext[key] = value)

    await expect(
      testDestination.testAction('contact', {
        mapping,
        useDefaultMappings: true,
        event,
        transactionContext: { transaction: {}, setTransaction: setTransactionContext }
      })
    ).resolves.not.toThrowError()

    expect(transactionContext['contact_id']).toEqual('801')
  })
})
