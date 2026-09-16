import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../config'
import { NO_LIST_ID_ERROR } from '../functions'

const testDestination = createTestIntegration(Destination)

const settings = { api_key: 'fake-api-key' }
const listId = 'XYZABC'

function membershipEvent(
  email: string,
  membership: boolean,
  computationClass: 'audience' | 'journey_step' = 'audience'
) {
  return createTestEvent({
    type: 'track',
    properties: { my_computation_key: membership, email },
    context: {
      personas: {
        computation_class: computationClass,
        computation_key: 'my_computation_key'
      }
    }
  })
}

describe('Klaviyo.syncList', () => {
  beforeEach(() => nock.cleanAll())

  it('adds a profile to the list when audienceMembership is true (Engage classic audience)', async () => {
    const email = 'add-user@example.com'
    nock(API_URL)
      .post('/profiles/', { data: { type: 'profile', attributes: { email } } })
      .reply(200, { data: { id: 'PROFILE1' } })

    nock(`${API_URL}/lists/${listId}`)
      .post('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE1' }] })
      .reply(200, {})

    const r = await testDestination.testAction('syncList', {
      event: membershipEvent(email, true, 'audience'),
      settings,
      mapping: { list_id: listId, email }
    })

    expect(r[0].status).toBe(200)
  })

  it('removes a profile from the list when audienceMembership is false (Engage classic audience)', async () => {
    const email = 'remove-user@example.com'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(email,["${email}"])`)
      .reply(200, { data: [{ id: 'PROFILE1' }] })

    nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE1' }] })
      .reply(200, {})

    const r = await testDestination.testAction('syncList', {
      event: membershipEvent(email, false, 'audience'),
      settings,
      mapping: { list_id: listId, email }
    })

    expect(r[0].status).toBe(200)
  })

  it('adds a profile when audienceMembership is true (JourneysV2 - journey_step with membership boolean present)', async () => {
    const email = 'jv2-add@example.com'
    nock(API_URL)
      .post('/profiles/', { data: { type: 'profile', attributes: { email } } })
      .reply(200, { data: { id: 'PROFILE2' } })

    nock(`${API_URL}/lists/${listId}`)
      .post('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE2' }] })
      .reply(200, {})

    const r = await testDestination.testAction('syncList', {
      event: membershipEvent(email, true, 'journey_step'),
      settings,
      mapping: { list_id: listId, email }
    })

    expect(r[0].status).toBe(200)
  })

  it('removes a profile when audienceMembership is false (JourneysV2 - journey_step with membership boolean present)', async () => {
    const email = 'jv2-remove@example.com'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(email,["${email}"])`)
      .reply(200, { data: [{ id: 'PROFILE2' }] })

    nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE2' }] })
      .reply(200, {})

    const r = await testDestination.testAction('syncList', {
      event: membershipEvent(email, false, 'journey_step'),
      settings,
      mapping: { list_id: listId, email }
    })

    expect(r[0].status).toBe(200)
  })

  it('throws when no identifier is provided on the add branch', async () => {
    await expect(
      testDestination.testAction('syncList', {
        event: membershipEvent('', true),
        settings,
        mapping: { list_id: listId }
      })
    ).rejects.toThrow('One of External ID, Phone Number or Email is required.')
  })

  it('throws when no identifier is provided on the remove branch', async () => {
    await expect(
      testDestination.testAction('syncList', {
        event: membershipEvent('', false),
        settings,
        mapping: { list_id: listId }
      })
    ).rejects.toThrow('One of External ID, Phone Number or Email is required.')
  })

  it('throws for an invalid email on the add branch', async () => {
    await expect(
      testDestination.testAction('syncList', {
        event: membershipEvent('user@domain.c', true),
        settings,
        mapping: { list_id: listId, email: 'user@domain.c' }
      })
    ).rejects.toThrow('Email must be a valid email address.')
  })

  it('throws when no profiles are found on the remove branch', async () => {
    const email = 'missing@example.com'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(email,["${email}"])`)
      .reply(200, { data: [] })

    await expect(
      testDestination.testAction('syncList', {
        event: membershipEvent(email, false),
        settings,
        mapping: { list_id: listId, email }
      })
    ).rejects.toThrow('No profiles found for the provided identifiers.')
  })

  it('throws the expanded no-list-id error when neither the hook nor list_id supplies one', async () => {
    await expect(
      testDestination.testAction('syncList', {
        event: membershipEvent('no-list@example.com', true),
        settings,
        mapping: { email: 'no-list@example.com' }
      })
    ).rejects.toThrow(NO_LIST_ID_ERROR)
  })

  it('throws when audienceMembership cannot be resolved to a boolean', async () => {
    const event = createTestEvent({ type: 'track', properties: { email: 'no-membership@example.com' } })

    await expect(
      testDestination.testAction('syncList', {
        event,
        settings,
        mapping: { list_id: listId, email: 'no-membership@example.com' }
      })
    ).rejects.toThrow('Audience Membership must be a boolean')
  })
})
