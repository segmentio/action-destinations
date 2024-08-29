import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = new Date('Thu Jun 10 2024 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const profileId = '12345'
const floodlightActivityId = '23456'
const floodlightConfigurationId = '34567'

describe('Cm360.conversionUpload', () => {
  describe('Successful scenarios', () => {
    it('sends an event with default mappings + default settings, plain data', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          ordinal: '1',
          quantity: '1',
          value: '123',
          gclid: '54321',
          userDetails: {
            email: 'daffy@warnerbros.com',
            phone: '1234567890',
            firstName: 'Daffy',
            lastName: 'Duck',
            streetAddress: '123 Daffy St',
            city: 'Burbank',
            state: 'CA',
            postalCode: '98765',
            countryCode: 'US'
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

    it('sends an event with default mappings + default settings, hashed data', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          ordinal: '1',
          quantity: '1',
          value: '123',
          gclid: '54321',
          userDetails: {
            email: '8e46bd4eaabb5d6324e327751b599f190dbaacd90066e66c94a046640bed60d0',
            phone: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
            firstName: 'Daffy',
            lastName: 'Duck',
            streetAddress: '123 Daffy St',
            city: 'Burbank',
            state: 'CA',
            postalCode: '98765',
            countryCode: 'US'
          }
        }
      })

      console.log(event)
      nock(`https://www.googleapis.com/oauth2/v4/token`).post('').reply(200, {
        access_token: 'my.access.token'
      })

      nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchinsert`)
        .post('')
        .reply(201, { results: [{}] })
    })
  })
})
