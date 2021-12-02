import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const PIPEDRIVE_API_KEY = 'random string'
const PIPEDRIVE_DOMAIN = 'companydomain'
const PERSON_ID = 33333

describe('Pipedrive.createUpdatePerson', () => {
  it('should create person if none exists', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .post('/persons', { name: 'Acme Corp' })
      .query({ api_token: PIPEDRIVE_API_KEY })
      .reply(200)

    scope
      .get(/.*/)
      .query((q) => {
        return q.field_key === 'name' && q.field_type === 'personField' && q.term === 'Does not exist'
      })
      .reply(200, {
        data: []
      })

    await testDestination.testAction('createUpdatePerson', {
      mapping: { name: 'Acme Corp', match_field: 'name', match_value: 'Does not exist' },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    expect(scope.isDone()).toBe(true)
  })

  it('should update person', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .put(`/persons/${PERSON_ID}`, { name: 'Pipedrive OÜ' })
      .query({ api_token: PIPEDRIVE_API_KEY })
      .reply(200)

    scope
      .get(/.*/)
      .query((q) => {
        return q.field_key === 'id' && q.field_type === 'personField' && q.term === `${PERSON_ID}`
      })
      .reply(200, {
        data: [{ id: PERSON_ID }]
      })

    await testDestination.testAction('createUpdatePerson', {
      mapping: {
        name: 'Pipedrive OÜ',
        match_value: PERSON_ID
      },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    expect(scope.isDone()).toBe(true)
  })
})
