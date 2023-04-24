import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const PIPEDRIVE_API_KEY = 'random string'
const PIPEDRIVE_DOMAIN = 'companydomain'
const ACTIVITY_ID = 65536

describe('Pipedrive.createUpdateActivity', () => {
  it('should create activity', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .post('/activities', { subject: 'Some Name' })
      .query({ api_token: PIPEDRIVE_API_KEY })
      .reply(200)

    await testDestination.testAction('createUpdateActivity', {
      mapping: { subject: 'Some Name' },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    expect(scope.isDone()).toBe(true)
  })

  it('should update activity', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .put(`/activities/${ACTIVITY_ID}`, { subject: 'Some Name' })
      .query({ api_token: PIPEDRIVE_API_KEY })
      .reply(200)

    await testDestination.testAction('createUpdateActivity', {
      mapping: { subject: 'Some Name', activity_id: ACTIVITY_ID },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    expect(scope.isDone()).toBe(true)
  })
})
