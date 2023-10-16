import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const event = createTestEvent({
  event: 'Example Event',
  type: 'track',
  context: {
    traits: {
      email: 'testing@testing.com'
    }
  }
})

describe('LinkedinConversions.streamConversion', () => {
  //This is an example unit test case, needs to update after developing streamConversion action
  it('A sample unit case', async () => {
    nock('https://example.com').post('/').reply(200, {})
    await expect(
      testDestination.testAction('sampleEvent', {
        event
      })
    ).resolves.not.toThrowError()
  })
})
