import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.hubapi.com/crm/v3/objects'

describe('Hubspot.customObject', () => {
  // Validate creation of custom object with fullyQualifiedName of a HubSpot Schema
  it('should create a Custom Object with fullyQualifiedName of a Schema', async () => {
    nock(endpoint)
      .post(/.*/)
      .reply(201, {
        id: '1234567890',
        properties: {
          coupon_code: 'TEST1234',
          discount_percent: '10%',
          hs_createdate: '2022-09-28T10:50:29.120Z',
          hs_lastmodifieddate: '2022-09-28T10:50:29.120Z',
          hs_object_id: '2963526473'
        },
        createdAt: '2022-09-28T10:50:29.120Z',
        updatedAt: '2022-09-28T10:50:29.120Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Apply Discount',
      properties: {
        couponCode: 'TEST1234',
        discountPercentage: '10%'
      }
    })

    const responses = await testDestination.testAction('createCustomObjectRecord', {
      event,
      mapping: {
        objectType: 'p11223344_discount',
        properties: {
          coupon_code: {
            '@path': '$.properties.couponCode'
          },
          discount_percent: {
            '@path': '$.properties.couponCode'
          }
        }
      }
    })

    expect(responses[0].status).toBe(201)
  })

  // Validate creation of custom object with Segment supported HubSpot Objects
  it('should create a Contact object with Custom Objects Action', async () => {
    nock(endpoint)
      .post(/.*/)
      .reply(201, {
        id: '101',
        properties: {
          company: 'Acme Inc.',
          createdate: '2022-10-03T12:16:01.093Z',
          email: 'bcooper@acme.org',
          firstname: 'Bryan',
          hs_all_contact_vids: '101',
          hs_calculated_phone_number: '+18779290687',
          hs_calculated_phone_number_country_code: 'US',
          hs_email_domain: 'acme.org',
          hs_is_contact: 'true',
          hs_is_unworked: 'true',
          hs_lifecyclestage_lead_date: '2022-10-03T12:16:01.093Z',
          hs_marketable_status: 'false',
          hs_marketable_until_renewal: 'false',
          hs_object_id: '101',
          hs_pipeline: 'contacts-lifecycle-pipeline',
          hs_searchable_calculated_phone_number: '8779290687',
          lastmodifieddate: '2022-10-03T12:16:01.093Z',
          lastname: 'Cooper',
          lifecyclestage: 'lead',
          phone: '(877) 929-0687',
          website: 'http://biglytics.net'
        },
        createdAt: '2022-10-03T12:16:01.093Z',
        updatedAt: '2022-10-03T12:16:01.093Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Create Contact',
      properties: {
        company: 'Acme Inc.',
        email: 'bcooper@acme.org',
        firstname: 'Bryan',
        lastname: 'Cooper',
        phone: '(877) 929-0687',
        website: 'biglytics.net'
      }
    })

    const responses = await testDestination.testAction('createCustomObjectRecord', {
      event,
      mapping: {
        objectType: 'contacts',
        properties: {
          company: {
            '@path': '$.properties.company'
          },
          email: {
            '@path': '$.properties.email'
          },
          firstname: {
            '@path': '$.properties.firstname'
          },
          lastname: {
            '@path': '$.properties.lastname'
          },
          phone: {
            '@path': '$.properties.phone'
          },
          website: {
            '@path': '$.properties.website'
          }
        }
      }
    })

    expect(responses[0].status).toBe(201)
  })

  it('should create a Companies object with Custom Objects Action', async () => {
    nock(endpoint)
      .post(/.*/)
      .reply(201, {
        id: '1000000001',
        properties: {
          city: 'San Francisco',
          createdate: '2022-10-03T12:25:28.613Z',
          domain: 'acme.org',
          hs_lastmodifieddate: '2022-10-03T12:25:28.613Z',
          hs_object_id: '9719490159',
          hs_pipeline: 'companies-lifecycle-pipeline',
          industry: 'Technology',
          lifecyclestage: 'lead',
          name: 'Acme Inc.',
          phone: '(877) 929-0687',
          state: 'California',
          website: 'acme.org'
        },
        createdAt: '2022-10-03T12:25:28.613Z',
        updatedAt: '2022-10-03T12:25:28.613Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Create Company',
      properties: {
        city: 'San Francisco',
        domain: 'acme.org',
        industry: 'Technology',
        name: 'Acme Inc.',
        phone: '(877) 929-0687',
        state: 'California'
      }
    })

    const responses = await testDestination.testAction('createCustomObjectRecord', {
      event,
      mapping: {
        objectType: 'companies',
        properties: {
          properties: {
            city: {
              '@path': '$.properties.city'
            },
            domain: {
              '@path': '$.properties.domain'
            },
            industry: {
              '@path': '$.properties.industry'
            },
            name: {
              '@path': '$.properties.name'
            },
            phone: {
              '@path': '$.properties.phone'
            },
            state: {
              '@path': '$.properties.state'
            }
          }
        }
      }
    })

    expect(responses[0].status).toBe(201)
  })

  it('should create a Deals object with Custom Objects Action', async () => {
    nock(endpoint)
      .post(/.*/)
      .reply(201, {
        id: '12345678900',
        properties: {
          amount: '1000',
          amount_in_home_currency: '1000',
          createdate: '2022-09-28T11:49:58.492Z',
          days_to_close: '0',
          dealname: 'Test Deal',
          dealstage: 'appointmentscheduled',
          hs_closed_amount: '0',
          hs_closed_amount_in_home_currency: '0',
          hs_createdate: '2022-09-28T11:49:58.492Z',
          hs_deal_stage_probability_shadow: '0.200000000000000011102230246251565404236316680908203125',
          hs_forecast_amount: '1000',
          hs_is_closed: 'false',
          hs_is_closed_won: 'false',
          hs_is_deal_split: 'false',
          hs_lastmodifieddate: '2022-09-28T11:49:58.492Z',
          hs_object_id: '10338082470',
          hs_projected_amount: '0',
          hs_projected_amount_in_home_currency: '0',
          pipeline: 'default'
        },
        createdAt: '2022-09-28T11:49:58.492Z',
        updatedAt: '2022-09-28T11:49:58.492Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Create Deal',
      properties: {
        amount: '1000',
        dealName: 'Test Deal',
        dealStage: 'appointmentscheduled',
        pipeline: 'default'
      }
    })

    const responses = await testDestination.testAction('createCustomObjectRecord', {
      event,
      mapping: {
        objectType: 'deals',
        properties: {
          amount: {
            '@path': '$.properties.amount'
          },
          dealname: {
            '@path': '$.properties.dealName'
          },
          dealstage: {
            '@path': '$.properties.dealStage'
          },
          pipeline: {
            '@path': '$.properties.pipeline'
          }
        }
      }
    })

    expect(responses[0].status).toBe(201)
  })

  it('should create a Ticket object with Custom Objects Action', async () => {
    nock(endpoint)
      .post(/.*/)
      .reply(201, {
        id: '1000000001',
        properties: {
          createdate: '2022-10-03T12:38:36.776Z',
          hs_lastmodifieddate: '2022-10-03T12:38:36.776Z',
          hs_object_id: '1000000001',
          hs_pipeline: '0',
          hs_pipeline_stage: '1',
          hs_ticket_id: '1000000001',
          hs_ticket_priority: 'HIGH',
          subject: 'troubleshoot report'
        },
        createdAt: '2022-10-03T12:38:36.776Z',
        updatedAt: '2022-10-03T12:38:36.776Z',
        archived: false
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Create Ticket',
      properties: {
        hs_pipeline: '0',
        hs_pipeline_stage: '1',
        hs_ticket_priority: 'HIGH',
        subject: 'troubleshoot report'
      }
    })

    const responses = await testDestination.testAction('createCustomObjectRecord', {
      event,
      mapping: {
        objectType: 'tickets',
        properties: {
          hs_pipeline: {
            '@path': '$.properties.hs_pipeline'
          },
          hs_pipeline_stage: {
            '@path': '$.properties.hs_pipeline_stage'
          },
          hs_ticket_priority: {
            '@path': '$.properties.hs_ticket_priority'
          },
          subject: {
            '@path': '$.properties.subject'
          }
        }
      }
    })

    expect(responses[0].status).toBe(201)
  })

  // Validate that Custom Object creation throws errors on unsupported HubSpot Objects
  const objectName = 'unknown-object'

  it('should throw an error on unsupported HubSpot Objects', async () => {
    nock(endpoint)
      .post(/.*/)
      .reply(400, {
        status: 'error',
        message: `Unable to infer object type from: ${objectName}`,
        correlationId: 'aabbcc5b13-c9c7-4000-9191-000000000000'
      })

    const event = createTestEvent({
      type: 'track',
      event: 'Create Undefined Object',
      properties: {
        someProperty: ''
      }
    })

    await expect(
      testDestination.testAction('createCustomObjectRecord', {
        event,
        mapping: {
          objectType: objectName,
          properties: {
            someproperty: {
              '@path': '$.properties.someProperty'
            }
          }
        }
      })
    ).rejects.toThrowError(
      new IntegrationError(
        'Custom Object is not in valid format. Please make sure that you are using either a valid format of object’s fullyQualifiedName (eg: p11223344_myobject) or a supported HubSpot defined object (i.e.: deals, tickets, contacts and companies).',
        'Custom Object is not in valid format',
        400
      )
    )
  })
})
