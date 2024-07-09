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

const badEvent = createTestEvent({
  userId: 'uid1',
  context: {
    personas: {
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

describe('Kevel.syncAudience', () => {
  it('should not throw an error if the audience creation succeed - track', async () => {
    const userId = 'uid1'
    const networkId1 = 'networkId1'
    const baseUrl = `https://e-${networkId1}.adzerk.net/udb/${networkId1}`

    nock(baseUrl)
      .post(`/interests?userKey=${userId}`, JSON.stringify(['kevel_segment_test_name']))
      .reply(200)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodTrackEvent,
        settings: {
          networkId: networkId1,
          apiKey: 'apiKey1'
        },
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should not throw an error if the audience creation succeed - identify', async () => {
    const userId = 'uid1'
    const networkId1 = 'networkId1'
    const baseUrl = `https://e-${networkId1}.adzerk.net/udb/${networkId1}`

    nock(baseUrl)
      .post(`/interests?userKey=${userId}`, JSON.stringify(['kevel_segment_test_name']))
      .reply(200)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodIdentifyEvent,
        settings: {
          networkId: networkId1,
          apiKey: 'apiKey1'
        },
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if audience creation event missing mandatory field', async () => {
    await expect(
      testDestination.testAction('syncAudience', {
        event: badEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError("The root value is missing the required field 'segment_computation_action'")
  })
})
