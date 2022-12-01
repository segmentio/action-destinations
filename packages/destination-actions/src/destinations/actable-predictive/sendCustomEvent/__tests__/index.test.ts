import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination, { API_URL } from '../../index'

const testDestination = createTestIntegration(Destination)

describe('ActablePredictive.sendCustomEvent', () => {
  function setUpTest() {
    // nockAuth()
    const nockRequests: any[] /* (typeof nock.ReplyFnContext.req)[] */ = []
    nock(API_URL)
      .post('')
      .reply(200, function (_uri, _requestBody) {
        nockRequests.push(this.req)
        return {}
      })
  }
  test('testCustomEvent', async () => {
    setUpTest()

    const customProperties = {
      properties: {
        custom_attr_1: '50314b8e9bcf000000000000',
        custom_attr_2: '999999',
        custom_attr_3: 27.50,
        custom_attr_4: '22.50ab$',
      }
    }

    const event = createTestEvent({
      userId: "abc123def456",
      type: "track",
      timestamp: '2021-10-05T15:30:35Z',
      properties: {
        custom_attr_1: '50314b8e9bcf000000000000',
        custom_attr_2: '999999',
        custom_attr_3: 27.50,
        custom_attr_4: '22.50ab$',
      }
    }
    )

    const r = await testDestination.testAction('sendCustomEvent', {
      event,
      settings: { client_id: "foo", client_secret: "bar" },
      useDefaultMappings: true,
    })

    const recievedEvent = (r[0].options.json as any)
    expect(r.length).toBe(1)
    expect(recievedEvent.data[0]).toMatchObject({
      customer_id: 'abc123def456',
      timestamp: 1633447835,
      stream_key: "custom",
      ...customProperties,
    })
  })
})



