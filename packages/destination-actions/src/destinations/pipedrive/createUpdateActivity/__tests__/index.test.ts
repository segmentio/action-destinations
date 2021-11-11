import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const PIPEDRIVE_API_KEY = 'random string'
const PIPEDRIVE_DOMAIN = 'companydomain'

describe('Pipedrive.createUpdateActivity', () => {
  it('should work', async () => {
    nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .post('/activities', { subject: 'Some Name' })
      .query({params: {api_token : PIPEDRIVE_API_KEY}})
      .reply(200)

    await testDestination.testAction('createUpdateActivity', {
      mapping: { subject: 'Some Name' },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })
  })
})
