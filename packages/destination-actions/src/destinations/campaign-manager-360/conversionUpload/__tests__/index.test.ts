import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const profileId = '12345'

describe('Cm360.conversionUpload', () => {
  it('sends an event with default mappings', async () => {
    const event = createTestEvent({
      timestamp,
      event: 'Test Event',
      properties: {
        gclid: '54321',
        email: 'test@gmail.com',
        orderId: '1234',
        phone: '1234567890',
        firstName: 'Jane',
        lastName: 'Doe',
        currency: 'USD',
        value: '123',
        address: {
          street: '123 Street SW',
          city: 'San Diego',
          state: 'CA',
          postalCode: '982004'
        }
      }
    })

    nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchinsert`)
      .post('')
      .reply(201, { results: [{}] })

    const responses = await testDestination.testAction('uploadConversionAdjustment2', {
      event,
      mapping: {
        gclid: {
          '@path': '$.properties.gclid'
        }
      },
      useDefaultMappings: true,
      settings: {
        profileId
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
  })
})
