import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const SETTINGS = {
  apiToken: 'VALID_API_TOKEN',
  datacenter: 'testdc'
}

describe('Qualtrics.triggerXflowWorkflow', () => {
  it('should send a valid action with a custom mapping', async () => {
    nock('https://testdc.qualtrics.com')
      .post('/workflow-trigger')
      .matchHeader('x-api-token', 'VALID_API_TOKEN')
      .reply(202, {})

    const event = createTestEvent({
      userId: 'user_id_1',
      properties: {
        workflowUrl: 'https://testdc.qualtrics.com/workflow-trigger'
      },
      traits: {
        firstName: 'Jane'
      }
    })

    const response = await testDestination.testAction('triggerXflowWorkflow', {
      event,
      settings: SETTINGS,
      mapping: {
        workflowUrl: {
          '@path': '$.properties.workflowUrl'
        },
        eventPayload: {
          traits: {
            '@path': '$.traits'
          }
        }
      }
    })
    expect(response[0].status).toBe(202)
    expect(await response[0].request.json()).toMatchObject({
      traits: {
        firstName: 'Jane'
      }
    })
  })

  it('should send a valid action with a default mapping', async () => {
    nock('https://testdc.qualtrics.com')
      .post('/workflow-trigger')
      .matchHeader('x-api-token', 'VALID_API_TOKEN')
      .reply(202, {})

    const event = createTestEvent()

    const response = await testDestination.testAction('triggerXflowWorkflow', {
      event,
      settings: SETTINGS,
      mapping: {
        workflowUrl: 'https://testdc.qualtrics.com/workflow-trigger'
      },
      useDefaultMappings: true
    })
    expect(response[0].status).toBe(202)
    expect(await response[0].request.json()).toMatchObject({
      context: {
        ...event.context
      },
      properties: {
        ...event.properties
      },
      traits: {
        ...event.traits
      },
      userId: event.userId,
      event: event.event,
      type: event.type
    })
  })

  it('should throw error when missing required field', async () => {
    nock('https://testdc.qualtrics.com')
      .post('/workflow-trigger')
      .matchHeader('x-api-token', 'VALID_API_TOKEN')
      .reply(202, {})

    const event = createTestEvent()

    await expect(
      testDestination.testAction('triggerXflowWorkflow', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })
})
