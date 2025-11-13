import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL, LINKEDIN_SOURCE_PLATFORM } from '../../constants'

let testDestination = createTestIntegration(Destination)

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

const auth: AuthTokens = {
  accessToken: 'test',
  refreshToken: 'test'
}

const event = createTestEvent({
  event: 'Audience Entered',
  type: 'track',
  properties: {
    audience_key: 'personas_test_audience'
  },
  context: {
    device: {
      advertisingId: '123'
    },
    traits: {
      email: 'testing@testing.com'
    }
  }
})

const urlParams = {
  q: 'account',
  account: 'urn:li:sponsoredAccount:123',
  sourceSegmentId: 'personas_test_audience',
  sourcePlatform: LINKEDIN_SOURCE_PLATFORM
}

const updateUsersRequestBody = {
  elements: [
    {
      action: 'ADD',
      userIds: [
        {
          idType: 'SHA256_EMAIL',
          idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
        },
        {
          idType: 'GOOGLE_AID',
          idValue: '123'
        }
      ]
    }
  ]
}

const createDmpSegmentRequestBody = {
  name: 'personas_test_audience',
  sourcePlatform: LINKEDIN_SOURCE_PLATFORM,
  sourceSegmentId: 'personas_test_audience',
  account: `urn:li:sponsoredAccount:456`,
  type: 'USER',
  destinations: [
    {
      destination: 'LINKEDIN'
    }
  ]
}

beforeEach((done) => {
  testDestination = createTestIntegration(Destination)
  nock.cleanAll()
  done()
})


describe('LinkedinAudiences.updateAudience', () => {
  
  describe('Batch event successful cases', () => {
    it('should send the right (batch) payload - add only payloads - Segment already exists', async () => {

      const event2 = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          email: "test2@test.com",
          first_name: "Jimbo",
          last_name:"Jones",
          title: "Mr.",
          company: "Widgets Inc",
          country: "US",
          android_idfa: "IDFA1",
          audience_key: "personas_test_audience",
        }
      })

      const event3 = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          email: "test3@test.com",
          first_name: "Mary",
          last_name:"Contrary",
          title: "Madam",
          company: "Umbrellas co.",
          country: "China",
          android_idfa: "IDFA2",
          audience_key: "personas_test_audience",
        }
      })

      const updateUsersRequestBody2 = {
        elements: [
          {
            action: "ADD",
            userIds: [
              { idType: "SHA256_EMAIL", idValue: "7599502b735425943fffc167b4c9cfb072d028c109ee07501c8711a4fe0e12e7" },
              { idType: "GOOGLE_AID", idValue: "IDFA1" }
            ],
            firstName: "Jimbo",
            lastName: "Jones",
            title: "Mr.",
            company: "Widgets Inc",
            country: "US"
          },
          {
            action: "ADD",
            userIds: [
              { idType: "SHA256_EMAIL", idValue: "a862f0e6ac9ce4c636cc9a49b621215ae0e9bace8f7964e8486205c9f0f2079e" },
              { idType: "GOOGLE_AID", idValue: "IDFA2" }
            ],
            firstName: "Mary",
            lastName: "Contrary",
            title: "Madam",
            company: "Umbrellas co.",
            country: "China"
          }
        ]
      }

      const updateUsersResonse = {
        elements: [
          {
            status: 200
          },
            {
            status: 200
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "USER" }] })
      
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody2).reply(200, updateUsersResonse)
      
      const responses = await testDestination.executeBatch('updateAudience', {
        events: [event2,event3],
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        auth,
        mapping: {
          enable_batching: true,
          email: { '@path': '$.properties.email' },
          first_name: { '@path': '$.properties.first_name' },
          last_name: { '@path': '$.properties.last_name' },
          title: { '@path': '$.properties.title' },
          company: { '@path': '$.properties.company' },
          country: { '@path': '$.properties.country' },
          google_advertising_id: { '@path': '$.properties.android_idfa' },
          source_segment_id: { '@path': '$.properties.audience_key' },
          event_name: { '@path': '$.event' },
          dmp_user_action: 'AUTO',
          batch_keys: ['source_segment_id', 'personas_audience_key']
        }
      })
       expect(responses).toMatchObject(
        [
          {
            body: {
              elements: [
                {
                  action: "ADD",
                  company: "Widgets Inc",
                  country: "US",
                  firstName: "Jimbo",
                  lastName: "Jones",
                  title: "Mr.",
                  userIds: [
                    { idType: "SHA256_EMAIL", idValue: "7599502b735425943fffc167b4c9cfb072d028c109ee07501c8711a4fe0e12e7" },
                    { idType: "GOOGLE_AID", idValue: "IDFA1" }
                  ]
                }
              ]
            },
            sent: {
              batch_keys: ["source_segment_id", "personas_audience_key"],
              company: "Widgets Inc",
              country: "US",
              dmp_user_action: "AUTO",
              email: "test2@test.com",
              enable_batching: true,
              event_name: "Audience Entered",
              first_name: "Jimbo",
              google_advertising_id: "IDFA1",
              index: 0,
              last_name: "Jones",
              source_segment_id: "personas_test_audience",
              title: "Mr."
            },
            status: 200
          },
          {
            body: {
              elements: [
                {
                  action: "ADD",
                  company: "Umbrellas co.",
                  country: "China",
                  firstName: "Mary",
                  lastName: "Contrary",
                  title: "Madam",
                  userIds: [
                    { idType: "SHA256_EMAIL", idValue: "a862f0e6ac9ce4c636cc9a49b621215ae0e9bace8f7964e8486205c9f0f2079e" },
                    { idType: "GOOGLE_AID", idValue: "IDFA2" }
                  ]
                }
              ]
            },
            sent: {
              batch_keys: ["source_segment_id", "personas_audience_key"],
              company: "Umbrellas co.",
              country: "China",
              dmp_user_action: "AUTO",
              email: "test3@test.com",
              enable_batching: true,
              event_name: "Audience Entered",
              first_name: "Mary",
              google_advertising_id: "IDFA2",
              index: 1,
              last_name: "Contrary",
              source_segment_id: "personas_test_audience",
              title: "Madam"
            },
            status: 200
          }
        ]
       )
    })

    it('should send the right (batch) payload - add and remove payloads - Segment already exists', async () => {

      const event2 = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          email: "test2@test.com",
          first_name: "Jimbo",
          last_name:"Jones",
          title: "Mr.",
          company: "Widgets Inc",
          country: "US",
          android_idfa: "IDFA1",
          audience_key: "personas_test_audience"
        }
      })

      const event3 = createTestEvent({
        event: 'Audience Exited',
        type: 'track',
        properties: {
          email: "test3@test.com",
          first_name: "Mary",
          last_name:"Contrary",
          title: "Madam",
          company: "Umbrellas co.",
          country: "China",
          android_idfa: "IDFA2",
          audience_key: "personas_test_audience"
        }
      })

      const updateUsersRequestBody2 = {
        elements: [
          {
            action: "ADD",
            userIds: [
              { idType: "SHA256_EMAIL", idValue: "7599502b735425943fffc167b4c9cfb072d028c109ee07501c8711a4fe0e12e7" },
              { idType: "GOOGLE_AID", idValue: "IDFA1" }
            ],
            firstName: "Jimbo",
            lastName: "Jones",
            title: "Mr.",
            company: "Widgets Inc",
            country: "US"
          },
          {
            action: "REMOVE",
            userIds: [
              { idType: "SHA256_EMAIL", idValue: "a862f0e6ac9ce4c636cc9a49b621215ae0e9bace8f7964e8486205c9f0f2079e" },
              { idType: "GOOGLE_AID", idValue: "IDFA2" }
            ],
            firstName: "Mary",
            lastName: "Contrary",
            title: "Madam",
            company: "Umbrellas co.",
            country: "China"
          }
        ]
      }

      const updateUsersResonse = {
        elements: [
          {
            status: 200
          },
            {
            status: 200
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "USER" }] })
      
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody2).reply(200, updateUsersResonse)
      
      const responses = await testDestination.executeBatch('updateAudience', {
        events: [event2,event3],
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        auth,
        mapping: {
          enable_batching: true,
          email: { '@path': '$.properties.email' },
          first_name: { '@path': '$.properties.first_name' },
          last_name: { '@path': '$.properties.last_name' },
          title: { '@path': '$.properties.title' },
          company: { '@path': '$.properties.company' },
          country: { '@path': '$.properties.country' },
          google_advertising_id: { '@path': '$.properties.android_idfa' },
          source_segment_id: { '@path': '$.properties.audience_key' },
          event_name: { '@path': '$.event' },
          dmp_user_action: 'AUTO',
          batch_keys: ['source_segment_id', 'personas_audience_key']
        }
      })
      expect(responses).toMatchObject(
       [
        {
          body: {
            elements: [
              {
                action: "ADD",
                company: "Widgets Inc",
                country: "US",
                firstName: "Jimbo",
                lastName: "Jones",
                title: "Mr.",
                userIds: [
                  { idType: "SHA256_EMAIL", idValue: "7599502b735425943fffc167b4c9cfb072d028c109ee07501c8711a4fe0e12e7" },
                  { idType: "GOOGLE_AID", idValue: "IDFA1" }
                ]
              }
            ]
          },
          sent: {
            batch_keys: ["source_segment_id", "personas_audience_key"],
            company: "Widgets Inc",
            country: "US",
            dmp_user_action: "AUTO",
            email: "test2@test.com",
            enable_batching: true,
            event_name: "Audience Entered",
            first_name: "Jimbo",
            google_advertising_id: "IDFA1",
            index: 0,
            last_name: "Jones",
            source_segment_id: "personas_test_audience",
            title: "Mr."
          },
          status: 200
        },
        {
          body: {
            elements: [
              {
                action: "REMOVE",
                company: "Umbrellas co.",
                country: "China",
                firstName: "Mary",
                lastName: "Contrary",
                title: "Madam",
                userIds: [
                  { idType: "SHA256_EMAIL", idValue: "a862f0e6ac9ce4c636cc9a49b621215ae0e9bace8f7964e8486205c9f0f2079e" },
                  { idType: "GOOGLE_AID", idValue: "IDFA2" }
                ]
              }
            ]
          },
          sent: {
            batch_keys: ["source_segment_id", "personas_audience_key"],
            company: "Umbrellas co.",
            country: "China",
            dmp_user_action: "AUTO",
            email: "test3@test.com",
            enable_batching: true,
            event_name: "Audience Exited",
            first_name: "Mary",
            google_advertising_id: "IDFA2",
            index: 1,
            last_name: "Contrary",
            source_segment_id: "personas_test_audience",
            title: "Madam"
          },
          status: 200
        }
      ]
      )
    })

    it('should send the right (batch) payload - remove only payloads - Segment already exists', async () => {

      const event2 = createTestEvent({
        event: 'Audience Exited',
        type: 'track',
        properties: {
          email: "test2@test.com",
          first_name: "Jimbo",
          last_name:"Jones",
          title: "Mr.",
          company: "Widgets Inc",
          country: "US",
          android_idfa: "IDFA1",
          audience_key: "personas_test_audience"
        }
      })

      const event3 = createTestEvent({
        event: 'Audience Exited',
        type: 'track',
        properties: {
          email: "test3@test.com",
          first_name: "Mary",
          last_name:"Contrary",
          title: "Madam",
          company: "Umbrellas co.",
          country: "China",
          android_idfa: "IDFA2",
          audience_key: "personas_test_audience"
        }
      })

      const updateUsersRequestBody2 = {
        elements: [
          {
            action: "REMOVE",
            userIds: [
              { idType: "SHA256_EMAIL", idValue: "7599502b735425943fffc167b4c9cfb072d028c109ee07501c8711a4fe0e12e7" },
              { idType: "GOOGLE_AID", idValue: "IDFA1" }
            ],
            firstName: "Jimbo",
            lastName: "Jones",
            title: "Mr.",
            company: "Widgets Inc",
            country: "US"
          },
          {
            action: "REMOVE",
            userIds: [
              { idType: "SHA256_EMAIL", idValue: "a862f0e6ac9ce4c636cc9a49b621215ae0e9bace8f7964e8486205c9f0f2079e" },
              { idType: "GOOGLE_AID", idValue: "IDFA2" }
            ],
            firstName: "Mary",
            lastName: "Contrary",
            title: "Madam",
            company: "Umbrellas co.",
            country: "China"
          }
        ]
      }

      const updateUsersResonse = {
        elements: [
          {
            status: 200
          },
            {
            status: 200
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "USER" }] })
      
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody2).reply(200, updateUsersResonse)
      
      const responses = await testDestination.executeBatch('updateAudience', {
        events: [event2,event3],
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        auth,
        mapping: {
          enable_batching: true,
          email: { '@path': '$.properties.email' },
          first_name: { '@path': '$.properties.first_name' },
          last_name: { '@path': '$.properties.last_name' },
          title: { '@path': '$.properties.title' },
          company: { '@path': '$.properties.company' },
          country: { '@path': '$.properties.country' },
          google_advertising_id: { '@path': '$.properties.android_idfa' },
          source_segment_id: { '@path': '$.properties.audience_key' },
          event_name: { '@path': '$.event' },
          dmp_user_action: 'AUTO',
          batch_keys: ['source_segment_id', 'personas_audience_key']
        }
      })
      expect(responses).toMatchObject(
      [{
          body: {
            elements: [
              {
                action: "REMOVE",
                company: "Widgets Inc",
                country: "US",
                firstName: "Jimbo",
                lastName: "Jones",
                title: "Mr.",
                userIds: [
                  { idType: "SHA256_EMAIL", idValue: "7599502b735425943fffc167b4c9cfb072d028c109ee07501c8711a4fe0e12e7" },
                  { idType: "GOOGLE_AID", idValue: "IDFA1" }
                ]
              }
            ]
          },
          sent: {
            batch_keys: ["source_segment_id", "personas_audience_key"],
            company: "Widgets Inc",
            country: "US",
            dmp_user_action: "AUTO",
            email: "test2@test.com",
            enable_batching: true,
            event_name: "Audience Exited",
            first_name: "Jimbo",
            google_advertising_id: "IDFA1",
            index: 0,
            last_name: "Jones",
            source_segment_id: "personas_test_audience",
            title: "Mr."
          },
          status: 200
        },
        {
          body: {
            elements: [
              {
                action: "REMOVE",
                company: "Umbrellas co.",
                country: "China",
                firstName: "Mary",
                lastName: "Contrary",
                title: "Madam",
                userIds: [
                  { idType: "SHA256_EMAIL", idValue: "a862f0e6ac9ce4c636cc9a49b621215ae0e9bace8f7964e8486205c9f0f2079e" },
                  { idType: "GOOGLE_AID", idValue: "IDFA2" }
                ]
              }
            ]
          },
          sent: {
            batch_keys: ["source_segment_id", "personas_audience_key"],
            company: "Umbrellas co.",
            country: "China",
            dmp_user_action: "AUTO",
            email: "test3@test.com",
            enable_batching: true,
            event_name: "Audience Exited",
            first_name: "Mary",
            google_advertising_id: "IDFA2",
            index: 1,
            last_name: "Contrary",
            source_segment_id: "personas_test_audience",
            title: "Madam"
          },
          status: 200
        }
      ]

      )
    })

    it('should send the right (batch) payload - remove only payloads - Segment gets created', async () => {

      const event2 = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          email: "test2@test.com",
          first_name: "Jimbo",
          last_name:"Jones",
          title: "Mr.",
          company: "Widgets Inc",
          country: "US",
          android_idfa: "IDFA1",
          audience_key: "personas_test_audience"
        }
      })

      const event3 = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          email: "test3@test.com",
          first_name: "Mary",
          last_name:"Contrary",
          title: "Madam",
          company: "Umbrellas co.",
          country: "China",
          android_idfa: "IDFA2",
          audience_key: "personas_test_audience"
        }
      })

      const updateUsersRequestBody2 = {
        elements: [
          {
            action: "ADD",
            userIds: [
              { idType: "SHA256_EMAIL", idValue: "7599502b735425943fffc167b4c9cfb072d028c109ee07501c8711a4fe0e12e7" },
              { idType: "GOOGLE_AID", idValue: "IDFA1" }
            ],
            firstName: "Jimbo",
            lastName: "Jones",
            title: "Mr.",
            company: "Widgets Inc",
            country: "US"
          },
          {
            action: "ADD",
            userIds: [
              { idType: "SHA256_EMAIL", idValue: "a862f0e6ac9ce4c636cc9a49b621215ae0e9bace8f7964e8486205c9f0f2079e" },
              { idType: "GOOGLE_AID", idValue: "IDFA2" }
            ],
            firstName: "Mary",
            lastName: "Contrary",
            title: "Madam",
            company: "Umbrellas co.",
            country: "China"
          }
        ]
      }

      const updateUsersResonse = {
        elements: [
          {
            status: 200
          },
            {
            status: 200
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [] })
      
      nock(`${BASE_URL}/dmpSegments`)
        .post(/.*/, {
          name: "personas_test_audience",
          sourcePlatform: "SEGMENT",
          sourceSegmentId: "personas_test_audience",
          account: "urn:li:sponsoredAccount:123",
          type: "USER",
          destinations: [
            {
              destination: "LINKEDIN"
            }
          ]
        })
        .reply(200, { id: 'dmp_segment_id', type: "USER" })
      
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody2).reply(200, updateUsersResonse)
      
      const responses = await testDestination.executeBatch('updateAudience', {
        events: [event2,event3],
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        auth,
        mapping: {
          enable_batching: true,
          email: { '@path': '$.properties.email' },
          first_name: { '@path': '$.properties.first_name' },
          last_name: { '@path': '$.properties.last_name' },
          title: { '@path': '$.properties.title' },
          company: { '@path': '$.properties.company' },
          country: { '@path': '$.properties.country' },
          google_advertising_id: { '@path': '$.properties.android_idfa' },
          source_segment_id: { '@path': '$.properties.audience_key' },
          event_name: { '@path': '$.event' },
          dmp_user_action: 'AUTO',
          batch_keys: ['source_segment_id', 'personas_audience_key']
        }
      })
      expect(responses).toMatchObject(
      [{
          body: {
            elements: [
              {
                action: "ADD",
                company: "Widgets Inc",
                country: "US",
                firstName: "Jimbo",
                lastName: "Jones",
                title: "Mr.",
                userIds: [
                  { idType: "SHA256_EMAIL", idValue: "7599502b735425943fffc167b4c9cfb072d028c109ee07501c8711a4fe0e12e7" },
                  { idType: "GOOGLE_AID", idValue: "IDFA1" }
                ]
              }
            ]
          },
          sent: {
            batch_keys: ["source_segment_id", "personas_audience_key"],
            company: "Widgets Inc",
            country: "US",
            dmp_user_action: "AUTO",
            email: "test2@test.com",
            enable_batching: true,
            event_name: "Audience Entered",
            first_name: "Jimbo",
            google_advertising_id: "IDFA1",
            index: 0,
            last_name: "Jones",
            source_segment_id: "personas_test_audience",
            title: "Mr."
          },
          status: 200
        },
        {
          body: {
            elements: [
              {
                action: "ADD",
                company: "Umbrellas co.",
                country: "China",
                firstName: "Mary",
                lastName: "Contrary",
                title: "Madam",
                userIds: [
                  { idType: "SHA256_EMAIL", idValue: "a862f0e6ac9ce4c636cc9a49b621215ae0e9bace8f7964e8486205c9f0f2079e" },
                  { idType: "GOOGLE_AID", idValue: "IDFA2" }
                ]
              }
            ]
          },
          sent: {
            batch_keys: ["source_segment_id", "personas_audience_key"],
            company: "Umbrellas co.",
            country: "China",
            dmp_user_action: "AUTO",
            email: "test3@test.com",
            enable_batching: true,
            event_name: "Audience Entered",
            first_name: "Mary",
            google_advertising_id: "IDFA2",
            index: 1,
            last_name: "Contrary",
            source_segment_id: "personas_test_audience",
            title: "Madam"
          },
          status: 200
        }
      ])
    })

    it('multistatus response should be correct when there are some payloads fail validation - (batch) payload - add only payloads - Segment already exists', async () => {

      const event2 = createTestEvent({
        // Payload with no identifiers - should be a 400 in multistatus response
        event: 'Audience Entered',
        type: 'track',
        properties: {
          //email: "test2@test.com",
          first_name: "Jimbo",
          last_name:"Jones",
          title: "Mr.",
          company: "Widgets Inc",
          country: "US",
          //android_idfa: "IDFA1",
          audience_key: "personas_test_audience",
        }
      })

      const event3 = createTestEvent({
        // Payload with 1 identifier - should be a 200 in multistatus response
        event: 'Audience Entered',
        type: 'track',
        properties: {
          //email: "test3@test.com",
          first_name: "Mary",
          last_name:"Contrary",
          title: "Madam",
          company: "Umbrellas co.",
          country: "China",
          android_idfa: "IDFA2",
          audience_key: "personas_test_audience",
        }
      })

      const updateUsersRequestBody2 = {
        elements: [
          {
            action: "ADD",
            userIds: [
              { idType: "GOOGLE_AID", idValue: "IDFA2" }
            ],
            firstName: "Mary",
            lastName: "Contrary",
            title: "Madam",
            company: "Umbrellas co.",
            country: "China"
          }
        ]
      }

      const updateUsersResonse = {
        elements: [
          {
            status: 200
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "USER" }] })
      
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody2).reply(200, updateUsersResonse)
      
      const responses = await testDestination.executeBatch('updateAudience', {
        events: [event2,event3],
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        auth,
        mapping: {
          enable_batching: true,
          email: { '@path': '$.properties.email' },
          first_name: { '@path': '$.properties.first_name' },
          last_name: { '@path': '$.properties.last_name' },
          title: { '@path': '$.properties.title' },
          company: { '@path': '$.properties.company' },
          country: { '@path': '$.properties.country' },
          google_advertising_id: { '@path': '$.properties.android_idfa' },
          source_segment_id: { '@path': '$.properties.audience_key' },
          event_name: { '@path': '$.event' },
          dmp_user_action: 'AUTO',
          batch_keys: ['source_segment_id', 'personas_audience_key']
        }
      })

      expect(responses).toMatchObject(
        [
          {
            status: 400,
            errortype: "PAYLOAD_VALIDATION_FAILED",
            errormessage: "At least one of 'User Email' or 'User Google Advertising ID' fields are required. Make sure to enable the 'Send Email' and / or 'Send Google Advertising ID' setting so that the corresponding identifiers are included.",
            errorreporter: "INTEGRATIONS"
          },
          {
            body: {
              elements: [
                {
                  action: "ADD",
                  company: "Umbrellas co.",
                  country: "China",
                  firstName: "Mary",
                  lastName: "Contrary",
                  title: "Madam",
                  userIds: [
                    { idType: "GOOGLE_AID", idValue: "IDFA2" }
                  ]
                }
              ]
            },
            sent: {
              batch_keys: ["source_segment_id", "personas_audience_key"],
              company: "Umbrellas co.",
              country: "China",
              dmp_user_action: "AUTO",
              enable_batching: true,
              event_name: "Audience Entered",
              first_name: "Mary",
              google_advertising_id: "IDFA2",
              index: 1,
              last_name: "Contrary",
              source_segment_id: "personas_test_audience",
              title: "Madam"
            },
            status: 200
          }
        ]
       )
    })
  })

  describe('Single event successful cases', () => {
    it('should succeed if an existing DMP Segment is found', async () => {
      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody).reply(200)

      await expect(
        testDestination.testAction('updateAudience', {
          event,
          settings: {
            ad_account_id: '123',
            send_email: true,
            send_google_advertising_id: true
          },
          useDefaultMappings: true,
          auth
        })
      ).resolves.not.toThrowError()
    })

    it('should successfully create a new DMP Segment if an existing Segment is not found', async () => {
      urlParams.account = 'urn:li:sponsoredAccount:456'

      nock(`${BASE_URL}/dmpSegments`).get(/.*/).query(urlParams).reply(200, { elements: [] })
      nock(`${BASE_URL}/dmpSegments`).post(/.*/, createDmpSegmentRequestBody).reply(200, { id: 'dmp_segment_id', type: 'USER' })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody).reply(200)

      await expect(
        testDestination.testAction('updateAudience', {
          event,
          settings: {
            ad_account_id: '456',
            send_email: true,
            send_google_advertising_id: true
          },
          useDefaultMappings: true,
          auth
        })
      ).resolves.not.toThrowError()
    })

    it('should not throw an error if `dmp_user_action` is not "AUTO"', async () => {
      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(() => true)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody).reply(200)

      await expect(
        testDestination.testAction('updateAudience', {
          event,
          settings: {
            ad_account_id: '123',
            send_email: true,
            send_google_advertising_id: true
          },
          useDefaultMappings: true,
          auth,
          mapping: {
            source_segment_id: 'mismatched_segment',
            dmp_user_action: 'ADD'
          }
        })
      ).resolves.not.toThrowError()
    })

    it('should set action to "ADD" if `dmp_user_action` is "ADD"', async () => {
      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(() => true)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })

      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`)
        .post(/.*/, (body) => body.elements[0].action === 'ADD')
        .reply(200)

      const response = await testDestination.testAction('updateAudience', {
        event,
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          dmp_user_action: 'ADD'
        }
      })

      expect(response).toBeTruthy()
    })

    it('should set action to "REMOVE" if `dmp_user_action` is "REMOVE"', async () => {
      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(() => true)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })

      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`)
        .post(/.*/, (body) => body.elements[0].action === 'REMOVE')
        .reply(200)

      const response = await testDestination.testAction('updateAudience', {
        event,
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          dmp_user_action: 'REMOVE'
        }
      })

      expect(response).toBeTruthy()
    })

    it('Email comes from properties.email', async () => {
      const eventWithTraits = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          audience_key: 'personas_test_audience',
          email: 'testing@testing.com',
          android_idfa: '123'
        }
      })

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(() => true)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })

      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`)
        .post(/.*/, (body) => body.elements[0].action === 'ADD')
        .reply(200)

      const responses = await testDestination.testAction('updateAudience', {
        event: eventWithTraits,
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          dmp_user_action: 'ADD'
        }
      })

      expect(responses).toBeTruthy()
      expect(responses).toHaveLength(2)
      expect(responses[1].options.body).toMatchInlineSnapshot(
        '"{\\"elements\\":[{\\"action\\":\\"ADD\\",\\"userIds\\":[{\\"idType\\":\\"SHA256_EMAIL\\",\\"idValue\\":\\"584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777\\"},{\\"idType\\":\\"GOOGLE_AID\\",\\"idValue\\":\\"123\\"}]}]}"'
      )
    })

    it('Email is already a SHA256 hash', async () => {
      const eventWithTraits = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          audience_key: 'personas_test_audience',
          email: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777',
          android_idfa: '123'
        }
      })

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(() => true)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })

      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`)
        .post(/.*/, (body) => body.elements[0].action === 'ADD')
        .reply(200)

      const responses = await testDestination.testAction('updateAudience', {
        event: eventWithTraits,
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          dmp_user_action: 'ADD'
        }
      })

      expect(responses).toBeTruthy()
      expect(responses).toHaveLength(2)
      expect(responses[1].options.body).toMatchInlineSnapshot(
        '"{\\"elements\\":[{\\"action\\":\\"ADD\\",\\"userIds\\":[{\\"idType\\":\\"SHA256_EMAIL\\",\\"idValue\\":\\"584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777\\"},{\\"idType\\":\\"GOOGLE_AID\\",\\"idValue\\":\\"123\\"}]}]}"'
      )
    })

    it('Email is already a SHA256 hash with smart hashing flag', async () => {
      const eventWithTraits = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          audience_key: 'personas_test_audience',
          email: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777',
          android_idfa: '123'
        }
      })

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(() => true)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })

      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`)
        .post(/.*/, (body) => body.elements[0].action === 'ADD')
        .reply(200)

      const responses = await testDestination.testAction('updateAudience', {
        event: eventWithTraits,
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          dmp_user_action: 'ADD'
        }
      })

      expect(responses).toBeTruthy()
      expect(responses).toHaveLength(2)
      expect(responses[1].options.body).toMatchInlineSnapshot(
        '"{\\"elements\\":[{\\"action\\":\\"ADD\\",\\"userIds\\":[{\\"idType\\":\\"SHA256_EMAIL\\",\\"idValue\\":\\"584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777\\"},{\\"idType\\":\\"GOOGLE_AID\\",\\"idValue\\":\\"123\\"}]}]}"'
      )
    })

    it('Full payload', async () => {
      const eventWithTraits = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          audience_key: 'personas_test_audience',
          email: 'testing@testing.com',
          first_name: 'John',
          last_name: 'Doe',
          title: 'CEO',
          company: 'Acme',
          country: 'US',
          android_idfa: '123'
        }
      })

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(() => true)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })

      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`)
        .post(/.*/, (body) => body.elements[0].action === 'ADD')
        .reply(200)

      const responses = await testDestination.testAction('updateAudience', {
        event: eventWithTraits,
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          dmp_user_action: 'ADD'
        }
      })

      expect(responses).toBeTruthy()
      expect(responses).toHaveLength(2)
      expect(responses[1].options.body).toMatchInlineSnapshot(
        '"{\\"elements\\":[{\\"action\\":\\"ADD\\",\\"userIds\\":[{\\"idType\\":\\"SHA256_EMAIL\\",\\"idValue\\":\\"584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777\\"},{\\"idType\\":\\"GOOGLE_AID\\",\\"idValue\\":\\"123\\"}],\\"firstName\\":\\"John\\",\\"lastName\\":\\"Doe\\",\\"title\\":\\"CEO\\",\\"company\\":\\"Acme\\",\\"country\\":\\"US\\"}]}"'
      )
    })

    it('should use context.personas.computation_key as source_segment_id when properties.audience_key does not exist', async () => {
      const eventWithComputationKey = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          // No audience_key property
          email: 'testing@testing.com',
          android_idfa: '123'
        },
        context: {
          personas: {
            computation_key: 'from_computation_key' // gitleaks:allow
          }
        }
      })

      const expectedUrlParams = {
        q: 'account',
        account: 'urn:li:sponsoredAccount:123',
        sourceSegmentId: 'from_computation_key', // gitleaks:allow
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(expectedUrlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/).reply(200)

      await expect(
        testDestination.testAction('updateAudience', {
          event: eventWithComputationKey,
          settings: {
            ad_account_id: '123',
            send_email: true,
            send_google_advertising_id: true
          },
          useDefaultMappings: true,
          auth
        })
      ).resolves.not.toThrowError()
    })

    it('should prioritize properties.audience_key over context.personas.computation_key when both exist', async () => {
      const eventWithBothKeys = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          audience_key: 'from_properties_audience_key' // gitleaks:allow
        },
        context: {
          personas: {
            computation_key: 'from_computation_key' // gitleaks:allow
          },
          traits: {
            email: 'testing@testing.com'
          },
          device: {
            advertisingId: '123'
          }
        }
      })

      const expectedUrlParams = {
        q: 'account',
        account: 'urn:li:sponsoredAccount:123',
        sourceSegmentId: 'from_properties_audience_key', // Should use this, not computation_key // gitleaks:allow
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(expectedUrlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: 'USER' }] })
      nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/).reply(200)

      await expect(
        testDestination.testAction('updateAudience', {
          event: eventWithBothKeys,
          settings: {
            ad_account_id: '123',
            send_email: true,
            send_google_advertising_id: true
          },
          useDefaultMappings: true,
          auth
        })
      ).resolves.not.toThrowError()
    })

    it('should use context.personas.computation_key as dmp_segment_name when properties.audience_key does not exist', async () => {
      const eventWithComputationKey = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          // No audience_key property
        },
        context: {
          personas: {
            computation_key: 'from_computation_key' // gitleaks:allow
          },
          traits: {
            email: 'testing@testing.com'
          },
          device: {
            advertisingId: '123'
          }
        }
      })

      const expectedCreateDmpSegmentRequestBody = {
        name: 'from_computation_key', // gitleaks:allow
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM,
        sourceSegmentId: 'from_computation_key', // gitleaks:allow
        account: `urn:li:sponsoredAccount:123`,
        type: 'USER',
        destinations: [
          {
            destination: 'LINKEDIN'
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(() => true)
        .reply(200, { elements: [] })
      nock(`${BASE_URL}/dmpSegments`)
        .post(/.*/, expectedCreateDmpSegmentRequestBody)
        .reply(200, { id: 'new_dmp_segment_id', type: 'USER'} )
      nock(`${BASE_URL}/dmpSegments/new_dmp_segment_id/users`).post(/.*/).reply(200)

      await expect(
        testDestination.testAction('updateAudience', {
          event: eventWithComputationKey,
          settings: {
            ad_account_id: '123',
            send_email: true,
            send_google_advertising_id: true
          },
          useDefaultMappings: true,
          auth
        })
      ).resolves.not.toThrowError()
    })

    it('should prioritize properties.audience_key over context.personas.computation_key for dmp_segment_name when both exist', async () => {
      const eventWithBothKeys = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {
          audience_key: 'from_properties_audience_key' // gitleaks:allow
        },
        context: {
          personas: {
            computation_key: 'from_computation_key' // gitleaks:allow
          },
          traits: {
            email: 'testing@testing.com'
          },
          device: {
            advertisingId: '123'
          }
        }
      })

      const expectedCreateDmpSegmentRequestBody = {
        name: 'from_properties_audience_key', // Should use this, not computation_key // gitleaks:allow
        sourcePlatform: LINKEDIN_SOURCE_PLATFORM,
        sourceSegmentId: 'from_properties_audience_key', // gitleaks:allow
        account: `urn:li:sponsoredAccount:123`,
        type: 'USER',
        destinations: [
          {
            destination: 'LINKEDIN'
          }
        ]
      }

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(() => true)
        .reply(200, { elements: [] })
      nock(`${BASE_URL}/dmpSegments`)
        .post(/.*/, expectedCreateDmpSegmentRequestBody)
        .reply(200, { id: 'new_dmp_segment_id', type: 'USER' } )
      nock(`${BASE_URL}/dmpSegments/new_dmp_segment_id/users`).post(/.*/).reply(200)

      await expect(
        testDestination.testAction('updateAudience', {
          event: eventWithBothKeys,
          settings: {
            ad_account_id: '123',
            send_email: true,
            send_google_advertising_id: true
          },
          useDefaultMappings: true,
          auth
        })
      ).resolves.not.toThrowError()
    })
    
  })

  describe('Error cases', () => {
    it('should fail if both `send_email` and `send_google_advertising_id` settings are set to false', async () => {
      await expect(
        testDestination.testAction('updateAudience', {
          event,
          settings: {
            ad_account_id: '123',
            send_email: false,
            send_google_advertising_id: false
          },
          useDefaultMappings: true,
          auth
        })
      ).rejects.toThrow("At least one of 'Send Email' or 'Send Google Advertising ID' setting fields must be set to 'true'.")
    })

    it('multistatus response should be correct when only failed events - (batch) payload - add only payloads - Segment already exists', async () => {

      const event2 = createTestEvent({
        // Payload with no identifiers - should be a 400 in multistatus response
        event: 'Audience Entered',
        type: 'track',
        properties: {
          //email: "test2@test.com",
          first_name: "Jimbo",
          last_name:"Jones",
          title: "Mr.",
          company: "Widgets Inc",
          country: "US",
          //android_idfa: "IDFA1",
          audience_key: "personas_test_audience",
        }
      })

      const event3 = createTestEvent({
        // Payload with no identifiers - should be a 400 in multistatus response
        event: 'Audience Entered',
        type: 'track',
        properties: {
          //email: "test3@test.com",
          first_name: "Mary",
          last_name:"Contrary",
          title: "Madam",
          company: "Umbrellas co.",
          country: "China",
          //android_idfa: "IDFA2",
          audience_key: "personas_test_audience",
        }
      })

      nock(`${BASE_URL}/dmpSegments`)
        .get(/.*/)
        .query(urlParams)
        .reply(200, { elements: [{ id: 'dmp_segment_id', type: "USER" }] })
      
      const responses = await testDestination.executeBatch('updateAudience', {
        events: [event2,event3],
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        auth,
        mapping: {
          enable_batching: true,
          email: { '@path': '$.properties.email' },
          first_name: { '@path': '$.properties.first_name' },
          last_name: { '@path': '$.properties.last_name' },
          title: { '@path': '$.properties.title' },
          company: { '@path': '$.properties.company' },
          country: { '@path': '$.properties.country' },
          google_advertising_id: { '@path': '$.properties.android_idfa' },
          source_segment_id: { '@path': '$.properties.audience_key' },
          event_name: { '@path': '$.event' },
          dmp_user_action: 'AUTO',
          batch_keys: ['source_segment_id', 'personas_audience_key']
        }
      })

      expect(responses).toMatchObject(
        [
          {
            status: 400,
            errortype: "PAYLOAD_VALIDATION_FAILED",
            errormessage: "At least one of 'User Email' or 'User Google Advertising ID' fields are required. Make sure to enable the 'Send Email' and / or 'Send Google Advertising ID' setting so that the corresponding identifiers are included.",
            errorreporter: "INTEGRATIONS"
          },
          {
            status: 400,
            errortype: "PAYLOAD_VALIDATION_FAILED",
            errormessage: "At least one of 'User Email' or 'User Google Advertising ID' fields are required. Make sure to enable the 'Send Email' and / or 'Send Google Advertising ID' setting so that the corresponding identifiers are included.",
            errorreporter: "INTEGRATIONS"
          }
        ]
       )
    })
  })
})
