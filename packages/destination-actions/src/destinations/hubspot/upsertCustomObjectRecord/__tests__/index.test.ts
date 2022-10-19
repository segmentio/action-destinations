import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../../index'
import { HUBSPOT_BASE_URL } from '../../properties'

const testDestination = createTestIntegration(Destination)

describe('HubSpot.upsertCustomObjectRecord', () => {
  // Validate creation of custom object with fullyQualifiedName of a HubSpot Schema
  it('should create a Custom Object with fullyQualifiedName of a Schema', async () => {
    nock(HUBSPOT_BASE_URL)
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

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
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
  it('should create a Deals object with Custom Objects Action', async () => {
    nock(HUBSPOT_BASE_URL)
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

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
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
    nock(HUBSPOT_BASE_URL)
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

    const responses = await testDestination.testAction('upsertCustomObjectRecord', {
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
    nock(HUBSPOT_BASE_URL)
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
      testDestination.testAction('upsertCustomObjectRecord', {
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
        'Custom Object is not in valid format. Please make sure that you are using either a valid format of object’s fullyQualifiedName (eg: p11223344_myobject) or a supported HubSpot defined object (i.e.: deals, tickets).',
        'Custom Object is not in valid format',
        400
      )
    )
  })
})
