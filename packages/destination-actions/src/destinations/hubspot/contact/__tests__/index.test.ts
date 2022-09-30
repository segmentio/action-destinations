import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { HubSpotBaseURL } from '../../properties'

const testDestination = createTestIntegration(Destination)

describe('Hubspot.contact', () => {
  test('should create contact sucessfully', () => {
    const testEmail = 'vep@beri.dz'
    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: testEmail,
        first_name: 'John',
        last_name: 'Doe',
        address: {
          city: 'San Fransico'
        },
        graduation_date: 1664533942262
      }
    })

    const patchExpectedPayload = {
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        city: 'San Fransico',
        graduation_date: 1664533942262
      }
    }

    const postExpectedPayload = {
      properties: {
        email: testEmail,
        firstname: 'John',
        lastname: 'Doe',
        city: 'San Fransico',
        graduation_date: 1664533942262
      }
    }

    const mapping = {
      properties: {
        graduation_date: {
          '@path': '$.traits.graduation_date'
        }
      }
    }
    nock(HubSpotBaseURL)
      .patch(`/crm/v3/objects/contacts/${testEmail}?idProperty=email`, patchExpectedPayload)
      .reply(404, {
        status: 'error',
        message: 'resource not found',
        correlationId: 'be56c5f3-5841-4661-b52f-65b3aacd0244'
      })
    nock(HubSpotBaseURL).post('/crm/v3/objects/contacts', postExpectedPayload).reply(201, {})

    return expect(
      testDestination.testAction('contact', { mapping, useDefaultMappings: true, event })
    ).resolves.not.toThrowError()
  })
})
