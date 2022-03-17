import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.deleteAudience', () => {
  it('audience_id is missing', async () => {
    try {
      await testDestination.testAction('deleteAudience', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'audience_id'.")
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .delete('/segment/audiences/some_audience_id')
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(204)

    await testDestination.testAction('deleteAudience', {
      settings: {
        api_key: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        audience_id: 'some_audience_id'
      }
    })
  })
})
