import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.createAudience', () => {
  it('audience_id is missing', async () => {
    try {
      await testDestination.testAction('createAudience', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'audienceId'.")
    }
  })

  it('audience_name is missing', async () => {
    try {
      await testDestination.testAction('createAudience', {
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
      .post('/segment/audiences', {
        audience_id: 'some_audience_id',
        audience_name: 'some_audience_name'
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(201)

    await testDestination.testAction('createAudience', {
      settings: {
        api_key: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        audience_id: 'some_audience_id',
        audience_name: 'some_audience_name'
      }
    })
  })
})
