import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  apiKey: 'some_api_key',
  deployment: 'https://something.europe-west1.talon.one'
}

const mapping = {
  data: [
    {
      customerProfileId: { '@path': '$.userId' },
      adds: { '@path': '$.properties.adds' },
      deletes: { '@path': '$.properties.deletes' }
    }
  ]
}

const makeEvent = (userId: string, props: { adds?: number[]; deletes?: number[] }) =>
  createTestEvent({ type: 'track', userId, properties: props })

describe('Talon.One - Update Customer Profiles Audiences (batch)', () => {
  afterEach(() => nock.cleanAll())

  it('sends many profiles in one request', async () => {
    nock('https://integration.talon.one')
      .put('/segment/customer_profiles/audiences', {
        data: [
          { customerProfileId: 'user_1', adds: [12345] },
          { customerProfileId: 'user_2', adds: [12345] },
          { customerProfileId: 'user_3', deletes: [12345] }
        ]
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .reply(204)

    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events: [
        makeEvent('user_1', { adds: [12345] }),
        makeEvent('user_2', { adds: [12345] }),
        makeEvent('user_3', { deletes: [12345] })
      ],
      settings,
      mapping
    })

    expect(responses.map((r) => r.status)).toEqual([200, 200, 200])
    expect(nock.isDone()).toBe(true)
  })

  it('rejects events where the same audience is added and removed for the same profile', async () => {
    nock('https://integration.talon.one')
      .put('/segment/customer_profiles/audiences', {
        data: [
          { customerProfileId: 'user_1', adds: [12345] },
          { customerProfileId: 'user_3', deletes: [12345] }
        ]
      })
      .reply(204)

    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events: [
        makeEvent('user_1', { adds: [12345] }),
        makeEvent('user_2', { adds: [12345] }),
        makeEvent('user_2', { deletes: [12345] }),
        makeEvent('user_3', { deletes: [12345] })
      ],
      settings,
      mapping
    })

    expect(responses.map((r) => r.status)).toEqual([200, 400, 400, 200])
  })

  it('keeps repeated profiles as separate entries', async () => {
    nock('https://integration.talon.one')
      .put('/segment/customer_profiles/audiences', {
        data: [
          { customerProfileId: 'user_1', adds: [1, 2] },
          { customerProfileId: 'user_1', deletes: [3] }
        ]
      })
      .reply(204)

    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events: [makeEvent('user_1', { adds: [1, 2] }), makeEvent('user_1', { deletes: [3] })],
      settings,
      mapping
    })

    expect(responses.map((r) => r.status)).toEqual([200, 200])
  })

  it('sends one request of at most 1000 audience changes and defers the rest with a retryable error', async () => {
    const sizes: number[] = []
    nock('https://integration.talon.one')
      .put('/segment/customer_profiles/audiences', (body: { data: { adds?: number[]; deletes?: number[] }[] }) => {
        sizes.push(body.data.reduce((sum, e) => sum + (e.adds?.length ?? 0) + (e.deletes?.length ?? 0), 0))
        return true
      })
      .reply(204)

    const events = Array.from({ length: 201 }, (_, i) => makeEvent(`user_${i}`, { adds: [1, 2, 3, 4, 5] }))
    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events,
      settings,
      mapping
    })

    expect(sizes).toEqual([1000])
    expect(responses.slice(0, 200).every((r) => r.status === 200)).toBe(true)
    expect(responses[200]).toMatchObject({ status: 503, errortype: 'RETRYABLE_ERROR' })
    expect(responses[200].errormessage).toContain('more than 1000 audience changes')
    expect(responses[200].sent).toBeUndefined()
    expect(nock.isDone()).toBe(true)
  })

  it('defers every event after the first 1000 changes, keeping events whole', async () => {
    nock('https://integration.talon.one').put('/segment/customer_profiles/audiences').reply(204)

    const events = Array.from({ length: 450 }, (_, i) => makeEvent(`user_${i}`, { adds: [1, 2, 3, 4, 5] }))
    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events,
      settings,
      mapping
    })

    expect(responses.slice(0, 200).every((r) => r.status === 200)).toBe(true)
    expect(responses.slice(200).every((r) => r.status === 503)).toBe(true)
  })

  it('does not defer a batch of 200 events with 5 changes each', async () => {
    nock('https://integration.talon.one').put('/segment/customer_profiles/audiences').reply(204)

    const events = Array.from({ length: 200 }, (_, i) => makeEvent(`user_${i}`, { adds: [1, 2, 3, 4, 5] }))
    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events,
      settings,
      mapping
    })

    expect(responses.every((r) => r.status === 200)).toBe(true)
    expect(nock.isDone()).toBe(true)
  })

  it('fails only the sent events when Talon.One rejects the request, and still defers the rest', async () => {
    nock('https://integration.talon.one').put('/segment/customer_profiles/audiences').reply(500, {})

    const events = Array.from({ length: 201 }, (_, i) => makeEvent(`user_${i}`, { adds: [1, 2, 3, 4, 5] }))
    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events,
      settings,
      mapping
    })

    expect(responses.slice(0, 200).every((r) => r.status === 500)).toBe(true)
    expect(responses[200].status).toBe(503)
  })

  it('marks events as failed with 500 on a network error', async () => {
    nock('https://integration.talon.one').put('/segment/customer_profiles/audiences').replyWithError('connection reset')

    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events: [makeEvent('user_1', { adds: [1] })],
      settings,
      mapping
    })

    expect(responses.map((r) => r.status)).toEqual([500])
  })

  it('rejects events with more than 5 audience changes in total', async () => {
    const ids = Array.from({ length: 5 }, (_, i) => i + 1)
    nock('https://integration.talon.one')
      .put('/segment/customer_profiles/audiences', {
        data: [
          { customerProfileId: 'user_1', adds: ids.slice(0, 3), deletes: ids.slice(3) },
          { customerProfileId: 'user_3', adds: [1] }
        ]
      })
      .reply(204)

    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events: [
        makeEvent('user_1', { adds: ids.slice(0, 3), deletes: ids.slice(3) }),
        makeEvent('user_2', { adds: [...ids, 6] }),
        makeEvent('user_3', { adds: [1] })
      ],
      settings,
      mapping
    })

    expect(responses.map((r) => r.status)).toEqual([200, 400, 200])
  })

  it('marks events as failed with the HTTP status when Talon.One returns 429', async () => {
    const errorBody = {
      StatusCode: 429,
      Error: 'Rate limit of 60 requests per second exceeded',
      RequestUUID: 'fd2f7c55-d064-46e1-ab87-a39cb877cd82'
    }
    nock('https://integration.talon.one').put('/segment/customer_profiles/audiences').reply(429, errorBody)

    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events: [makeEvent('user_1', { adds: [1] }), makeEvent('user_2', { adds: [1] })],
      settings,
      mapping
    })

    expect(responses.map((r) => r.status)).toEqual([429, 429])
    responses.forEach((r) => {
      expect(r).toMatchObject({ errormessage: errorBody.Error, body: errorBody })
    })
  })

  it('sends no request when every event is rejected', async () => {
    const tooMany = [1, 2, 3, 4, 5, 6]
    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events: [makeEvent('user_1', { adds: tooMany }), makeEvent('user_2', { deletes: tooMany })],
      settings,
      mapping
    })

    expect(responses.map((r) => r.status)).toEqual([400, 400])
    expect(nock.pendingMocks()).toEqual([])
  })

  it('does not count rejected events towards the 1000 changes, and keeps results at the right index', async () => {
    nock('https://integration.talon.one').put('/segment/customer_profiles/audiences').reply(204)

    const valid = (i: number) => makeEvent(`user_${i}`, { adds: [1, 2, 3, 4, 5] })
    const events = [
      ...Array.from({ length: 200 }, (_, i) => valid(i)),
      makeEvent('too_many', { adds: [1, 2, 3, 4, 5, 6] }),
      valid(201)
    ]
    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events,
      settings,
      mapping
    })

    expect(responses.slice(0, 200).every((r) => r.status === 200)).toBe(true)
    expect(responses[200].status).toBe(400)
    expect(responses[201].status).toBe(503)
  })

  it('keeps events whole when the 1000 change limit falls between events', async () => {
    const sizes: number[] = []
    nock('https://integration.talon.one')
      .put('/segment/customer_profiles/audiences', (body: { data: { adds?: number[]; deletes?: number[] }[] }) => {
        sizes.push(body.data.reduce((sum, e) => sum + (e.adds?.length ?? 0) + (e.deletes?.length ?? 0), 0))
        return true
      })
      .reply(204)

    const events = [
      ...Array.from({ length: 249 }, (_, i) => makeEvent(`user_${i}`, { adds: [1, 2, 3, 4] })),
      makeEvent('user_249', { adds: [1, 2, 3, 4, 5] }),
      makeEvent('user_250', { adds: [1] })
    ]
    const responses = await testDestination.executeBatch('updateCustomerProfilesAudiences', {
      events,
      settings,
      mapping
    })

    expect(sizes).toEqual([996])
    expect(responses.slice(0, 249).every((r) => r.status === 200)).toBe(true)
    expect(responses[249].status).toBe(503)
    expect(responses[250].status).toBe(503)
  })

  it('defaults the batch size to 200 and caps it at 1000', () => {
    const { batch_size } = Destination.actions.updateCustomerProfilesAudiences.fields
    expect(batch_size).toMatchObject({ default: 200, maximum: 1000 })
  })
})
