import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Avo.sendSchemaToInspector', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ previousId: 'test-prev-id' })

    nock('https://api.avo.app').post('/inspector/segment/v1/track').reply(200, {})

    const responses = await testDestination.testAction('sendSchemaToInspector', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key',
        env: 'dev'
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
  })
})
