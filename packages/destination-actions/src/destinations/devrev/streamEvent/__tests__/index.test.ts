import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { TrackEventsPublishBody, devrevApiPaths, getBaseUrl } from '../../utils'
import {
  settings,
  testAccountRef,
  testAnonymousId,
  testContext,
  testEventPayload,
  testMessageId,
  testUserId,
  testWorkspaceRef
} from '../../mocks'

const testDestination = createTestIntegration(Destination)

describe('Devrev.streamEvent', () => {
  it('makes the correct API call to publish track events with default mapping', async () => {
    // Mock the publish API
    nock(`${getBaseUrl(settings)}`)
      .post(`${devrevApiPaths.trackEventsPublish}`)
      .reply(201, (_, body) => body)

    // Test event
    const event = createTestEvent({
      ...testEventPayload,
      messageId: testMessageId,
      anonymousId: testAnonymousId,
      integrations: {
        // @ts-expect-error integrations should accept complex objects;
        DevRev: {
          accountRef: testAccountRef,
          workspaceRef: testWorkspaceRef
        }
      },
      context: testContext,
      userId: testUserId,
      properties: {
        ...testEventPayload.properties
      }
    })

    // Invoke the action
    const response = await testDestination.testAction('streamEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    // Response from the action is the payload to the publish API
    // Make sure the reuqest body is correct
    const expectedTrackPublishBody: TrackEventsPublishBody = {
      events_list: [
        {
          name: testEventPayload.event as string,
          event_time: testEventPayload.timestamp as string,
          payload: {
            eventName: testEventPayload.event,
            timestamp: testEventPayload.timestamp,
            email: testEventPayload.properties?.email,
            userId: testUserId,
            accountRef: testAccountRef,
            workspaceRef: testWorkspaceRef,
            messageId: testMessageId,
            anonymousId: testAnonymousId,
            context: testContext,
            properties: testEventPayload.properties,
            devrev_source_identifier: 'segment'
          }
        }
      ]
    }
    expect(response).toBeTruthy()
    expect(response[0].data).toEqual(expectedTrackPublishBody)
  })
})
