import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Criteo.exampleAction', () => {
  it('should invoke the performBatch function for batches', async () => {
    nock('https://example.com').post(/.*/).reply(200)

    const events = [
      createTestEvent({ event: 'Button Clicked', userId: 'u_123', timestamp, properties: { name: 'Tami' } }),
      createTestEvent({ event: 'Demo Requested', userId: 'u_456', timestamp, properties: { name: 'Matt' } })
    ]

    const responses = await testDestination.testBatchAction('exampleAction', {
      events,
      settings: {
        api_key: 'super secret'
      },
      // This is an example of a customer's configuration, including an
      // example of mapping-kit's `@template` directive.
      mapping: {
        greeting: {
          '@template': 'Hello {{properties.name}}!'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 200
        })
      ])
    )
    expect(responses[0].options.headers).toMatchInlineSnapshot(`
      Headers {
        Symbol(map): Object {
          "authorization": Array [
            "Bearer super secret",
          ],
          "user-agent": Array [
            "Segment",
          ],
        },
      }
    `)
    expect(responses[0].options.json).toMatchInlineSnapshot(`
      Array [
        Object {
          "greeting": "Hello Tami!",
        },
        Object {
          "greeting": "Hello Matt!",
        },
      ]
    `)
  })
})
