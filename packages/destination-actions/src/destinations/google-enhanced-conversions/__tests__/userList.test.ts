import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION } from '../functions'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

describe('GoogleEnhancedConversions', () => {
  describe('userList', () => {
    it('sends an event with default mappings', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Audience Entered',
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

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { data: 'offlineDataJob' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
        .post(/.*/)
        .reply(200, { data: 'offlineDataJob' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`)
        .post(/.*/)
        .reply(200, { data: 'offlineDataJob' })

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: {
          ad_user_data_consent_state: 'GRANTED',
          ad_personalization_consent_state: 'GRANTED',
          external_audience_id: '1234',
          retlOnMappingSave: {
            outputs: {
              id: '1234',
              name: 'Test List',
              external_id_type: 'CONTACT_INFO'
            }
          }
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses.length).toEqual(3)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"job\\":{\\"type\\":\\"CUSTOMER_MATCH_USER_LIST\\",\\"customerMatchUserListMetadata\\":{\\"userList\\":\\"customers/1234/userLists/1234\\",\\"consent\\":{\\"adUserData\\":\\"GRANTED\\",\\"adPersonalization\\":\\"GRANTED\\"}}}}"`
      )
      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"operations\\":[{\\"create\\":{\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\",\\"countryCode\\":\\"\\",\\"postalCode\\":\\"\\"}}]}}],\\"enable_warnings\\":true}"`
      )
    })
  })
})
