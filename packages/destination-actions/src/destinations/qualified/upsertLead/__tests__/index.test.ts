import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const timestamp = '2024-01-08T13:52:50.212Z'

describe('Qualified.upsertLead', () => {
  const settings: Settings = {
    api_key: 'test_api_key_12345'
  }

  beforeEach(() => {
    nock.cleanAll()
  })

  it('should send a lead with email only (required field)', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      userId: 'user_123',
      properties: {
        email: 'test@example.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/leads', {
        email: 'test@example.com',
        fields: {}
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('upsertLead', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should send a lead with all basic fields from properties', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      userId: 'user_123',
      properties: {
        email: 'test@example.com',
        phone: '+1-650-555-1212',
        company: 'Acme Corp',
        name: 'John Doe'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/leads', {
        email: 'test@example.com',
        fields: {
          phone: '+1-650-555-1212',
          company: 'Acme Corp',
          name: 'John Doe'
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('upsertLead', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      email: 'test@example.com',
      fields: {
        phone: '+1-650-555-1212',
        company: 'Acme Corp',
        name: 'John Doe'
      }
    })
  })

  it('should send a lead with all basic fields from context.traits', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      userId: 'user_123',
      context: {
        traits: {
          email: 'traits@example.com',
          phone: '+1-415-555-9999',
          company: 'Traits Company',
          name: 'Jane Smith'
        }
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/leads', {
        email: 'traits@example.com',
        fields: {
          phone: '+1-415-555-9999',
          company: 'Traits Company',
          name: 'Jane Smith'
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('upsertLead', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      email: 'traits@example.com',
      fields: {
        phone: '+1-415-555-9999',
        company: 'Traits Company',
        name: 'Jane Smith'
      }
    })
  })

  it('should send a lead with custom string fields', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      properties: {
        email: 'test@example.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/leads', {
        email: 'test@example.com',
        fields: {
          industry: 'Technology',
          job_title: 'Software Engineer'
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('upsertLead', {
      event,
      settings,
      mapping: {
        email: { '@path': '$.properties.email' },
        string_fields: {
          industry: 'Technology',
          job_title: 'Software Engineer'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      email: 'test@example.com',
      fields: {
        industry: 'Technology',
        job_title: 'Software Engineer'
      }
    })
  })

  it('should send a lead with custom boolean fields', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      properties: {
        email: 'test@example.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/leads', {
        email: 'test@example.com',
        fields: {
          is_qualified: true,
          opted_in: false
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('upsertLead', {
      event,
      settings,
      mapping: {
        email: { '@path': '$.properties.email' },
        boolean_fields: {
          is_qualified: true,
          opted_in: false
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      email: 'test@example.com',
      fields: {
        is_qualified: true,
        opted_in: false
      }
    })
  })

  it('should send a lead with custom number fields', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      properties: {
        email: 'test@example.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/leads', {
        email: 'test@example.com',
        fields: {
          lead_score: 85,
          annual_revenue: 1000000.50
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('upsertLead', {
      event,
      settings,
      mapping: {
        email: { '@path': '$.properties.email' },
        number_fields: {
          lead_score: 85,
          annual_revenue: 1000000.50
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      email: 'test@example.com',
      fields: {
        lead_score: 85,
        annual_revenue: 1000000.50
      }
    })
  })

  it('should send a lead with all field types combined', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      properties: {
        email: 'test@example.com',
        phone: '+1-650-555-1212',
        name: 'John Doe'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/leads', {
        email: 'test@example.com',
        fields: {
          phone: '+1-650-555-1212',
          name: 'John Doe',
          industry: 'Technology',
          is_qualified: true,
          lead_score: 85
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('upsertLead', {
      event,
      settings,
      mapping: {
        email: { '@path': '$.properties.email' },
        phone: { '@path': '$.properties.phone' },
        name: { '@path': '$.properties.name' },
        string_fields: {
          industry: 'Technology'
        },
        boolean_fields: {
          is_qualified: true
        },
        number_fields: {
          lead_score: 85
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      email: 'test@example.com',
      fields: {
        phone: '+1-650-555-1212',
        name: 'John Doe',
        industry: 'Technology',
        is_qualified: true,
        lead_score: 85
      }
    })
  })

  it('should throw error for invalid string field type', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      properties: {
        email: 'test@example.com'
      }
    })

    await expect(
      testDestination.testAction('upsertLead', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.properties.email' },
          string_fields: {
            industry: 123 // Should be a string
          }
        }
      })
    ).rejects.toThrowError('Invalid field value for: industry. Should be a string.')
  })

  it('should throw error for invalid boolean field type', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      properties: {
        email: 'test@example.com'
      }
    })

    await expect(
      testDestination.testAction('upsertLead', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.properties.email' },
          boolean_fields: {
            is_qualified: 'yes' // Should be a boolean
          }
        }
      })
    ).rejects.toThrowError('Invalid field value for: is_qualified. Should be a boolean.')
  })

  it('should throw error for invalid number field type', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      properties: {
        email: 'test@example.com'
      }
    })

    await expect(
      testDestination.testAction('upsertLead', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.properties.email' },
          number_fields: {
            lead_score: '85' // Should be a number
          }
        }
      })
    ).rejects.toThrowError('Invalid field value for: lead_score. Should be a number.')
  })

  it('should include authorization header', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      properties: {
        email: 'test@example.com'
      }
    })

    const scope = nock('https://api.qualified.com', {
      reqheaders: {
        authorization: 'Bearer test_api_key_12345'
      }
    })
      .post('/v1/leads')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('upsertLead', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    scope.done()
  })

  it('should not include undefined optional fields', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Lead Updated',
      properties: {
        email: 'test@example.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/leads', {
        email: 'test@example.com',
        fields: {}
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('upsertLead', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      email: 'test@example.com',
      fields: {}
    })
  })
})
