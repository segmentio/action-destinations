import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

const DATABASE_ID = 'test-database'
const SETTINGS: Settings = {
  databaseId: DATABASE_ID,
  privateToken: 'VALID_TOKEN',
  databaseRegion: 'eu-west'
}

describe('deleteCartAddition', () => {
  it('should validate action fields', async () => {
    nock('https://rapi-eu-west.recombee.com/')
      .delete(`/${DATABASE_ID}/cartadditions/`)
      .query({
        hmac_timestamp: /.*/,
        hmac_sign: /.*/,
        userId: 'user-id',
        itemId: 'product-id'
      })
      .reply(200, 'ok')

    const event = createTestEvent({
      userId: 'user-id',
      properties: {
        product_id: 'product-id'
      },
      timestamp: '2021-09-01T00:00:00.000Z'
    })

    const response = await testDestination.testAction('deleteCartAddition', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(response[0].request.url).toMatch(/.*\/?.*(userId=user-id&itemId=product-id).*/)
  })

  it('should validate action fields with timestamp as string', async () => {
    nock('https://rapi-eu-west.recombee.com/')
      .delete(`/${DATABASE_ID}/cartadditions/`)
      .query({
        hmac_timestamp: /.*/,
        hmac_sign: /.*/,
        userId: 'user-id',
        itemId: 'product-id',
        timestamp: /.*/
      })
      .reply(200, 'ok')

    const event = createTestEvent({
      userId: 'user-id',
      properties: {
        product_id: 'product-id',
        originalTimestamp: '2021-09-01T00:00:00.000Z'
      },
      timestamp: '2021-09-02T00:00:00.000Z'
    })

    const response = await testDestination.testAction('deleteCartAddition', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true,
      mapping: {
        timestamp: {
          '@path': '$.properties.originalTimestamp'
        }
      }
    })

    expect(response[0].request.url).toMatch(/.*\/?.*(userId=user-id&itemId=product-id&timestamp=1630454400000).*/)
  })

  it('should validate action fields with timestamp as Unix number', async () => {
    nock('https://rapi-eu-west.recombee.com/')
      .delete(`/${DATABASE_ID}/cartadditions/`)
      .query({
        hmac_timestamp: /.*/,
        hmac_sign: /.*/,
        userId: 'user-id',
        itemId: 'product-id',
        timestamp: /.*/
      })
      .reply(200, 'ok')

    const event = createTestEvent({
      userId: 'user-id',
      properties: {
        product_id: 'product-id',
        originalTimestamp: 1630454000000
      },
      timestamp: '2021-09-02T00:00:00.000Z'
    })

    const response = await testDestination.testAction('deleteCartAddition', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true,
      mapping: {
        timestamp: {
          '@path': '$.properties.originalTimestamp'
        }
      }
    })

    expect(response[0].request.url).toMatch(/.*\/?.*(userId=user-id&itemId=product-id&timestamp=1630454000000).*/)
  })
})
