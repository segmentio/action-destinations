import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, PayloadValidationError } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { API_URL, API_VERSION } from '../config'
import { getECommEventTestValidPayload, getECommEventTestExpectedPayload } from '../test-data'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const endpoint = '/events/ecommerce/add-to-cart'

const settings: Settings = {
  apiKey: 'test-api-key'
}

// Valid payload for testing
const validPayload = getECommEventTestValidPayload(timestamp) as Partial<SegmentEvent>

// Expected payload for Attentive API
const expectedPayload = getECommEventTestExpectedPayload(validPayload)

beforeEach(() => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
})

describe('Attentive.addToCart', () => {
  it('should send an add to cart event to Attentive', async () => {
    const event = createTestEvent(validPayload)

    nock(`${API_URL}${API_VERSION}`).post(endpoint, expectedPayload).reply(200, {})

    const responses = await testDestination.testAction('addToCart', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should throw error if no identifiers are provided', async () => {
    const badPayload = {
      ...validPayload,
      context: { traits: {} }, // Remove identifiers
      userId: undefined
    }

    const event = createTestEvent(badPayload)

    await expect(
      testDestination.testAction('addToCart', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new PayloadValidationError('At least one user identifier is required.'))
  })
})
