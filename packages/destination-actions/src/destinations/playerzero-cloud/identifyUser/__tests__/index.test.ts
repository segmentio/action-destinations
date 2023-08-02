import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const PLAYERZERO_PROJECT_TOKEN = '000000000000000000000000'
const testDestination = createTestIntegration(Destination)

describe('PlayerzeroCloud.identifyUser', () => {
  it('works with default mappings', async () => {
    const event = createTestEvent({
      type: 'identify',
      event: 'Test Identify',
      traits: {
        name: 'Test User'
      }
    })
    nock('https://sdk.playerzero.app').post('/connect/segment/identity').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: PLAYERZERO_PROJECT_TOKEN
      }
    })

    expect(responses[0].status).toBe(200)
  })
})
