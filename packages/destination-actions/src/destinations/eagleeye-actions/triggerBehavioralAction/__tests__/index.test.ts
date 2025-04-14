import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('EagleeyeActions.triggerBehavioralAction', () => {
    it('makes the correct API call to trigger a Behavioral Action in EE AIR', async () => {
      const connectorUrl = 'https://some.url/in/segment/some-connector-id'
      nock(connectorUrl).post('').reply(200, {})

      const event = createTestEvent({
        userId: 'some-user-id',
        properties: {}
      })
      const settings = {
        connectorUrl,
        externalKey: 'external-key',
        behavioralActionTriggerReference: 'A0001'
      }

      await expect(
        testDestination.testAction('triggerBehavioralAction', {
          event,
          settings,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })
  })
