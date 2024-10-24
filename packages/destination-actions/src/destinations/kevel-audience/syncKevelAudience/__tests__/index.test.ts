import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const goodTrackEvent = createTestEvent({
  type: 'track',
  userId: 'uid1',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'kevel_segment_test_name'
    },
    traits: {
      email: 'test@email.com'
    }
  },
  properties: {
    audience_key: 'kevel_segment_test_name',
    kevel_segment_test_name: true
  }
})

const goodIdentifyEvent = createTestEvent({
  type: 'identify',
  userId: 'uid1',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'kevel_segment_test_name'
    }
  },
  traits: {
    audience_key: 'kevel_segment_test_name',
    kevel_segment_test_name: true
  },
  properties: undefined
})

describe('KevelAuddience.syncKevelAudience', () => {
  it('should not throw an error if the audience creation succeed - track', async () => {
    const baseUrl = 'https://tr.domain.brand.com/'

    nock(baseUrl)
      .post('/events/server', (body) => body.customData.kevel_segment_test_name === true)
      .reply(200)

    await expect(
      testDestination.testAction('syncKevelAudience', {
        event: goodTrackEvent,
        settings: {
          audienceDomain: 'domain.brand.com',
          userIdType: 'email_sha256',
          apiKey: 'api_key',
          clientId: 'client_id',
          siteId: 'site_id',
          eventType: 'segmentSync'
        },
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should not throw an error if the audience creation succeed - identify', async () => {
    const baseUrl = 'https://tr.domain.brand.com'

    nock(baseUrl)
      .post('/events/server', (body) => body.customData.kevel_segment_test_name === true)
      .reply(200)

    await expect(
      testDestination.testAction('syncKevelAudience', {
        event: goodIdentifyEvent,
        settings: {
          audienceDomain: 'domain.brand.com',
          userIdType: 'email_sha256',
          apiKey: 'api_key',
          clientId: 'client_id',
          siteId: 'site_id',
          eventType: 'segmentSync'
        },
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })
})
