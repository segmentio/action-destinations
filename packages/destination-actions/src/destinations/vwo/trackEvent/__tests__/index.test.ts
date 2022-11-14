import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const BASE_ENDPOINT = 'https://dev.visualwebsiteoptimizer.com'
const VWO_ACCOUNT_ID = 654331
const VWO_UUID = 'ABC123'

describe('VWO.trackEvent', () => {
  it('should send send event call to VWO', async () => {
    const event = createTestEvent({
      event: 'testEvent',
      properties: {
        vwo_uuid: VWO_UUID
      }
    })
    nock(BASE_ENDPOINT)
      .post(`/events/t?en=${encodeURI('testEvent')}&a=${VWO_ACCOUNT_ID}`)
      .reply(200, {})
    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        vwoAccountId: VWO_ACCOUNT_ID
      }
    })
    const epochDate = Math.floor(new Date(event.timestamp as string).valueOf())
    const sessionId = Math.floor(new Date(event.timestamp as string).valueOf() / 1000)
    const page = event.context?.page
    const expectedRequest = {
      d: {
        visId: VWO_UUID,
        event: {
          props: {
            page,
            isCustomEvent: true,
            vwoMeta: {
              metric: {}
            }
          },
          name: 'testEvent',
          time: epochDate
        },
        sessionId
      }
    }
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject(expectedRequest)
  })

  it('should send segment properties as VWO properties', async () => {
    const event = createTestEvent({
      event: 'testEvent',
      properties: {
        vwo_uuid: VWO_UUID,
        amount: 100,
        currency: 'INR',
        outbound: true
      }
    })
    nock(BASE_ENDPOINT)
      .post(`/events/t?en=${encodeURI('testEvent')}&a=${VWO_ACCOUNT_ID}`)
      .reply(200, {})
    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        vwoAccountId: VWO_ACCOUNT_ID
      }
    })
    const epochDate = Math.floor(new Date(event.timestamp as string).valueOf())
    const sessionId = Math.floor(new Date(event.timestamp as string).valueOf() / 1000)
    const page = event.context?.page
    const expectedRequest = {
      d: {
        visId: VWO_UUID,
        event: {
          props: {
            amount: 100,
            currency: 'INR',
            outbound: true,
            page,
            isCustomEvent: true,
            vwoMeta: {
              metric: {}
            }
          },
          name: 'testEvent',
          time: epochDate
        },
        sessionId
      }
    }
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject(expectedRequest)
  })

  it('should filter segment properties to send as VWO properties', async () => {
    const event = createTestEvent({
      event: 'testEvent',
      properties: {
        vwo_uuid: VWO_UUID,
        amount: 100,
        unwantedField: [1, 2, 4],
        unwantedObject: {
          test: 'test'
        }
      }
    })
    nock(BASE_ENDPOINT)
      .post(`/events/t?en=${encodeURI('testEvent')}&a=${VWO_ACCOUNT_ID}`)
      .reply(200, {})
    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        vwoAccountId: VWO_ACCOUNT_ID
      }
    })
    const epochDate = Math.floor(new Date(event.timestamp as string).valueOf())
    const sessionId = Math.floor(new Date(event.timestamp as string).valueOf() / 1000)
    const page = event.context?.page
    const expectedRequest = {
      d: {
        visId: VWO_UUID,
        event: {
          props: {
            amount: 100,
            page,
            isCustomEvent: true,
            vwoMeta: {
              metric: {}
            }
          },
          name: 'testEvent',
          time: epochDate
        },
        sessionId
      }
    }
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject(expectedRequest)
  })
})
