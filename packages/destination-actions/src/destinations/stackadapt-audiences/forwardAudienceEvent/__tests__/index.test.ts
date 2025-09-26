import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Definition)
const mockGqlKey = 'test-graphql-key'

const gqlHostUrl = 'https://api.stackadapt.com'
const gqlPath = '/graphql'
const mockUserId = 'user-id'
const mockAdvertiserId = '23'
const mockEmail = 'test@email.com'
const mockMappings = { advertiser_id: mockAdvertiserId }

const defaultEventPayload: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'identify',
  traits: {
    email: mockEmail,
    first_time_buyer: true
  },
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'first_time_buyer',
      computation_id: 'aud_123'
    }
  }
}

const trackEventPayload: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'track',
  event: 'Audience Entered',
  properties: {
    email: mockEmail,
    audience_key: 'first_time_buyer',
    first_time_buyer: true
  },
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'first_time_buyer',
      computation_id: 'aud_123'
    }
  }
}

describe('forwardAudienceEvent', () => {
  it('should translate identify audience entry/exit into GQL format', async () => {
    let requestBody
    nock(gqlHostUrl)
      .post(gqlPath, (body) => {
        requestBody = body
        return body
      })
      .reply(200, { data: { success: true } })
    const event = createTestEvent(defaultEventPayload)
    const responses = await testDestination.testAction('forwardAudienceEvent', {
      event,
      useDefaultMappings: true,
      mapping: mockMappings,
      settings: { apiKey: mockGqlKey }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].request.headers).toMatchInlineSnapshot(`
      Headers {
        Symbol(map): {
          "authorization": [
            "Bearer test-graphql-key",
          ],
          "content-type": [
            "application/json",
          ],
          "user-agent": [
            "Segment (Actions)",
          ],
        },
      }
    `)
    expect(requestBody).toMatchInlineSnapshot(`
      {
        "query": "mutation {
            upsertProfiles(
              input: {
                advertiserId: undefined,
                externalProvider: "segment_io",
                syncId: "92dea893426582fc0d324d55831eb77d3c6d980baf8f18b9126ab258d0aaaa1c",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"audienceId\\":\\"aud_123\\",\\"audienceName\\":\\"first_time_buyer\\",\\"action\\":\\"exit\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: undefined,
                mappingSchemaV2: [{incomingKey:"userId",destinationKey:"external_id",type:STRING,isPii:false,label:"External Profile ID"}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: undefined,
                mappingSchema: [{incomingKey:"audienceId",destinationKey:"external_id",type:STRING,label:"External Audience ID",isPii:false},{incomingKey:"audienceName",destinationKey:"name",type:STRING,label:"External Audience Name",isPii:false}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
          }",
      }
    `)
  })

  it('should translate track audience entry/exit into GQL format', async () => {
    let requestBody
    nock(gqlHostUrl)
      .post(gqlPath, (body) => {
        requestBody = body
        return body
      })
      .reply(200, { data: { success: true } })
    const event = createTestEvent(trackEventPayload)
    const responses = await testDestination.testAction('forwardAudienceEvent', {
      event,
      useDefaultMappings: true,
      mapping: mockMappings,
      settings: { apiKey: mockGqlKey }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].request.headers).toMatchInlineSnapshot(`
      Headers {
        Symbol(map): {
          "authorization": [
            "Bearer test-graphql-key",
          ],
          "content-type": [
            "application/json",
          ],
          "user-agent": [
            "Segment (Actions)",
          ],
        },
      }
    `)
    expect(requestBody).toMatchInlineSnapshot(`
      {
        "query": "mutation {
            upsertProfiles(
              input: {
                advertiserId: undefined,
                externalProvider: "segment_io",
                syncId: "18173ad77a58c56aee5ef6ebde0ff2911b80807f32985ff1e10c03b02cd0b8bc",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"audienceId\\":\\"aud_123\\",\\"audienceName\\":\\"first_time_buyer\\",\\"action\\":\\"enter\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: undefined,
                mappingSchemaV2: [{incomingKey:"userId",destinationKey:"external_id",type:STRING,isPii:false,label:"External Profile ID"}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: undefined,
                mappingSchema: [{incomingKey:"audienceId",destinationKey:"external_id",type:STRING,label:"External Audience ID",isPii:false},{incomingKey:"audienceName",destinationKey:"name",type:STRING,label:"External Audience Name",isPii:false}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
          }",
      }
    `)
  })

  it('should batch multiple profile events into a single request', async () => {
    let requestBody
    nock(gqlHostUrl)
      .post(gqlPath, (body) => {
        requestBody = body
        return body
      })
      .reply(200, { data: { success: true } })
    const events = [createTestEvent(defaultEventPayload), createTestEvent(trackEventPayload)]
    const responses = await testDestination.testBatchAction('forwardAudienceEvent', {
      events,
      useDefaultMappings: true,
      mapping: mockMappings,
      settings: { apiKey: mockGqlKey }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(requestBody).toMatchInlineSnapshot(`
      {
        "query": "mutation {
            upsertProfiles(
              input: {
                advertiserId: undefined,
                externalProvider: "segment_io",
                syncId: "bb034597bb8ca9ff6b1e4cf7919d8bb5920ed6cc5e596238b6bb05a88721e409",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"audienceId\\":\\"aud_123\\",\\"audienceName\\":\\"first_time_buyer\\",\\"action\\":\\"exit\\"},{\\"userId\\":\\"user-id\\",\\"audienceId\\":\\"aud_123\\",\\"audienceName\\":\\"first_time_buyer\\",\\"action\\":\\"enter\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: undefined,
                mappingSchemaV2: [{incomingKey:"userId",destinationKey:"external_id",type:STRING,isPii:false,label:"External Profile ID"}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: undefined,
                mappingSchema: [{incomingKey:"audienceId",destinationKey:"external_id",type:STRING,label:"External Audience ID",isPii:false},{incomingKey:"audienceName",destinationKey:"name",type:STRING,label:"External Audience Name",isPii:false}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
          }",
      }
    `)
  })
})
