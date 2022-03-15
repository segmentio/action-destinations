import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.updateAudience', () => {
  it('audienceId is missing', async () => {
    try {
      await testDestination.testAction('updateAudience', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'audienceId'.")
    }
  })

  it('audienceName is missing', async () => {
    try {
      await testDestination.testAction('updateAudience', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://something.europe-west1.talon.one'
        },
        mapping: {
          audience_id: 'some_audience_id'
        }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'audienceName'.")
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put('/segment/audiences/some_audience_id', {
        audienceName: 'some_audience_name'
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('updateAudience', {
      settings: {
        api_key: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        audienceId: 'some_audience_id',
        audienceName: 'some_audience_name'
      }
    })
  })
})
