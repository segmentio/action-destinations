import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { getEndpointByRegion } from '../../regional-endpoints'

const testDestination = createTestIntegration(Destination)
const api_id = 'APP_ID'
const api_key = 'APP_KEY'
const region = 'SOME_REGION'

const endpoint = getEndpointByRegion()

describe('ActionsMoengage.trackEvent', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ event: 'Test Event' })

    nock(`${endpoint}`).post(`/v1/integrations/segment?appId=${api_id}`).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        api_id,
        api_key,
        region
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      type: 'track',
      event: 'Test Event',
      context: { library: { version: '2.11.1' } }
    })
  })

  it('should include project_name in properties when provided', async () => {
    const event = createTestEvent({
      event: 'Test Event',
      properties: { key1: 'value1' }
    })

    nock(`${endpoint}`).post(`/v1/integrations/segment?appId=${api_id}`).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      mapping: { project_name: 'MyProject' },
      settings: {
        api_id,
        api_key,
        region
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      type: 'track',
      event: 'Test Event',
      properties: {
        key1: 'value1',
        moe_project_name: 'MyProject'
      }
    })
  })

  it('should not include project_name in properties when it is empty string', async () => {
    const event = createTestEvent({
      event: 'Test Event',
      properties: { key1: 'value1' }
    })

    nock(`${endpoint}`).post(`/v1/integrations/segment?appId=${api_id}`).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      mapping: { project_name: '' },
      settings: {
        api_id,
        api_key,
        region
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    const payload = responses[0].options.json as Record<string, unknown>
    const properties = payload.properties as Record<string, unknown>
    expect(properties).not.toHaveProperty('moe_project_name')
    expect(properties).toMatchObject({ key1: 'value1' })
  })

  it('should not include project_name in properties when it is not provided', async () => {
    const event = createTestEvent({
      event: 'Test Event',
      properties: { key1: 'value1' }
    })

    nock(`${endpoint}`).post(`/v1/integrations/segment?appId=${api_id}`).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        api_id,
        api_key,
        region
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    const payload = responses[0].options.json as Record<string, unknown>
    const properties = payload.properties as Record<string, unknown>
    expect(properties).not.toHaveProperty('moe_project_name')
  })

  it('should require event field', async () => {
    const event = createTestEvent({})
    event.event = undefined

    nock(`${endpoint}`).post(`/v1/integrations/segment?appId=${api_id}`).reply(200, {})

    try {
      await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          api_id,
          api_key,
          region
        }
      })
    } catch (e) {
      expect(e.message).toBe("The root value is missing the required field 'event'.")
    }
  })
})
