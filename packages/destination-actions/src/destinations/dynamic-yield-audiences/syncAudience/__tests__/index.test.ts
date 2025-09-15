import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { DynamicYieldRequestJSON } from '../types'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Destination)

const audienceSettings = {
  audience_name: "test-audience",
  identifier_type: "email",
  dy_identifier_type: "externalid"
}

const addToAudienceTrackPayload = createTestEvent({
  type: 'track',
  userId: "userId1",
  anonymousId:"anonymousId1",
  messageId: "messageid1",
  timestamp: "2021-07-12T23:02:40.563Z",
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'dy_segment_test',
      computation_id: 'dy_segment_audience_id',
      external_audience_id: "11122233344455", // This must be convertable to a number
      audience_settings: audienceSettings
    },
    traits: {
      email: 'test@email.com'
    }
  },
  properties: {
    audience_key: 'dy_segment_test',
    dy_segment_test: true
  }
})

const settings = {
  sectionId: 'test-section-id',
  dataCenter: 'com',
  accessKey: 'test-access-key'
}

const mapping = {
  message_id: {
    '@path': '$.messageId'
  },
  timestamp: {
    '@path': '$.timestamp'
  },
  external_audience_id: {
    '@path': '$.context.personas.external_audience_id'
  },
  segment_audience_key: {
    '@path': '$.context.personas.computation_key'
  },
  traits_or_props: {'@path': '$.properties' },
  segment_computation_action: {
    '@path': '$.context.personas.computation_class'
  },
  email: {
    '@if': {
      exists: { '@path': '$.traits.email' },
      then: { '@path': '$.traits.email' },
      else: { '@path': '$.context.traits.email' }
    }
  },
  anonymousId: { '@path': '$.anonymousId' },
  userId: { '@path': '$.userId' }
}

const baseURL = "https://cdp-extensions-api.dev-use1.dynamicyield.com"
const path = "/cdp/segment/audiences/membership-change"

const header = {
  "authorization": "mock-secret-DEV",
  "content-type": "application/json",
  "user-agent": "Segment (Actions)",
  "accept": "*/*",
  "content-length": "469",
  "accept-encoding": "gzip,deflate",
  "connection": "close"
}

describe('DynamicYieldAudiences.syncAudience', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    testDestination = createTestIntegration(Destination)
    nock.disableNetConnect()
    jest.resetAllMocks()
    jest.resetModules()
    process.env = { ...OLD_ENV }
    process.env.ACTIONS_DYNAMIC_YIELD_AUDIENCES_US_CLIENT_SECRET = "mock-secret-US"
    process.env.ACTIONS_DYNAMIC_YIELD_AUDIENCES_EU_CLIENT_SECRET = "mock-secret-EU"
    process.env.ACTIONS_DYNAMIC_YIELD_AUDIENCES_DEV_CLIENT_SECRET = "mock-secret-DEV"
  })

  afterEach(() => {
    nock.enableNetConnect()
    process.env = OLD_ENV
    nock.cleanAll()
  })

  describe('Should throw an error', () => {
    it('if audience creation event missing mandatory field', async () => {
      const badEvent = createTestEvent({
        context: {
          personas: {
            computation_key: 'dy_segment_test'
          },
          traits: {
            email: 'test@email.com'
          }
        },
        properties: {
          audience_key: 'dy_segment_test',
          dy_segment_test: true
        }
      })

      await expect(
        testDestination.testAction('syncAudience', {
          event: badEvent,
          useDefaultMappings: true,
          settings: settings as Settings
        })
      ).rejects.toThrowError("The root value is missing the required field 'segment_computation_action'")
    })
  })

  describe('Should add a user to an audience', () => {
    it('where Segment ID type is email but DY ID type is externalid', async () => {
      const payload = JSON.parse(JSON.stringify(addToAudienceTrackPayload))
      
      const event = createTestEvent(payload as Partial<SegmentEvent>)

      const json: DynamicYieldRequestJSON = {
        type: "audience_membership_change_request",
        id: "messageid1",
        timestamp_ms: 1626130960563,
        account: {
          account_settings: {
            sectionId: "test-section-id",
            identifier: "externalid",
            connectionKey: "test-access-key"
          }
        },
        user_profiles: [
          {
            user_identities: [
              {
                type: "externalid",
                encoding: "\"sha-256\"",
                value: "73062d872926c2a556f17b36f50e328ddf9bff9d403939bd14b6c3b7f5a33fc2"
              }
            ],
            audiences: [
              {
                audience_id: 11122233344455,
                audience_name: "test-audience",
                action: "add"
              }
            ]
          }
        ]
      }

      nock(baseURL, { reqheaders: header })
        .post(path, json as any)
        .reply(200)

      const responses = await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(1)
    })

    it('where Segment ID type is email an DY ID type undefined', async () => {
      const payload = JSON.parse(JSON.stringify(addToAudienceTrackPayload))
      delete payload?.context?.personas.audience_settings.dy_identifier_type
      const event = createTestEvent(payload as Partial<SegmentEvent>)

      const json = {
        type: "audience_membership_change_request",
        id: "messageid1",
        timestamp_ms: 1626130960563,
        account: {
          account_settings: {
            sectionId: "test-section-id",
            identifier: "email",
            connectionKey: "test-access-key"
          }
        },
        user_profiles: [
          {
            user_identities: [
              {
                type: "email",
                encoding: "\"sha-256\"",
                value: "73062d872926c2a556f17b36f50e328ddf9bff9d403939bd14b6c3b7f5a33fc2"
              }
            ],
            audiences: [
              {
                audience_id: 11122233344455,
                audience_name: "test-audience",
                action: "add"
              }
            ]
          }
        ]
      }

      nock(baseURL, { reqheaders: { ...header,   "content-length": "459"} })
        .post(path, json)
        .reply(200)

      const responses = await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(1)
    })
    
    it('where Segment ID type is userId an DY ID type undefined', async () => {
     
      const payload = JSON.parse(JSON.stringify(addToAudienceTrackPayload))
      delete payload?.context?.personas.audience_settings.dy_identifier_type
      payload.context.personas.audience_settings.identifier_type = "userid"

      const event = createTestEvent(payload as Partial<SegmentEvent>)

      const json = {
        type: "audience_membership_change_request",
        id: "messageid1",
        timestamp_ms: 1626130960563,
        account: {
          account_settings: {
            sectionId: "test-section-id",
            identifier: "userid",
            connectionKey: "test-access-key"
          }
        },
        user_profiles: [
          {
            user_identities: [
              {
                type: "userid",
                encoding: "raw",
                value: "userId1"
              }
            ],
            audiences: [
              {
                audience_id: 11122233344455,
                audience_name: "test-audience",
                action: "add"
              }
            ]
          }
        ]
      }

      nock(baseURL, { reqheaders: { ...header,   "content-length": "396"} })
        .post(path, json)
        .reply(200)

      const responses = await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(1)
    })
  })

  describe('Should remove a user from an audience', () => {

    it('where Segment ID type is email an DY ID type undefined', async () => {
     
      const payload = JSON.parse(JSON.stringify(addToAudienceTrackPayload))
      payload.properties.dy_segment_test = false
      delete payload?.context?.personas.audience_settings.dy_identifier_type

      const event = createTestEvent(payload as Partial<SegmentEvent>)

      const json = {
        type: "audience_membership_change_request",
        id: "messageid1",
        timestamp_ms: 1626130960563,
        account: {
          account_settings: {
            sectionId: "test-section-id",
            identifier: "email",
            connectionKey: "test-access-key"
          }
        },
        user_profiles: [
          {
            user_identities: [
              {
                type: "email",
                encoding: "\"sha-256\"",
                value: "73062d872926c2a556f17b36f50e328ddf9bff9d403939bd14b6c3b7f5a33fc2"
              }
            ],
            audiences: [
              {
                audience_id: 11122233344455,
                audience_name: "test-audience",
                action: "delete"
              }
            ]
          }
        ]
      }

      nock(baseURL, { reqheaders: { ...header,   "content-length": "462"} })
        .post(path, json)
        .reply(200)

      const responses = await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(responses.length).toBe(1)
    })
    
  })
})
