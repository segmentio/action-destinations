import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const PIPEDRIVE_API_KEY = 'random string'
const PIPEDRIVE_DOMAIN = 'companydomain'

describe('Pipedrive.createUpdateDeal', () => {
  it('should work', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .post('/deals', { title: 'Some Name', person_id: 420 })
      .query({api_token : PIPEDRIVE_API_KEY})
      .reply(200)

    scope.get(/.*/)
      .query(q => {
          return q.field_key === "name" && q.field_type === 'personField' && q.term === 'John Doe';
        }
      )
      .reply(200, {
        data: [
          {id: 420 }
        ]
      })

    await testDestination.testAction('createUpdateDeal', {
      mapping: { title: 'Some Name', person_match_field: "name", person_match_value: 'John Doe' },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    expect(scope.isDone()).toBe(true)
  })
})
