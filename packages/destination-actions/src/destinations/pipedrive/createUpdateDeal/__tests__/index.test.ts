import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const PIPEDRIVE_API_KEY = 'random string'
const PIPEDRIVE_DOMAIN = 'companydomain'

describe('Pipedrive.createUpdateDeal', () => {
  it('should work', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .post('/deals', { title: 'Some Name' })
      .query({api_token : PIPEDRIVE_API_KEY})
      .reply(200)

    await testDestination.testAction('createUpdateDeal', {
      mapping: { title: 'Some Name' },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    scope.isDone()
  })

  it('should validate action fields', async () => {
    try {
      await testDestination.testAction('createUpdateDeal', {
        settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN },
        mapping: {},
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'title'.")
    }
  })
})
