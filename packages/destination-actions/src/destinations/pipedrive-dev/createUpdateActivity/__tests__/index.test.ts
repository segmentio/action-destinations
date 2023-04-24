import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const PIPEDRIVE_API_KEY = 'random string'
const PIPEDRIVE_DOMAIN = 'https://companydomain.pipedrive.com'
const ACTIVITY_ID = 65536

describe('Pipedrive.createUpdateActivity', () => {
  it('should create activity', async () => {
    const scope = nock(`${PIPEDRIVE_DOMAIN}/api/v1`).post('/activities', { subject: 'Some Name' }).reply(200)

    await testDestination.testAction('createUpdateActivity', {
      mapping: { subject: 'Some Name' },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN },
      auth: { accessToken: 'fake-access-token', refreshToken: 'fake-refresh-token' }
    })

    expect(scope.isDone()).toBe(true)
  })

  it('should update activity', async () => {
    const scope = nock(`${PIPEDRIVE_DOMAIN}/api/v1`)
      .put(`/activities/${ACTIVITY_ID}`, { subject: 'Some Name' })
      .reply(200)

    await testDestination.testAction('createUpdateActivity', {
      mapping: { subject: 'Some Name', activity_id: ACTIVITY_ID },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN },
      auth: { accessToken: 'fake-access-token', refreshToken: 'fake-refresh-token' }
    })

    expect(scope.isDone()).toBe(true)
  })
})
