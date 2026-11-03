import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Definition)

const settings: Settings = {
  api_key: 'test_api_key',
  app_id: 'test_app_id',
  endpoint: 'https://rest.iad-01.braze.com'
}

describe('Braze.createAlias2 syncMode', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should succeed and create the alias when the only supported syncMode ("add") is used', async () => {
    const event = createTestEvent({
      event: 'Create Alias',
      type: 'track',
      userId: 'user-1'
    })

    nock(settings.endpoint).post('/users/alias/new').reply(201, {})

    const responses = await testDestination.testAction('createAlias2', {
      event,
      settings,
      mapping: {
        external_id: 'user-1',
        alias_name: 'alias-1',
        alias_label: 'label-1',
        __segment_internal_sync_mode: 'add'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
    expect(responses[0].options.json).toEqual({
      user_aliases: [
        {
          external_id: 'user-1',
          alias_name: 'alias-1',
          alias_label: 'label-1'
        }
      ]
    })
  })

  // createAlias2's syncMode field only exposes a single valid choice ('add'). Unlike the other
  // Braze V2 actions, the perform() function doesn't branch behavior based on the syncMode value -
  // it only uses syncMode as a gate (any value other than 'add' throws). The request body sent to
  // Braze is identical regardless of what a hypothetical additional syncMode value would be.
})
