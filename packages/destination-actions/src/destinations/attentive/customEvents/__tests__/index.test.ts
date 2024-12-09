import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, PayloadValidationError } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

import { API_URL, API_VERSION } from '../config'
import {
  getCustomEventsTestValidPayload,
  getCustomEventsTestMapping,
  getCustomEventsTestExpectedPayload
} from '../test-data'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const endpoint = '/events/custom'

const settings: Settings = {
  apiKey: 'test-api-key'
}

// Valid payload for testing
const validPayload = getCustomEventsTestValidPayload(timestamp) as Partial<SegmentEvent>

// Mapping configuration for test transformation
const mapping = getCustomEventsTestMapping()

// Expected payload for Attentive API
const expectedPayload = getCustomEventsTestExpectedPayload(validPayload)

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Attentive.customEvents', () => {
  it('should send a custom event to Attentive', async () => {
    const event = createTestEvent(validPayload)

    nock(`${API_URL}${API_VERSION}`).post(endpoint, expectedPayload).reply(200, {})

    const responses = await testDestination.testAction('customEvents', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
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
      testDestination.testAction('customEvents', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(new PayloadValidationError('At least one user identifier is required.'))
  })
})
