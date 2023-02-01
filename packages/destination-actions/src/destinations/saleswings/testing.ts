import { createTestIntegration, SegmentEvent } from '@segment/actions-core'
import nock from 'nock'
import { apiBaseUrl } from './api'
import destination from './index'

const testDestination = createTestIntegration(destination)

export const settings = { apiKey: 'TEST_API_KEY' }

export const testAction = async (actionName: string, event: SegmentEvent): Promise<any> => {
  nock(apiBaseUrl).post('/events').reply(200, {})
  const input = { event, settings, useDefaultMappings: true }
  const responses = await testDestination.testAction(actionName, input)
  expect(responses.length).toBe(1)
  const request = responses[0].request
  expect(request.headers.get('Authorization')).toBe(`Bearer ${settings.apiKey}`)
  const rawBody = await request.text()
  return JSON.parse(rawBody)
}

export const testBatchAction = async (actionName: string, events: SegmentEvent[]): Promise<any> => {
  nock(apiBaseUrl).post('/events/batches').reply(200, {})
  const input = { events, settings, useDefaultMappings: true }
  const responses = await testDestination.testBatchAction(actionName, input)
  expect(responses.length).toBe(1)
  const request = responses[0].request
  expect(request.headers.get('Authorization')).toBe(`Bearer ${settings.apiKey}`)
  const rawBody = await request.text()
  return JSON.parse(rawBody)
}

export const testActionWithSkippedEvent = async (actionName: string, event: SegmentEvent): Promise<void> => {
  const responses = await testDestination.testAction(actionName, { event, settings, useDefaultMappings: true })
  expect(responses.length).toBe(0)
}

export const testBatchActionSkippedEvents = async (actionName: string, events: SegmentEvent[]): Promise<void> => {
  const responses = await testDestination.testBatchAction(actionName, { events, settings, useDefaultMappings: true })
  expect(responses.length).toBe(0)
}

export const expectedTs = (segmentEventTs: string | Date | undefined): number => {
  if (segmentEventTs === undefined) throw new Error('Unexpected state: test event created without a timestamp')
  else if (typeof segmentEventTs === 'string') return Date.parse(segmentEventTs)
  else return segmentEventTs.valueOf()
}

export const userAgent =
  '"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
