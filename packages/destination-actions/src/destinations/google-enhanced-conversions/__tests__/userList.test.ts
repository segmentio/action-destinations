import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION } from '../functions'
import { SegmentEvent } from '@segment/actions-core'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'
const mapping = {
  phone: { '@path': '$.properties.phone' },
  email: { '@path': '$.properties.email' },
  firstName: { '@path': '$.properties.firstName' },
  lastName: { '@path': '$.properties.lastName' },
  event_name: {
    '@path': '$.event'
  },
  ad_user_data_consent_state: 'DENIED',
  ad_personalization_consent_state: 'UNSPECIFIED',
  external_audience_id: '1234',
  retlOnMappingSave: {
    outputs: {
      id: '1234',
      name: 'Test List',
      external_id_type: 'CONTACT_INFO'
    }
  }
}
describe('GoogleEnhancedConversions', () => {
  describe('userList', () => {
    it('sends an event with default mappings - event = Audience Entered', async () => {
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

    it('sends an event with default mappings - event = Audience Exited', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Audience Exited',
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
        `"{\\"operations\\":[{\\"remove\\":{\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\",\\"countryCode\\":\\"\\",\\"postalCode\\":\\"\\"}}]}}],\\"enable_warnings\\":true}"`
      )
    })

    it('sends an event with default mappings - syncMode = add', async () => {
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
          __segment_internal_sync_mode: 'add',
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

    it('sends an event with default mappings - syncMode = mirror and event = new', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'new',
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
          __segment_internal_sync_mode: 'mirror',
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

    it('sends an event with default mappings - syncMode = mirror and event = deleted', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'deleted',
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
          __segment_internal_sync_mode: 'mirror',
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
        `"{\\"operations\\":[{\\"remove\\":{\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\",\\"countryCode\\":\\"\\",\\"postalCode\\":\\"\\"}}]}}],\\"enable_warnings\\":true}"`
      )
    })

    it('sends an event with default mappings - syncMode = delete', async () => {
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
          __segment_internal_sync_mode: 'delete',
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
        `"{\\"operations\\":[{\\"remove\\":{\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\",\\"countryCode\\":\\"\\",\\"postalCode\\":\\"\\"}}]}}],\\"enable_warnings\\":true}"`
      )
    })

    it('does not re-hash already hashed values', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Audience Entered',
        properties: {
          gclid: '54321',
          email: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674', //'test@gmail.com'
          orderId: '1234',
          phone: '422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8', //'1234567890'
          firstName: '4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332', //'Jane'
          lastName: 'fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7', //'Doe
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

    it('should successfully handle error other than CONCURRENT_MODIFICATION from createOfflineUserDataJobs API', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
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
        }),
        createTestEvent({
          timestamp,
          event: 'Audience Entered',
          properties: {
            gclid: '54321',
            email: 'test+1@gmail.com',
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
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(400, {
          error: {
            code: 400,
            details: [
              {
                '@type': 'type.googleapis.com/google.ads.googleads.v19.errors.GoogleAdsFailure',
                errors: [
                  {
                    errorCode: {
                      someotherError: 'DATA_CONSTRAINT_VIOLATION'
                    },
                    message:
                      'The request conflicted with existing data. This error will usually be replaced with a more specific error if the request is retried.'
                  }
                ],
                requestId: 'OZ5_72C-3qFN9a87mjE7_w'
              }
            ],
            message: 'Request contains an invalid argument.',
            status: 'INVALID_ARGUMENT'
          }
        })

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping,
        settings: {
          customerId
        }
      })

      expect(responses[0]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'Request contains an invalid argument.',
        errorreporter: 'DESTINATION',
        sent: {
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: 'customers/1234/userLists/1234',
              consent: {
                adUserData: 'DENIED',
                adPersonalization: 'UNSPECIFIED'
              }
            }
          }
        },
        body: new Error('Bad Request')
      })

      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'Request contains an invalid argument.',
        errorreporter: 'DESTINATION'
      })
    })
    it('Rethrows CONCURRENT_MODIFICATION error from createOfflineUserDataJobs API as retryable error', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Audience Exited',
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
        }),
        createTestEvent({
          timestamp,
          event: 'Audience Exited',
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
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(400, {
          error: {
            code: 400,
            details: [
              {
                '@type': 'type.googleapis.com/google.ads.googleads.v19.errors.GoogleAdsFailure',
                errors: [
                  {
                    errorCode: {
                      databaseError: 'CONCURRENT_MODIFICATION'
                    },
                    message: 'Multiple requests were attempting to modify the same resource at once. Retry the request.'
                  }
                ],
                requestId: 'OZ5_72C-3qFN9a87mjE7_w'
              }
            ],
            message: 'Request contains an invalid argument.',
            status: 'INVALID_ARGUMENT'
          }
        })

      // nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`).post(/.*/).reply(200)

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping,
        settings: {
          customerId
        }
      })
      expect(responses[0]).toMatchObject({
        status: 429,
        errortype: 'RETRYABLE_BATCH_FAILURE',
        errormessage:
          "This event wasn't delivered because of CONCURRENT_MODIFICATION error. Multiple requests were attempting to modify the same resource at once. Retry the request.",
        sent: {
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: `customers/1234/userLists/1234`,
              consent: {
                adUserData: 'DENIED',
                adPersonalization: 'UNSPECIFIED'
              }
            }
          }
        },
        body: new Error('Bad Request'),
        errorreporter: 'DESTINATION'
      })

      expect(responses[1]).toMatchObject({
        status: 429,
        errortype: 'RETRYABLE_BATCH_FAILURE',
        errormessage:
          "This event wasn't delivered because of CONCURRENT_MODIFICATION error. Multiple requests were attempting to modify the same resource at once. Retry the request.",
        sent: {
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: `customers/1234/userLists/1234`,
              consent: {
                adUserData: 'DENIED',
                adPersonalization: 'UNSPECIFIED'
              }
            }
          }
        },
        body: new Error('Bad Request'),
        errorreporter: 'DESTINATION'
      })
    })

    it('Rethrows CONCURRENT_MODIFICATION error from addOperation offlineUserDataJobs API as retryable error', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Audience Exited',
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
        }),
        createTestEvent({
          timestamp,
          event: 'Audience Exited',
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
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName: 'customers/1234/userList/1234' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
        .post(/.*/)
        .reply(400, {
          error: {
            code: 400,
            details: [
              {
                '@type': 'type.googleapis.com/google.ads.googleads.v19.errors.GoogleAdsFailure',
                errors: [
                  {
                    errorCode: {
                      databaseError: 'CONCURRENT_MODIFICATION'
                    },
                    message: 'Multiple requests were attempting to modify the same resource at once. Retry the request.'
                  }
                ],
                requestId: 'OZ5_72C-3qFN9a87mjE7_w'
              }
            ],
            message: 'Request contains an invalid argument.',
            status: 'INVALID_ARGUMENT'
          }
        })

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping,
        settings: {
          customerId
        }
      })
      expect(responses[0]).toMatchObject({
        status: 429,
        errortype: 'RETRYABLE_BATCH_FAILURE',
        errormessage:
          "This event wasn't delivered because of CONCURRENT_MODIFICATION error. Multiple requests were attempting to modify the same resource at once. Retry the request.",
        sent: {
          enablePartialFailure: true,
          operations: [
            {
              remove: {
                userIdentifiers: [
                  {
                    hashedEmail: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674'
                  },
                  {
                    hashedPhoneNumber: '422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'
                  }
                ]
              }
            },
            {
              remove: {
                userIdentifiers: [
                  {
                    hashedEmail: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674'
                  },
                  {
                    hashedPhoneNumber: '422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'
                  }
                ]
              }
            }
          ]
        },
        body: new Error('Bad Request'),
        errorreporter: 'DESTINATION'
      })

      expect(responses[1]).toMatchObject({
        status: 429,
        errortype: 'RETRYABLE_BATCH_FAILURE',
        errormessage:
          "This event wasn't delivered because of CONCURRENT_MODIFICATION error. Multiple requests were attempting to modify the same resource at once. Retry the request.",
        sent: {
          enablePartialFailure: true,
          operations: [
            {
              remove: {
                userIdentifiers: [
                  {
                    hashedEmail: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674'
                  },
                  {
                    hashedPhoneNumber: '422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'
                  }
                ]
              }
            },
            {
              remove: {
                userIdentifiers: [
                  {
                    hashedEmail: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674'
                  },
                  {
                    hashedPhoneNumber: '422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'
                  }
                ]
              }
            }
          ]
        },
        body: new Error('Bad Request'),
        errorreporter: 'DESTINATION'
      })
    })

    it('should successfully handle a Partial failure error from  addOperation offlineUserDataJobs API', async () => {
      const events: SegmentEvent[] = [
        // Assume this Payload gets failed in Partial Failure
        createTestEvent({
          timestamp,
          event: 'Audience Entered',
          properties: {
            gclid: '54321',
            email: 'test+1@gmail.com',
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
        }),
        // Invalid Email
        createTestEvent({
          timestamp,
          event: 'Audience Entered',
          properties: {
            gclid: '54321',
            email: 'invalid_email',
            orderId: '1234',
            phone: '1234567890',
            firstName: 'Jane',
            lastName: 'Doe',
            currency: 'USD',
            value: '123'
          }
        }),
        //Valid Payload
        createTestEvent({
          timestamp,
          event: 'Audience Entered',
          properties: {
            gclid: '54321',
            email: 'test+2@gmail.com',
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
        }),
        // Missing email ,phone and addressInfo which is necessary for CONTACT_INFO
        createTestEvent({
          timestamp,
          event: 'Audience Entered',
          properties: {
            gclid: '54321',
            orderId: '1234',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        }),
        //Assume this Payload also gets failed in Partial Failure
        createTestEvent({
          timestamp,
          event: 'Audience Entered',
          properties: {
            gclid: '54321',
            email: 'test+3@gmail.com',
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
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName: 'customers/1234/userLists/1234' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
        .post(/.*/)
        .reply(200, {
          partialFailureError: {
            code: 3,
            message: 'Mocking Partial Failure Error',
            details: [
              {
                '@type': 'type.googleapis.com/google.ads.googleads.v19.errors.GoogleAdsFailure',
                errors: [
                  {
                    errorCode: {
                      offlineUserDataJobError: 'INVALID_SHA256_FORMAT'
                    },
                    message: 'The SHA256 encoded value is malformed.',
                    location: {
                      fieldPathElements: [
                        {
                          fieldName: 'operations',
                          index: 0
                        },
                        {
                          fieldName: 'create'
                        },
                        {
                          fieldName: 'user_identifiers',
                          index: 0
                        },
                        {
                          fieldName: 'hashed_email'
                        }
                      ]
                    }
                  },
                  {
                    errorCode: {
                      offlineUserDataJobError: 'INVALID_SHA256_FORMAT'
                    },
                    message: 'The SHA256 encoded value is malformed.',
                    location: {
                      fieldPathElements: [
                        {
                          fieldName: 'operations',
                          index: 2
                        },
                        {
                          fieldName: 'create'
                        },
                        {
                          fieldName: 'user_identifiers',
                          index: 0
                        },
                        {
                          fieldName: 'hashed_email'
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`).post(/.*/).reply(200, { done: true })

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping,
        settings: {
          customerId
        }
      })

      //Partial Failure(invalid payload) due to invalid Payload
      expect(responses[0]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'The SHA256 encoded value is malformed.',
        sent: {
          create: {
            userIdentifiers: [
              {
                hashedEmail: 'ede2e3d4c737f00aaab14de19e6ce9e20248a35ea030882b72d5d22de1f867d6'
              },
              {
                hashedPhoneNumber: '422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'
              }
            ]
          }
        },
        body: {
          errorCode: { offlineUserDataJobError: 'INVALID_SHA256_FORMAT' },
          message: 'The SHA256 encoded value is malformed.',
          location: {
            fieldPathElements: [
              {
                fieldName: 'operations',
                index: 0
              },
              {
                fieldName: 'create'
              },
              {
                fieldName: 'user_identifiers',
                index: 0
              },
              {
                fieldName: 'hashed_email'
              }
            ]
          }
        },
        errorreporter: 'DESTINATION'
      })
      // Invalid Email
      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "Email provided doesn't seem to be in a valid format.",
        errorreporter: 'INTEGRATIONS'
      })
      //success
      expect(responses[2]).toMatchObject({
        status: 200,
        sent: '/customers/1234/userLists/1234:run',
        body: { done: true }
      })
      // Missing email ,phone and addressInfo which is necessary for CONTACT_INFO
      expect(responses[3]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Missing or Invalid data for CONTACT_INFO.',
        errorreporter: 'INTEGRATIONS'
      })
      //Partial Failure(invalid payload) due to invalid Payload
      expect(responses[4]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'The SHA256 encoded value is malformed.',
        sent: {
          create: {
            userIdentifiers: [
              {
                hashedEmail: 'faca876f60e93cf76a50b2f7c980168ef03c49a6313038b6386057e98cc3cffc'
              },
              {
                hashedPhoneNumber: '422ce82c6fc1724ac878042f7d055653ab5e983d186e616826a72d4384b68af8'
              }
            ]
          }
        },
        body: {
          errorCode: { offlineUserDataJobError: 'INVALID_SHA256_FORMAT' },
          message: 'The SHA256 encoded value is malformed.',
          location: {
            fieldPathElements: [
              {
                fieldName: 'operations',
                index: 2
              },
              {
                fieldName: 'create'
              },
              {
                fieldName: 'user_identifiers',
                index: 0
              },
              {
                fieldName: 'hashed_email'
              }
            ]
          }
        },
        errorreporter: 'DESTINATION'
      })
    })

    it('should successfully handle a batch of events where email is invalid or missing data for CONTACT_INFO', async () => {
      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName: 'customers/1234/userLists/1234' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
        .post(/.*/)
        .reply(200, { data: 'offlineDataJob' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`).post(/.*/).reply(200, { done: true })

      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Audience Entered',
          properties: {
            gclid: '54321',
            orderId: '1234',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        }),
        createTestEvent({
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
        }),

        createTestEvent({
          timestamp,
          event: 'Audience Entered',
          properties: {
            gclid: '54321',
            email: 'invalid_email',
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
      ]

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping,
        settings: {
          customerId
        }
      })

      expect(responses[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Missing or Invalid data for CONTACT_INFO.',
        errorreporter: 'INTEGRATIONS'
      })

      expect(responses[1]).toMatchObject({
        status: 200,
        sent: '/customers/1234/userLists/1234:run',
        body: {
          done: true
        }
      })

      expect(responses[2]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "Email provided doesn't seem to be in a valid format.",
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('Could not deteremine operation type due to invalid event name or syncMode', async () => {
      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName: 'customers/1234/userLists/1234' })

      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Invalid Event',
          properties: {
            email: 'test@gmail.com',
            gclid: '54321',
            orderId: '1234',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Invalid Event Name',
          properties: {
            gclid: '54321',
            email: 'test+1@gmail.com',
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
      ]

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping,
        settings: {
          customerId
        }
      })

      expect(responses[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Could not determine Operation Type.',
        errorreporter: 'INTEGRATIONS'
      })

      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Could not determine Operation Type.',
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('Should successfully handle error other than CONCURRENT_MODIFICATION from run offlineUserDataJobs API', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
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
        }),
        createTestEvent({
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
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName: 'customers/1234/userLists/1234' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
        .post(/.*/)
        .reply(200, { data: 'offlineDataJob' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`)
        .post(/.*/)
        .reply(400, {
          error: {
            code: 400,
            details: [
              {
                '@type': 'type.googleapis.com/google.ads.googleads.v19.errors.GoogleAdsFailure',
                errors: [
                  {
                    errorCode: {
                      someotherError: 'DATA_CONSTRAINT_VIOLATION'
                    },
                    message:
                      'The request conflicted with existing data. This error will usually be replaced with a more specific error if the request is retried.'
                  }
                ],
                requestId: 'OZ5_72C-3qFN9a87mjE7_w'
              }
            ],
            message: 'Request contains an invalid argument.',
            status: 'INVALID_ARGUMENT'
          }
        })

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping,
        settings: {
          customerId
        }
      })

      expect(responses[0]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'Request contains an invalid argument.',
        sent: '/customers/1234/userLists/1234:run',
        body: new Error('Bad Request'),
        errorreporter: 'DESTINATION'
      })

      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'Request contains an invalid argument.',
        sent: '/customers/1234/userLists/1234:run',
        body: new Error('Bad Request'),
        errorreporter: 'DESTINATION'
      })
    })
    it('Rethrows CONCURRENT_MODIFICATION error from run offlineUserDataJobs API as retryable error', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
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
        }),
        createTestEvent({
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
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName: 'customers/1234/userLists/1234' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
        .post(/.*/)
        .reply(200, { data: 'offlineDataJob' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`)
        .post(/.*/)
        .reply(400, {
          error: {
            code: 400,
            details: [
              {
                '@type': 'type.googleapis.com/google.ads.googleads.v19.errors.GoogleAdsFailure',
                errors: [
                  {
                    errorCode: {
                      databaseError: 'CONCURRENT_MODIFICATION'
                    },
                    message: 'Multiple requests were attempting to modify the same resource at once. Retry the request.'
                  }
                ],
                requestId: 'OZ5_72C-3qFN9a87mjE7_w'
              }
            ],
            message: 'Request contains an invalid argument.',
            status: 'INVALID_ARGUMENT'
          }
        })

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping,
        settings: {
          customerId
        }
      })

      expect(responses[0]).toMatchObject({
        status: 429,
        errortype: 'RETRYABLE_BATCH_FAILURE',
        errormessage:
          "This event wasn't delivered because of CONCURRENT_MODIFICATION error. Multiple requests were attempting to modify the same resource at once. Retry the request.",
        sent: '/customers/1234/userLists/1234:run',
        body: new Error('Bad Request'),
        errorreporter: 'DESTINATION'
      })

      expect(responses[1]).toMatchObject({
        status: 429,
        errortype: 'RETRYABLE_BATCH_FAILURE',
        errormessage:
          "This event wasn't delivered because of CONCURRENT_MODIFICATION error. Multiple requests were attempting to modify the same resource at once. Retry the request.",
        sent: '/customers/1234/userLists/1234:run',
        body: new Error('Bad Request'),
        errorreporter: 'DESTINATION'
      })
    })
  })
})
