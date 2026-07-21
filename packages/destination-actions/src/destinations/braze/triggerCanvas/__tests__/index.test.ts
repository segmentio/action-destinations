import { createTestEvent, createTestIntegration, PayloadValidationError, APIError } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'triggerCanvas'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Unit tests for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  // Test error case when neither broadcast nor recipients is provided
  it('throws PayloadValidationError when neither broadcast nor recipients is provided', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create invalid test data with no targeting params
    const invalidEventData = {
      canvas_id: 'canvas-123',
      // Remove all targeting parameters
      broadcast: false,
      recipients: [],
      audience: null
    }

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: invalidEventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: invalidEventData,
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrow(PayloadValidationError)
  })

  // Test error case when canvas_id is missing
  it('throws error when canvas_id is not provided', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create invalid test data with no canvas_id
    const invalidEventData = {
      // Missing canvas_id
      broadcast: true,
      audience: null
    }

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: invalidEventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: invalidEventData,
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowError("The root value is missing the required field 'canvas_id'.")
  })

  // Test error case: broadcast is true and recipients are provided
  it('throws PayloadValidationError when broadcast is true and recipients are provided', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with both broadcast and recipients
    const invalidEventData = {
      canvas_id: 'canvas-123',
      broadcast: true,
      recipients: [{ external_user_id: 'user-123', send_to_existing_only: true }],
      audience: null
    }

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: invalidEventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: invalidEventData,
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrow(PayloadValidationError)
  })

  // Test success case: broadcast with optional audience
  it('allows broadcast with optional audience', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create valid test data with broadcast and audience
    const validEventData = {
      canvas_id: 'canvas-123',
      broadcast: true,
      audience: {
        AND: [
          {
            custom_attribute: {
              custom_attribute_name: 'test_attribute',
              comparison: 'equals',
              value: 'test_value'
            }
          }
        ]
      }
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/canvas/trigger/send', (body) => {
        expect(body.canvas_id).toBe('canvas-123')
        expect(body.broadcast).toBe(true)
        expect(body.audience).toBeDefined()
        expect(body.recipients).toBeUndefined()
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test success case: broadcast without audience
  it('allows broadcast without audience', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create valid test data with just broadcast
    const validEventData = {
      canvas_id: 'canvas-123',
      broadcast: true
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/canvas/trigger/send', (body) => {
        expect(body.canvas_id).toBe('canvas-123')
        expect(body.broadcast).toBe(true)
        expect(body.recipients).toBeUndefined()
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test success case: recipients with canvas entry properties
  it('allows recipients with canvas entry properties', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with recipients and canvas entry properties
    const validEventData = {
      canvas_id: 'canvas-123',
      recipients: [
        {
          external_user_id: 'user-123',
          canvas_entry_properties: {
            custom_property: 'custom_value'
          },
          send_to_existing_only: true
        }
      ]
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/canvas/trigger/send', (body) => {
        expect(body.canvas_id).toBe('canvas-123')
        expect(body.recipients.length).toBe(1)
        expect(body.recipients[0].external_user_id).toBe('user-123')
        expect(body.recipients[0].canvas_entry_properties).toEqual({
          custom_property: 'custom_value'
        })
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test success case: recipients with email and attributes
  it('allows recipients with email and attributes', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with recipients and email/attributes
    const validEventData = {
      canvas_id: 'canvas-123',
      recipients: [
        {
          external_user_id: 'user-456',
          email: 'test@example.com',
          send_to_existing_only: false,
          attributes: {
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      ]
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/canvas/trigger/send', (body) => {
        expect(body.canvas_id).toBe('canvas-123')
        expect(body.recipients.length).toBe(1)
        expect(body.recipients[0].external_user_id).toBe('user-456')
        expect(body.recipients[0].email).toBe('test@example.com')
        expect(body.recipients[0].attributes).toEqual({
          first_name: 'John',
          last_name: 'Doe'
        })
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test with prioritization settings
  it('transforms prioritization object into array and applies to recipients', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with recipients and prioritization
    const validEventData = {
      canvas_id: 'canvas-123',
      recipients: [
        {
          external_user_id: 'user-123',
          email: 'test@example.com',
          send_to_existing_only: true
        },
        {
          external_user_id: 'user-456',
          email: 'test2@example.com',
          send_to_existing_only: true
        }
      ],
      prioritization: {
        first_priority: 'identified',
        second_priority: 'most_recently_updated'
      }
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/canvas/trigger/send', (body) => {
        expect(body.canvas_id).toBe('canvas-123')
        // Check that the top-level prioritization is removed
        expect(body.prioritization).toBeUndefined()

        // Check that the prioritization array is applied to each recipient
        expect(body.recipients.length).toBe(2)
        expect(body.recipients[0].prioritization).toEqual(['identified', 'most_recently_updated'])
        expect(body.recipients[1].prioritization).toEqual(['identified', 'most_recently_updated'])
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test to verify prioritization with only first_priority
  it('creates prioritization array with just first_priority', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with recipients and only first_priority
    const validEventData = {
      canvas_id: 'canvas-123',
      recipients: [{ external_user_id: 'user-123', send_to_existing_only: true }],
      prioritization: {
        first_priority: 'unidentified'
      }
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/canvas/trigger/send', (body) => {
        // Check that the prioritization array contains only the first priority
        expect(body.recipients[0].prioritization).toEqual(['unidentified'])
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test with user alias
  it('allows recipients with user alias', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with user alias
    const validEventData = {
      canvas_id: 'canvas-123',
      recipients: [
        {
          user_alias: {
            alias_name: 'test-alias',
            alias_label: 'test-alias-label'
          },
          send_to_existing_only: true,
          attributes: {
            email: 'test@example.com'
          }
        }
      ]
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/canvas/trigger/send', (body) => {
        expect(body.canvas_id).toBe('canvas-123')
        expect(body.recipients[0].user_alias).toEqual({
          alias_name: 'test-alias',
          alias_label: 'test-alias-label'
        })
        expect(body.recipients[0].attributes).toEqual({
          email: 'test@example.com'
        })
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test error handling for Braze API errors
  it('handles Braze API errors and surfaces error message as APIError', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create valid test data that will trigger an API error
    const eventData = {
      canvas_id: 'invalid-canvas-123',
      broadcast: true
    }

    // Mock the API request to return an error with a message
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/canvas/trigger/send')
      .reply(400, { message: 'Canvas with id invalid-canvas-123 not found' })

    const event = createTestEvent({
      properties: eventData
    })

    // Check that the error is thrown
    try {
      await testDestination.testAction(actionSlug, {
        event: event,
        mapping: eventData,
        settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
        auth: undefined
      })
    } catch (error) {
      // The error should be an APIError with the correct message and status
      expect(error).toBeInstanceOf(APIError)
      expect(error.message).toBe('Canvas with id invalid-canvas-123 not found')
      expect(error.status).toBe(400)
    }

    expect(mockRequest.isDone()).toBe(true)
  })
})
