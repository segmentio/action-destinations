import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'
import { randomUUID } from 'crypto'

const testDestination = createTestIntegration(Destination)

const DATABASE_ID = 'test-database'
const SETTINGS: Settings = {
  databaseId: DATABASE_ID,
  privateToken: 'VALID_TOKEN',
  databaseRegion: 'eu-west'
}

describe('addCartAddition', () => {
  it('should validate action fields', async () => {
    nock('https://rapi-eu-west.recombee.com/')
      .post(`/${DATABASE_ID}/batch/`)
      .query({
        hmac_timestamp: /.*/,
        hmac_sign: /.*/
      })
      .reply(200, [{ code: 200, json: 'ok' }])

    const event = createTestEvent({
      userId: 'user-id',
      properties: {
        product_id: 'product-id'
      },
      timestamp: '2021-09-01T00:00:00.000Z'
    })

    const response = await testDestination.testAction('addCartAddition', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(await response[0].request.json()).toMatchObject({
      requests: [
        {
          method: 'POST',
          path: '/cartadditions/',
          params: {
            userId: 'user-id',
            itemId: 'product-id',
            timestamp: '2021-09-01T00:00:00.000Z',
            cascadeCreate: true
          }
        }
      ]
    })
  })

  it('should validate action fields with recommId and additionalData', async () => {
    nock('https://rapi-eu-west.recombee.com/')
      .post(`/${DATABASE_ID}/batch/`)
      .query({
        hmac_timestamp: /.*/,
        hmac_sign: /.*/
      })
      .reply(200, [{ code: 200, json: 'ok' }])

    const recommId = randomUUID()

    const event = createTestEvent({
      userId: 'user-id',
      properties: {
        product_id: 'product-id',
        recomm_id: recommId
      },
      traits: {
        region: 'region'
      },
      timestamp: '2021-09-01T00:00:00.000Z'
    })

    const response = await testDestination.testAction('addCartAddition', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true,
      mapping: {
        additionalData: {
          region: {
            '@path': '$.traits.region'
          }
        }
      }
    })

    expect(await response[0].request.json()).toMatchObject({
      requests: [
        {
          method: 'POST',
          path: '/cartadditions/',
          params: {
            userId: 'user-id',
            itemId: 'product-id',
            timestamp: '2021-09-01T00:00:00.000Z',
            cascadeCreate: true,
            recommId,
            additionalData: {
              region: 'region'
            }
          }
        }
      ]
    })
  })

  it('should validate action fields with multiple items', async () => {
    nock('https://rapi-eu-west.recombee.com/')
      .post(`/${DATABASE_ID}/batch/`)
      .query({
        hmac_timestamp: /.*/,
        hmac_sign: /.*/
      })
      .reply(200, [
        { code: 200, json: 'ok' },
        { code: 200, json: 'ok' }
      ])

    const event = createTestEvent({
      userId: 'user-id',
      properties: {
        products: [
          {
            product_id: 'item-1',
            quantity: 1,
            price: 100
          },
          {
            product_id: 'item-2',
            quantity: 2,
            price: 200
          }
        ]
      },
      timestamp: '2021-09-01T00:00:00.000Z'
    })

    const response = await testDestination.testAction('addCartAddition', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true,
      mapping: {
        items: {
          '@arrayPath': [
            '$.properties.products',
            {
              itemId: {
                '@path': '$.product_id'
              },
              amount: {
                '@path': '$.quantity'
              },
              price: {
                '@path': '$.price'
              }
            }
          ]
        }
      }
    })

    expect(await response[0].request.json()).toMatchObject({
      requests: [
        {
          method: 'POST',
          path: '/cartadditions/',
          params: {
            userId: 'user-id',
            itemId: 'item-1',
            timestamp: '2021-09-01T00:00:00.000Z',
            cascadeCreate: true,
            amount: 1,
            price: 100
          }
        },
        {
          method: 'POST',
          path: '/cartadditions/',
          params: {
            userId: 'user-id',
            itemId: 'item-2',
            timestamp: '2021-09-01T00:00:00.000Z',
            cascadeCreate: true,
            amount: 2,
            price: 200
          }
        }
      ]
    })
  })

  it('should throw an error when fields are not mapped', async () => {
    const event = createTestEvent({
      userId: 'user-id',
      properties: {}
    })

    await expect(
      testDestination.testAction('addCartAddition', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(/itemId/)
  })
})
