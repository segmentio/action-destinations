import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { HUBSPOT_BASE_URL } from '../../properties'

let testDestination = createTestIntegration(Destination)

beforeEach((done) => {
  // Re-Initialize the destination before each test
  // This is done to mitigate a bug where action responses persist into other tests
  testDestination = createTestIntegration(Destination)
  nock.cleanAll()
  done()
})

const testEmail = 'vep@beri.dz'
const event = createTestEvent({
  type: 'identify',
  traits: {
    email: testEmail,
    first_name: 'John',
    last_name: 'Doe',
    address: {
      city: 'San Francisco',
      country: 'USA',
      postal_code: '600001',
      state: 'California',
      street: 'Vancover st'
    },
    graduation_date: 1664533942262,
    lifecyclestage: 'subscriber',
    company: 'Segment',
    phone: '+13134561129',
    website: 'segment.inc1'
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

describe('HubSpot.upsertContact', () => {
  test('should create contact successfully and set contact id in transaction context', async () => {
    const expectedPayload = {
      properties: {
        email: testEmail,
        firstname: 'John',
        lastname: 'Doe',
        country: 'USA',
        zip: '600001',
        state: 'California',
        address: 'Vancover st',
        city: 'San Francisco',
        graduation_date: 1664533942262,
        company: 'Segment',
        phone: '+13134561129',
        website: 'segment.inc1'
      }
    }

    const mapping = {
      properties: {
        graduation_date: {
          '@path': '$.traits.graduation_date'
        }
      }
    }
    nock(HUBSPOT_BASE_URL).patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, expectedPayload).reply(404, {
      status: 'error',
      message: 'resource not found',
      correlationId: 'be56c5f3-5841-4661-b52f-65b3aacd0244'
    })

    nock(HUBSPOT_BASE_URL).post('/crm/v3/objects/contacts', expectedPayload).reply(201, {
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
        country: 'USA',
        zip: '600001',
        state: 'California',
        address: 'Vancover st',
        city: 'San Francisco',
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber',
        company: 'Segment',
        phone: '+13134561129',
        website: 'segment.inc1'
      }
    }

    nock(HUBSPOT_BASE_URL)
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
        country: 'USA',
        zip: '600001',
        state: 'California',
        address: 'Vancover st',
        city: 'San Francisco',
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber',
        company: 'Segment',
        phone: '+13134561129',
        website: 'segment.inc1'
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

    nock(HUBSPOT_BASE_URL)
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
        city: 'San Francisco',
        country: 'USA',
        zip: '600001',
        state: 'California',
        address: 'Vancover st',
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber',
        email: testEmail,
        company: 'Segment',
        phone: '+13134561129',
        website: 'segment.inc1'
      }
    }

    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: 'lead'
        }
      })

    nock(HUBSPOT_BASE_URL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, { properties: { lifecyclestage: '' } })
      .reply(200, {
        id: '801',
        properties: {
          lifecyclestage: ''
        }
      })

    nock(HUBSPOT_BASE_URL)
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
          city: 'San Francisco'
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

  test('should handle flattening of objects', async () => {
    nock(HUBSPOT_BASE_URL).patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`).reply(404, {
      status: 'error',
      message: 'resource not found',
      correlationId: 'be56c5f3-5841-4661-b52f-65b3aacd0244'
    })

    nock(HUBSPOT_BASE_URL)
      .post('/crm/v3/objects/contacts')
      .reply(201, {
        id: '801',
        properties: {
          email: testEmail,
          firstname: 'John',
          lastname: 'Doe',
          country: 'USA',
          zip: '600001',
          state: 'California',
          address: 'Vancover st',
          city: 'San Francisco',
          graduation_date: 1664533942262,
          company: 'Segment',
          phone: '+13134561129',
          website: 'segment.inc1'
        }
      })

    const testEvent = createTestEvent({
      type: 'identify',
      traits: {
        email: testEmail,
        first_name: 'John',
        last_name: 'Doe',
        address: {
          city: 'San Francisco',
          country: 'USA',
          postal_code: '600001',
          state: 'California',
          street: 'Vancover st'
        },
        graduation_date: 1664533942262,
        lifecyclestage: 'subscriber',
        company: 'Segment',
        phone: '+13134561129',
        website: 'segment.inc1',
        customPropertyOne: [1, 2, 3, 4, 5],
        customPropertyTwo: {
          a: 1,
          b: 2,
          c: 3
        },
        customPropertyThree: [1, 'two', true, { four: 4 }]
      }
    })

    const mapping = {
      properties: {
        graduation_date: {
          '@path': '$.traits.graduation_date'
        },
        custom_property_1: {
          '@path': '$.traits.customPropertyOne'
        },
        custom_property_2: {
          '@path': '$.traits.customPropertyTwo'
        },
        custom_property_3: {
          '@path': '$.traits.customPropertyThree'
        }
      }
    }

    const transactionContext: Record<string, string> = {}
    const setTransactionContext = (key: string, value: string) => (transactionContext[key] = value)
    const responses = await testDestination.testAction('upsertContact', {
      mapping,
      useDefaultMappings: true,
      event: testEvent,
      transactionContext: { transaction: {}, setTransaction: setTransactionContext }
    })

    expect(responses).toHaveLength(2)
    expect(responses[0].options.json).toMatchObject({
      properties: {
        custom_property_1: '1;2;3;4;5',
        custom_property_2: '{"a":1,"b":2,"c":3}',
        custom_property_3: '1;two;true;{"four":4}'
      }
    })
    expect(responses[1].options.json).toMatchObject({
      properties: {
        custom_property_1: '1;2;3;4;5',
        custom_property_2: '{"a":1,"b":2,"c":3}',
        custom_property_3: '1;two;true;{"four":4}'
      }
    })
  })
})
