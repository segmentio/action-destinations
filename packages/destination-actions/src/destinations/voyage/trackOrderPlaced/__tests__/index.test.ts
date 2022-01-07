import type { Settings } from '../../generated-types'
import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import type { OrderPlacedBody } from '../../utils'
import { BaseApiUrl, EventApiUri, EventTypeId } from '../../utils'

const apiKey = 'api_123'
const settings: Settings = { apiKey }
const timestamp = new Date().toISOString()
const testDestination = createTestIntegration(Destination)

const api = nock(BaseApiUrl)

describe('Voyage.trackOrderPlaced', () => {
  it('should validate action fields', async () => {
    const response = {}
    api.post(EventApiUri).reply(200, response, { 'x-api-key': settings.apiKey })

    const properties = {
      CustomerId: 'customer-123',
      Url: 'http:product-url.com',
      OrderTotal: 10,
      TotalSpent: 100,
      Phone: '+18732213472',
      Zip: '84032'
    }
    const event = createTestEvent({
      type: 'track',
      userId: 'user-123',
      event: 'OrderPlaced',
      timestamp,
      properties
    })
    const responses = await testDestination.testAction('trackOrderPlaced', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject(response)
    expect(responses[0].headers.toJSON()).toMatchObject({
      'x-api-key': settings.apiKey,
      'content-type': 'application/json'
    })
    expect(responses[0].options.json).toMatchObject({
      eventTypeId: EventTypeId,
      phone: properties.Phone,
      eventMeta: {
        DateCreated: timestamp,
        LastUpdated: timestamp,
        ...properties
      }
    } as OrderPlacedBody)
  })
})
