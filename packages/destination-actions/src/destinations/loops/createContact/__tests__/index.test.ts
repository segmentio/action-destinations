import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const LOOPS_API_KEY = 'some random secret'

describe('Loops.createContact', () => {
  it('should validate action fields', async () => {
    try {
      await testDestination.testAction('createContact', {
        settings: { apiKey: LOOPS_API_KEY }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'email'.")
    }
  })

  it('should work', async () => {
    nock('https://app.loops.so/api/v1').post('/contacts/create', { email: 'test@example.com' }).reply(200, {
      success: true,
      id: 'someId'
    })

    const responses = await testDestination.testAction('createContact', {
      mapping: { email: 'test@example.com' },
      settings: { apiKey: LOOPS_API_KEY }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
