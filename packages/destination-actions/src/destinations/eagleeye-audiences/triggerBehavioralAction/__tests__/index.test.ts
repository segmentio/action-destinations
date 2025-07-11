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
      externalKey: 'external-key'
    }
    const behavioralActionTriggerReferences = 'A0001,P0001'

    let responses, error
    try {
      responses = await testDestination.testAction('triggerBehavioralAction', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          behavioralActionTriggerReferences
        }
      })
    } catch (err) {
      error = err
    }

    expect(responses).toBeDefined()
    expect(error).toBeUndefined()

    expect(responses && responses[0].options.headers && responses[0].options.headers.get('x-auth-token')).toEqual(
      settings.externalKey
    )
    expect(responses && responses[0].options.body).toEqual(
      JSON.stringify({
        type: 'services/trigger',
        body: {
          identityValue: event.userId,
          triggers: behavioralActionTriggerReferences.split(',').map((reference) => ({
            reference
          }))
        }
      })
    )
  })
})
