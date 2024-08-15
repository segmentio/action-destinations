import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = new Date('Thu Jun 10 2024 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const profileId = '12345'
const floodlightActivityId = '23456'
const floodlightConfigurationId = '34567'

describe('Cm360.conversionUpload', () => {
  it('sends an event with default mappings + default settings', async () => {
    const event = createTestEvent({
      timestamp,
      event: 'Test Event',
      properties: {
        ordinal: '1',
        quantity: '1',
        value: '123',
        gclid: '54321',
        email: 'test@gmail.com',
        orderId: '1234',
        phone: '1234567890',
        firstName: 'Jane',
        lastName: 'Doe',
        address: {
          street: '123 Street SW',
          city: 'San Diego',
          state: 'CA',
          postalCode: '982004'
        }
      }
    })

    nock(`https://www.googleapis.com/oauth2/v4/token`).post('').reply(200, {
      access_token: 'my.access.token'
    })

    nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchinsert`)
      .post('')
      .reply(201, { results: [{}] })

    const responses = await testDestination.testAction('conversionUpload', {
      event,
      mapping: {
        gclid: {
          '@path': '$.properties.gclid'
        },
        timestamp: {
          '@path': '$.timestamp'
        },
        value: {
          '@path': '$.properties.value'
        },
        quantity: {
          '@path': '$.properties.quantity'
        },
        ordinal: {
          '@path': '$.properties.ordinal'
        }
      },
      useDefaultMappings: true,
      settings: {
        profileId,
        defaultFloodlightActivityId: floodlightActivityId,
        defaultFloodlightConfigurationId: floodlightConfigurationId
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(201)
  })
})
