import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const timestamp = '2024-01-08T13:52:50.212Z'

describe('Qualified.updateCompany', () => {
  const settings: Settings = {
    api_key: 'test_api_key_12345'
  }

  beforeEach(() => {
    nock.cleanAll()
  })

  it('should update company with domain only (required field)', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Leads In Company Updated',
      userId: 'user_123',
      traits: {
        domain: 'acme.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/companies', {
        domain: 'acme.com',
        fields: {}
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('updateCompany', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should update company with custom string fields', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Leads In Company Updated',
      traits: {
        domain: 'acme.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/companies', {
        domain: 'acme.com',
        fields: {
          industry: 'Technology',
          company_size: 'Enterprise'
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('updateCompany', {
      event,
      settings,
      mapping: {
        domain: { '@path': '$.traits.domain' },
        string_fields: {
          industry: 'Technology',
          company_size: 'Enterprise'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      domain: 'acme.com',
      fields: {
        industry: 'Technology',
        company_size: 'Enterprise'
      }
    })
  })

  it('should update company with custom boolean fields', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Leads In Company Updated',
      traits: {
        domain: 'acme.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/companies', {
        domain: 'acme.com',
        fields: {
          is_enterprise: true,
          has_partnership: false
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('updateCompany', {
      event,
      settings,
      mapping: {
        domain: { '@path': '$.traits.domain' },
        boolean_fields: {
          is_enterprise: true,
          has_partnership: false
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      domain: 'acme.com',
      fields: {
        is_enterprise: true,
        has_partnership: false
      }
    })
  })

  it('should update company with custom number fields', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Leads In Company Updated',
      traits: {
        domain: 'acme.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/companies', {
        domain: 'acme.com',
        fields: {
          employee_count: 5000,
          annual_revenue: 50000000.75
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('updateCompany', {
      event,
      settings,
      mapping: {
        domain: { '@path': '$.traits.domain' },
        number_fields: {
          employee_count: 5000,
          annual_revenue: 50000000.75
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      domain: 'acme.com',
      fields: {
        employee_count: 5000,
        annual_revenue: 50000000.75
      }
    })
  })

  it('should update company with all field types combined', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Leads In Company Updated',
      traits: {
        domain: 'acme.com'
      }
    })

    nock('https://api.qualified.com')
      .post('/v1/companies', {
        domain: 'acme.com',
        fields: {
          industry: 'Technology',
          is_enterprise: true,
          employee_count: 5000
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('updateCompany', {
      event,
      settings,
      mapping: {
        domain: { '@path': '$.traits.domain' },
        string_fields: {
          industry: 'Technology'
        },
        boolean_fields: {
          is_enterprise: true
        },
        number_fields: {
          employee_count: 5000
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      domain: 'acme.com',
      fields: {
        industry: 'Technology',
        is_enterprise: true,
        employee_count: 5000
      }
    })
  })

  it('should throw error for invalid string field type', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Leads In Company Updated',
      traits: {
        domain: 'acme.com'
      }
    })

    await expect(
      testDestination.testAction('updateCompany', {
        event,
        settings,
        mapping: {
          domain: { '@path': '$.traits.domain' },
          string_fields: {
            industry: 456 // Should be a string
          }
        }
      })
    ).rejects.toThrowError('Invalid field value for: industry. Should be a string.')
  })

  it('should throw error for invalid boolean field type', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Leads In Company Updated',
      traits: {
        domain: 'acme.com'
      }
    })

    await expect(
      testDestination.testAction('updateCompany', {
        event,
        settings,
        mapping: {
          domain: { '@path': '$.traits.domain' },
          boolean_fields: {
            is_enterprise: 'true' // Should be a boolean
          }
        }
      })
    ).rejects.toThrowError('Invalid field value for: is_enterprise. Should be a boolean.')
  })

  it('should throw error for invalid number field type', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Leads In Company Updated',
      traits: {
        domain: 'acme.com'
      }
    })

    await expect(
      testDestination.testAction('updateCompany', {
        event,
        settings,
        mapping: {
          domain: { '@path': '$.traits.domain' },
          number_fields: {
            employee_count: '5000' // Should be a number
          }
        }
      })
    ).rejects.toThrowError('Invalid field value for: employee_count. Should be a number.')
  })

  it('should include authorization header', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'Leads In Company Updated',
      traits: {
        domain: 'acme.com'
      }
    })

    const scope = nock('https://api.qualified.com', {
      reqheaders: {
        authorization: 'Bearer test_api_key_12345'
      }
    })
      .post('/v1/companies')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('updateCompany', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    scope.done()
  })
})
