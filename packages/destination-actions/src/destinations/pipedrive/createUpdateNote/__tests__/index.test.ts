import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const PIPEDRIVE_API_KEY = 'random string'
const PIPEDRIVE_DOMAIN = 'companydomain'
const NOTE_ID = 31338

describe('Pipedrive.createUpdateNote', () => {
  it('should create note', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .post('/notes', { content: 'Some Name', person_id: 420 })
      .query({ api_token: PIPEDRIVE_API_KEY })
      .reply(200)

    scope
      .get(/.*/)
      .query((q) => {
        return q.field_key === 'name' && q.field_type === 'personField' && q.term === 'John Doe'
      })
      .reply(200, {
        data: [{ id: 420 }]
      })

    await testDestination.testAction('createUpdateNote', {
      mapping: { content: 'Some Name', person_match_field: 'name', person_match_value: 'John Doe' },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    expect(scope.isDone()).toBe(true)
  })

  it('should update note', async () => {
    const scope = nock(`https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`)
      .put(`/notes/${NOTE_ID}`, { content: 'New Content' })
      .query({ api_token: PIPEDRIVE_API_KEY })
      .reply(200)

    await testDestination.testAction('createUpdateNote', {
      mapping: {
        content: 'New Content',
        note_id: NOTE_ID
      },
      settings: { apiToken: PIPEDRIVE_API_KEY, domain: PIPEDRIVE_DOMAIN }
    })

    expect(scope.isDone()).toBe(true)
  })
})
