import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../utils/constants'

const testDestination = createTestIntegration(Destination)

const date = new Date()
const timestamp = date.toISOString()
const CALLIPER_SEGMENT_KEY = 'test-key'
const CALLIPER_COMPANY_ID = 'test-company'

const expectedProperties = {
  time: date.valueOf(),
  ip: '8.8.8.8',
  user_id: 'user1234',
  anonymous_id: 'anonId1234',
  url: 'https://segment.com/academy/',
  path: '/academy/',
  page_title: 'Analytics Academy',
  language: 'en-US',
  country: 'United States',
  city: 'San Francisco',
  library_name: 'Segment: analytics.js',
  user_agent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
}

describe('Calliper.trackEvent', () => {
  it('should call the event storage API', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock(API_URL).post('/event/batch').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        segmentKey: CALLIPER_SEGMENT_KEY,
        companyId: CALLIPER_COMPANY_ID
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      company_id: CALLIPER_COMPANY_ID,
      key: CALLIPER_SEGMENT_KEY,
      events: [
        {
          event: 'Test Event',
          ...expectedProperties
        }
      ]
    })
  })

  it('should require event field', async () => {
    const event = createTestEvent({ timestamp })
    event.event = undefined

    nock(API_URL).post('/event/batch').reply(200, {})

    await expect(async () => {
      await testDestination.testAction('trackEvent', { event, useDefaultMappings: true })
    }).rejects.toThrowError("The root value is missing the required field 'event'.")
  })

  it('should validate timestamp', async () => {
    const event = createTestEvent({ timestamp: 'bad timestamp' })

    nock(API_URL).post('/event/batch').reply(200, {})

    await expect(async () => {
      await testDestination.testAction('trackEvent', { event, useDefaultMappings: true })
    }).rejects.toThrowError('Timestamp must be a valid date-like string but it was not.')
  })

  it('should send batch request', async () => {
    const events = [
      createTestEvent({ timestamp, event: 'Test Event1' }),
      createTestEvent({ timestamp, event: 'Test Event2' })
    ]

    nock(API_URL).post('/event/batch').reply(200, {})

    const responses = await testDestination.testBatchAction('trackEvent', {
      events,
      useDefaultMappings: true,
      settings: {
        segmentKey: CALLIPER_SEGMENT_KEY,
        companyId: CALLIPER_COMPANY_ID
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      company_id: CALLIPER_COMPANY_ID,
      key: CALLIPER_SEGMENT_KEY,
      events: [
        {
          event: 'Test Event1',
          ...expectedProperties
        },
        {
          event: 'Test Event2',
          ...expectedProperties
        }
      ]
    })
  })
})
