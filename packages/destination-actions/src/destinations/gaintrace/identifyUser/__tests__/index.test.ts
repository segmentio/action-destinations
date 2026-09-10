import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_BASE } from '../../api'

const testDestination = createTestIntegration(Definition)
const settings = { apiKey: 'gt_live_testkey' }

afterEach(() => {
  nock.cleanAll()
})

describe('GainTrace.identifyUser', () => {
  it('upserts a person against the company external id', async () => {
    let body: any
    nock(API_BASE)
      .post('/contacts', (b) => {
        body = b
        return true
      })
      .reply(200, { data: { id: 'c1' } })

    await testDestination.testAction('identifyUser', {
      settings,
      mapping: {
        userId: 'seg-user-1',
        accountExternalId: 'acme',
        email: 'jane@acme.com',
        name: 'Jane Doe',
        traits: { power_user: true }
      }
    })

    expect(body).toMatchObject({
      upsert: true,
      externalId: 'seg-user-1',
      accountExternalId: 'acme',
      email: 'jane@acme.com',
      name: 'Jane Doe',
      traits: { power_user: true }
    })
  })

  it('always sets upsert so a replayed identify updates instead of conflicting', async () => {
    let calls = 0
    nock(API_BASE)
      .post('/contacts', (b: any) => {
        calls++
        expect(b.upsert).toBe(true)
        return true
      })
      .times(3)
      .reply(200, {})

    const mapping = { userId: 'u', accountExternalId: 'acme' }
    for (let i = 0; i < 3; i++) {
      await testDestination.testAction('identifyUser', { settings, mapping })
    }
    expect(calls).toBe(3)
  })

  it('omits optional fields rather than sending empty values', async () => {
    let body: any
    nock(API_BASE)
      .post('/contacts', (b) => {
        body = b
        return true
      })
      .reply(200, {})

    await testDestination.testAction('identifyUser', {
      settings,
      mapping: { userId: 'u', accountExternalId: 'acme', traits: {} }
    })

    expect(body).not.toHaveProperty('email')
    expect(body).not.toHaveProperty('phone')
    expect(body).not.toHaveProperty('traits')
  })
})

describe('GainTrace.identifyUser guards', () => {
  it('refuses a person with neither a user id nor an email', () => {
    const action = Definition.actions.identifyUser
    const neverCalled = jest.fn(() => {
      throw new Error('no HTTP request should be made')
    })
    // perform throws synchronously, before any request is built. userId is a
    // required field so the framework normally rejects this first; the guard
    // keeps the action safe if it is ever invoked from another call site.
    expect(() =>
      (action.perform as unknown as (r: unknown, d: unknown) => unknown)(neverCalled, {
        payload: { accountExternalId: 'acme' },
        settings: { apiKey: 'k' }
      })
    ).toThrowError(/User ID or an email address/i)
    expect(neverCalled).not.toHaveBeenCalled()
  })
})
