import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const BASE_ENDPOINT = 'https://dev.visualwebsiteoptimizer.com'
const VWO_ACCOUNT_ID = 654331
const VWO_UUID = 'ABC123'

describe('VWO.identifyUser', () => {
  it('should send segment traits as VWO attributes', async () => {
    const event = createTestEvent({
      traits: {
        vwo_uuid: VWO_UUID,
        textProperty: 'Hello'
      }
    })
    nock(BASE_ENDPOINT).post(`/events/t?en=vwo_syncVisitorProp&a=${VWO_ACCOUNT_ID}`).reply(200, {})
    const responses = await testDestination.testAction('identifyUser', {
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
        msgId: `${VWO_UUID}-${sessionId}`,
        visId: VWO_UUID,
        event: {
          props: {
            $visitor: {
              props: {
                'segment.textProperty': 'Hello'
              }
            },
            vwoMeta: {
              source: 'segment.cloud'
            },
            page,
            isCustomEvent: true
          },
          name: 'vwo_syncVisitorProp',
          time: epochDate
        },
        sessionId,
        visitor: {
          props: {
            'segment.textProperty': 'Hello'
          }
        }
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
