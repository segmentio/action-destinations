import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { CONSTANTS } from '../../constants'

const testDestination = createTestIntegration(Destination)

const goodEvent = createTestEvent({
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ld_segment_test'
    },
    traits: {
      email: 'test@email.com'
    }
  },
  traits: {
    email: 'test@email.com',
    ld_segment_test: true
  }
})

const badEvent = createTestEvent({
  context: {
    personas: {
      computation_key: 'ld_segment_test'
    },
    traits: {
      email: 'test@email.com'
    }
  },
  traits: {
    email: 'test@email.com',
    ld_segment_test: true
  }
})

describe('LaunchdarklyAudiences.syncAudience', () => {
  it('should not throw an error if the audience creation succeed', async () => {
    nock(CONSTANTS.LD_API_BASE_URL).post(CONSTANTS.LD_API_CUSTOM_AUDIENCE_ENDPOINT).reply(204)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodEvent,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if the audience creation failed, bad body', async () => {
    nock(CONSTANTS.LD_API_BASE_URL).post(CONSTANTS.LD_API_CUSTOM_AUDIENCE_ENDPOINT).reply(400)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Bad Request')
  })

  it('should throw an error if audience creation event missing mandatory field', async () => {
    await expect(
      testDestination.testAction('syncAudience', {
        event: badEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError("The root value is missing the required field 'segment_computation_action'")
  })

  it('should throw an error with an invalid API key', async () => {
    nock(CONSTANTS.LD_API_BASE_URL).post(CONSTANTS.LD_API_CUSTOM_AUDIENCE_ENDPOINT).reply(403)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Forbidden')
  })
})
