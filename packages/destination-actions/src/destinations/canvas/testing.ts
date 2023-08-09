import { createTestIntegration, SegmentEvent } from '@segment/actions-core'
import nock from 'nock'
import { EventType, getEventUrl } from './api'
import destination from './index'
import { Settings } from './generated-types'

const testDestination = createTestIntegration(destination)

export const settings: Settings = { apiToken: 'testApiToken' }

export const testAction = async (actionName: string, event: SegmentEvent): Promise<any> => {
  nock(getEventUrl(eventType(event)))
    .post('')
    .reply(200, {})
  const input = { event, settings, useDefaultMappings: true }
  const responses = await testDestination.testAction(actionName, input)
  expect(responses.length).toBe(1)
  const request = responses[0].request
  expect(request.headers.get('Authorization')).toBe(`Bearer ${settings.apiToken}`)
  const rawBody = await request.text()
  return JSON.parse(rawBody)
}

export const testBatchAction = async (actionName: string, events: SegmentEvent[]): Promise<any> => {
  const batchUrl = getEventUrl(eventType(events[0]))
  console.log('batchUrl', batchUrl)
  nock(getEventUrl(eventType(events[0])))
    .post('')
    .reply(200, {})
  const input = { events, settings, useDefaultMappings: true }
  const responses = await testDestination.testBatchAction(actionName, input)
  expect(responses.length).toBe(1)
  const request = responses[0].request
  expect(request.headers.get('Authorization')).toBe(`Bearer ${settings.apiToken}`)
  const rawBody = await request.text()
  return JSON.parse(rawBody)
}

export const userAgent =
  '"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'

const eventType = (event: SegmentEvent): EventType => {
  if (
    event.type == 'track' ||
    event.type == 'identify' ||
    event.type == 'screen' ||
    event.type == 'page' ||
    event.type == 'group'
  )
    return event.type
  throw new Error(`Not supported event type for tests: ${event.type}`)
}
