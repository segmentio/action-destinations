import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const BASE_ENDPOINT = 'https://dev.visualwebsiteoptimizer.com'
const VWO_ACCOUNT_ID = 654331
const VWO_UUID = 'ABC123'
const EVENT_NAME = 'vwo_pageView'

describe('VWO.pageVisit', () => {
  it('should send Page Visit event to VWO', async () => {
    const event = createTestEvent({
      properties: {
        vwo_uuid: VWO_UUID
      }
    })
    nock(BASE_ENDPOINT).post(`/events/t?en=${EVENT_NAME}&a=${VWO_ACCOUNT_ID}`).reply(200, {})
    const responses = await testDestination.testAction('pageVisit', {
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
        msgId: `${VWO_UUID}-${sessionId}`,
        event: {
          props: {
            url: page?.url,
            page,
            isCustomEvent: false,
            vwoMeta: {
              metric: {}
            }
          },
          name: EVENT_NAME,
          time: epochDate
        },
        sessionId
      }
    }
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject(expectedRequest)
    expect(responses[0].options.headers).toMatchInlineSnapshot(`
    Headers {
      Symbol(map): Object {
        "user-agent": Array [
          "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1",
        ],
        "x-forwarded-for": Array [
          "8.8.8.8",
        ],
      },
    }
  `)
  })
})
