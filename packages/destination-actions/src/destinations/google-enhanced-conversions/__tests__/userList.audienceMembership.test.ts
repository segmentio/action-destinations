/**
 * FLAG_CLEANUP: When flags actions-core-audience-membership + actions-google-ec-audience-membership are removed:
 *   1. Remove the `features` constant and the `features` key from every testAction/executeBatch call in this file
 *   2. Move these tests into userList.test.ts
 *   3. Delete this file
 */

import nock from 'nock'
import { createTestEvent, createTestIntegration, FLAGS } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION } from '../functions'
import { SegmentEvent } from '@segment/actions-core'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

const features = {
  [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true
}

const batchMapping = {
  phone: { '@path': '$.properties.phone' },
  email: { '@path': '$.properties.email' },
  firstName: { '@path': '$.properties.firstName' },
  lastName: { '@path': '$.properties.lastName' },
  event_name: { '@path': '$.event' },
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

// Hashed values for test data
const hashes = {
  email: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674',         // test@gmail.com
  email1: 'ede2e3d4c737f00aaab14de19e6ce9e20248a35ea030882b72d5d22de1f867d6',        // test+1@gmail.com
  phone: '0506a1f3f4c515fd310fce54d253b731f71e33e7e7d2b10848528ca4411120b0',         // +13234567890
  firstName: '4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332',     // Jane
  lastName: 'fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7'       // Doe
}

const baseUrl = 'https://googleads.googleapis.com'
const createPath = `/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`
const addOpsPath = `/${API_VERSION}/customers/1234/userLists/1234:addOperations`
const runPath = `/${API_VERSION}/customers/1234/userLists/1234:run`

const createJobResponse = { resourceName: 'customers/1234/userLists/1234' }
const addOpsResponse = { data: 'offlineDataJob' }
const runResponse = { data: 'offlineDataJob' }

describe('GoogleEnhancedConversions', () => {
  describe('userList — feature flags: actions-core-audience-membership + actions-google-ec-audience-membership', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('audienceMembership = true adds user to list', async () => {
      const event = createTestEvent({
        timestamp,
        type: 'track',
        event: 'Track Event',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'my_audience'
          }
        },
        properties: {
          my_audience: true,
          email: 'test@gmail.com',
          phone: '3234567890',
          firstName: 'Jane',
          lastName: 'Doe'
        }
      })

      nock(baseUrl)
        .post(createPath, {
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: 'customers/1234/userLists/1234',
              consent: { adUserData: 'GRANTED', adPersonalization: 'GRANTED' }
            }
          }
        })
        .reply(200, createJobResponse)

      nock(baseUrl)
        .post(addOpsPath, {
          operations: [
            {
              create: {
                userIdentifiers: [
                  { hashedEmail: hashes.email },
                  { hashedPhoneNumber: hashes.phone },
                  { addressInfo: { hashedFirstName: hashes.firstName, hashedLastName: hashes.lastName, countryCode: '', postalCode: '' } }
                ]
              }
            }
          ],
          enable_warnings: true
        })
        .reply(200, addOpsResponse)

      nock(baseUrl)
        .post(runPath)
        .reply(200, runResponse)

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: {
          ad_user_data_consent_state: 'GRANTED',
          ad_personalization_consent_state: 'GRANTED',
          external_audience_id: '1234',
          retlOnMappingSave: {
            outputs: { id: '1234', name: 'Test List', external_id_type: 'CONTACT_INFO' }
          }
        },
        useDefaultMappings: true,
        settings: { customerId },
        features
      })

      expect(responses.length).toEqual(3)
      expect(JSON.parse(responses[0].options.body as string)).toEqual({
        job: {
          type: 'CUSTOMER_MATCH_USER_LIST',
          customerMatchUserListMetadata: {
            userList: 'customers/1234/userLists/1234',
            consent: { adUserData: 'GRANTED', adPersonalization: 'GRANTED' }
          }
        }
      })
      expect(responses[0].data).toEqual(createJobResponse)
      expect(JSON.parse(responses[1].options.body as string)).toEqual({
        operations: [
          {
            create: {
              userIdentifiers: [
                { hashedEmail: hashes.email },
                { hashedPhoneNumber: hashes.phone },
                { addressInfo: { hashedFirstName: hashes.firstName, hashedLastName: hashes.lastName, countryCode: '', postalCode: '' } }
              ]
            }
          }
        ],
        enable_warnings: true
      })
      expect(responses[1].data).toEqual(addOpsResponse)
    })

    it('audienceMembership = false removes user from list', async () => {
      const event = createTestEvent({
        timestamp,
        type: 'track',
        event: 'Track Event',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'my_audience'
          }
        },
        properties: {
          my_audience: false,
          email: 'test@gmail.com',
          phone: '3234567890',
          firstName: 'Jane',
          lastName: 'Doe'
        }
      })

      nock(baseUrl)
        .post(createPath, {
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: 'customers/1234/userLists/1234',
              consent: { adUserData: 'GRANTED', adPersonalization: 'GRANTED' }
            }
          }
        })
        .reply(200, createJobResponse)

      nock(baseUrl)
        .post(addOpsPath, {
          operations: [
            {
              remove: {
                userIdentifiers: [
                  { hashedEmail: hashes.email },
                  { hashedPhoneNumber: hashes.phone },
                  { addressInfo: { hashedFirstName: hashes.firstName, hashedLastName: hashes.lastName, countryCode: '', postalCode: '' } }
                ]
              }
            }
          ],
          enable_warnings: true
        })
        .reply(200, addOpsResponse)

      nock(baseUrl)
        .post(runPath)
        .reply(200, runResponse)

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: {
          ad_user_data_consent_state: 'GRANTED',
          ad_personalization_consent_state: 'GRANTED',
          external_audience_id: '1234',
          retlOnMappingSave: {
            outputs: { id: '1234', name: 'Test List', external_id_type: 'CONTACT_INFO' }
          }
        },
        useDefaultMappings: true,
        settings: { customerId },
        features
      })

      expect(responses.length).toEqual(3)
      expect(JSON.parse(responses[0].options.body as string)).toEqual({
        job: {
          type: 'CUSTOMER_MATCH_USER_LIST',
          customerMatchUserListMetadata: {
            userList: 'customers/1234/userLists/1234',
            consent: { adUserData: 'GRANTED', adPersonalization: 'GRANTED' }
          }
        }
      })
      expect(responses[0].data).toEqual(createJobResponse)
      expect(JSON.parse(responses[1].options.body as string)).toEqual({
        operations: [
          {
            remove: {
              userIdentifiers: [
                { hashedEmail: hashes.email },
                { hashedPhoneNumber: hashes.phone },
                { addressInfo: { hashedFirstName: hashes.firstName, hashedLastName: hashes.lastName, countryCode: '', postalCode: '' } }
              ]
            }
          }
        ],
        enable_warnings: true
      })
      expect(responses[1].data).toEqual(addOpsResponse)
    })

    it('batch: adds users when audienceMembership = true', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          type: 'track',
          event: 'Track Event',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: true, email: 'test@gmail.com', phone: '3234567890', firstName: 'Jane', lastName: 'Doe' }
        }),
        createTestEvent({
          timestamp,
          type: 'track',
          event: 'Track Event',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: true, email: 'test+1@gmail.com', phone: '3234567890', firstName: 'Jane', lastName: 'Doe' }
        })
      ]

      nock(baseUrl)
        .post(createPath, {
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: 'customers/1234/userLists/1234',
              consent: { adUserData: 'DENIED', adPersonalization: 'UNSPECIFIED' }
            }
          }
        })
        .reply(200, createJobResponse)

      nock(baseUrl)
        .post(addOpsPath, {
          operations: [
            {
              create: {
                userIdentifiers: [
                  { hashedEmail: hashes.email },
                  { hashedPhoneNumber: hashes.phone }
                ]
              }
            },
            {
              create: {
                userIdentifiers: [
                  { hashedEmail: hashes.email1 },
                  { hashedPhoneNumber: hashes.phone }
                ]
              }
            }
          ],
          enablePartialFailure: true
        })
        .reply(200, addOpsResponse)

      nock(baseUrl)
        .post(runPath)
        .reply(200, runResponse)

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping: batchMapping,
        settings: { customerId },
        features
      })

      expect(responses[0]).toMatchObject({ status: 200, sent: '/customers/1234/userLists/1234:run', body: runResponse })
      expect(responses[1]).toMatchObject({ status: 200, sent: '/customers/1234/userLists/1234:run', body: runResponse })
    })

    it('batch: removes users when audienceMembership = false', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          type: 'track',
          event: 'Track Event',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: false, email: 'test@gmail.com', phone: '3234567890', firstName: 'Jane', lastName: 'Doe' }
        }),
        createTestEvent({
          timestamp,
          type: 'track',
          event: 'Track Event',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: false, email: 'test+1@gmail.com', phone: '3234567890', firstName: 'Jane', lastName: 'Doe' }
        })
      ]

      nock(baseUrl)
        .post(createPath, {
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: 'customers/1234/userLists/1234',
              consent: { adUserData: 'DENIED', adPersonalization: 'UNSPECIFIED' }
            }
          }
        })
        .reply(200, createJobResponse)

      nock(baseUrl)
        .post(addOpsPath, {
          operations: [
            {
              remove: {
                userIdentifiers: [
                  { hashedEmail: hashes.email },
                  { hashedPhoneNumber: hashes.phone }
                ]
              }
            },
            {
              remove: {
                userIdentifiers: [
                  { hashedEmail: hashes.email1 },
                  { hashedPhoneNumber: hashes.phone }
                ]
              }
            }
          ],
          enablePartialFailure: true
        })
        .reply(200, addOpsResponse)

      nock(baseUrl)
        .post(runPath)
        .reply(200, runResponse)

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping: batchMapping,
        settings: { customerId },
        features
      })

      expect(responses[0]).toMatchObject({ status: 200, sent: '/customers/1234/userLists/1234:run', body: runResponse })
      expect(responses[1]).toMatchObject({ status: 200, sent: '/customers/1234/userLists/1234:run', body: runResponse })
    })

    it('batch: processes mixed add and remove operations when audienceMembership differs across events', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          type: 'track',
          event: 'Track Event',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: true, email: 'test@gmail.com', phone: '3234567890', firstName: 'Jane', lastName: 'Doe' }
        }),
        createTestEvent({
          timestamp,
          type: 'track',
          event: 'Track Event',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: false, email: 'test+1@gmail.com', phone: '3234567890', firstName: 'Jane', lastName: 'Doe' }
        })
      ]

      nock(baseUrl)
        .post(createPath, {
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: 'customers/1234/userLists/1234',
              consent: { adUserData: 'DENIED', adPersonalization: 'UNSPECIFIED' }
            }
          }
        })
        .reply(200, createJobResponse)

      // Adds are sent first, then removes — two separate addOperations calls
      nock(baseUrl)
        .post(addOpsPath, {
          operations: [
            {
              create: {
                userIdentifiers: [
                  { hashedEmail: hashes.email },
                  { hashedPhoneNumber: hashes.phone }
                ]
              }
            }
          ],
          enablePartialFailure: true
        })
        .reply(200, addOpsResponse)

      nock(baseUrl)
        .post(addOpsPath, {
          operations: [
            {
              remove: {
                userIdentifiers: [
                  { hashedEmail: hashes.email1 },
                  { hashedPhoneNumber: hashes.phone }
                ]
              }
            }
          ],
          enablePartialFailure: true
        })
        .reply(200, addOpsResponse)

      nock(baseUrl)
        .post(runPath)
        .reply(200, runResponse)

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping: batchMapping,
        settings: { customerId },
        features
      })

      expect(responses[0]).toMatchObject({ status: 200, sent: '/customers/1234/userLists/1234:run', body: runResponse })
      expect(responses[1]).toMatchObject({ status: 200, sent: '/customers/1234/userLists/1234:run', body: runResponse })
    })

    it('batch: skips event and returns validation error when audienceMembership is undefined and event name is unrecognized', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          type: 'track',
          event: 'Invalid Event',
          properties: { email: 'test@gmail.com', phone: '3234567890' }
        }),
        createTestEvent({
          timestamp,
          type: 'track',
          event: 'Invalid Event',
          properties: { email: 'test+1@gmail.com', phone: '3234567890' }
        })
      ]

      nock(baseUrl)
        .post(createPath, {
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: 'customers/1234/userLists/1234',
              consent: { adUserData: 'DENIED', adPersonalization: 'UNSPECIFIED' }
            }
          }
        })
        .reply(200, createJobResponse)

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping: batchMapping,
        settings: { customerId },
        features
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
  })
})
