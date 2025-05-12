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
const mockMappings = { advertiser_id: mockAdvertiserId }

const defaultEventPayload: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'identify',
  traits: {
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
        Symbol(map): Object {
          "authorization": Array [
            "Bearer test-graphql-key",
          ],
          "content-type": Array [
            "application/json",
          ],
          "user-agent": Array [
            "Segment (Actions)",
          ],
        },
      }
    `)
    expect(requestBody).toMatchInlineSnapshot(`
      Object {
        "query": "mutation {
            upsertProfiles(
              input: {
                advertiserId: 23,
                externalProvider: \\"SEGMENT_IO\\",
                syncId: \\"18173ad77a58c56aee5ef6ebde0ff2911b80807f32985ff1e10c03b02cd0b8bc\\",
                profiles: \\"[{\\\\\\"userId\\\\\\":\\\\\\"user-id\\\\\\",\\\\\\"audienceId\\\\\\":\\\\\\"aud_123\\\\\\",\\\\\\"audienceName\\\\\\":\\\\\\"first_time_buyer\\\\\\",\\\\\\"action\\\\\\":\\\\\\"enter\\\\\\"}]\\"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{\\\\\\"incomingKey\\\\\\":\\\\\\"userId\\\\\\",\\\\\\"destinationKey\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"isPii\\\\\\":false,\\\\\\"label\\\\\\":\\\\\\"External Profile ID\\\\\\"}],
                mappableType: \\"SEGMENT_IO\\",
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incomingKey\\\\\\":\\\\\\"audienceId\\\\\\",\\\\\\"destinationKey\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"label\\\\\\":\\\\\\"External Audience ID\\\\\\"},{\\\\\\"incomingKey\\\\\\":\\\\\\"audienceName\\\\\\",\\\\\\"destinationKey\\\\\\":\\\\\\"name\\\\\\",\\\\\\"type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"label\\\\\\":\\\\\\"External Audience Name\\\\\\"}]\\",
                mappableType: \\"SEGMENT_IO\\"
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
        Symbol(map): Object {
          "authorization": Array [
            "Bearer test-graphql-key",
          ],
          "content-type": Array [
            "application/json",
          ],
          "user-agent": Array [
            "Segment (Actions)",
          ],
        },
      }
    `)
    expect(requestBody).toMatchInlineSnapshot(`
      Object {
        "query": "mutation {
            upsertProfiles(
              input: {
                advertiserId: 23,
                externalProvider: \\"SEGMENT_IO\\",
                syncId: \\"18173ad77a58c56aee5ef6ebde0ff2911b80807f32985ff1e10c03b02cd0b8bc\\",
                profiles: \\"[{\\\\\\"userId\\\\\\":\\\\\\"user-id\\\\\\",\\\\\\"audienceId\\\\\\":\\\\\\"aud_123\\\\\\",\\\\\\"audienceName\\\\\\":\\\\\\"first_time_buyer\\\\\\",\\\\\\"action\\\\\\":\\\\\\"enter\\\\\\"}]\\"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{\\\\\\"incomingKey\\\\\\":\\\\\\"userId\\\\\\",\\\\\\"destinationKey\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"isPii\\\\\\":false,\\\\\\"label\\\\\\":\\\\\\"External Profile ID\\\\\\"}],
                mappableType: \\"SEGMENT_IO\\",
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incomingKey\\\\\\":\\\\\\"audienceId\\\\\\",\\\\\\"destinationKey\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"label\\\\\\":\\\\\\"External Audience ID\\\\\\"},{\\\\\\"incomingKey\\\\\\":\\\\\\"audienceName\\\\\\",\\\\\\"destinationKey\\\\\\":\\\\\\"name\\\\\\",\\\\\\"type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"label\\\\\\":\\\\\\"External Audience Name\\\\\\"}]\\",
                mappableType: \\"SEGMENT_IO\\"
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
      Object {
        "query": "mutation {
            upsertProfiles(
              input: {
                advertiserId: 23,
                externalProvider: \\"SEGMENT_IO\\",
                syncId: \\"c371022fd0a74b3ff0376ee0a8838c0e7d21be220ba335bfdd7205bca9545bd3\\",
                profiles: \\"[{\\\\\\"userId\\\\\\":\\\\\\"user-id\\\\\\",\\\\\\"audienceId\\\\\\":\\\\\\"aud_123\\\\\\",\\\\\\"audienceName\\\\\\":\\\\\\"first_time_buyer\\\\\\",\\\\\\"action\\\\\\":\\\\\\"enter\\\\\\"},{\\\\\\"userId\\\\\\":\\\\\\"user-id\\\\\\",\\\\\\"audienceId\\\\\\":\\\\\\"aud_123\\\\\\",\\\\\\"audienceName\\\\\\":\\\\\\"first_time_buyer\\\\\\",\\\\\\"action\\\\\\":\\\\\\"enter\\\\\\"}]\\"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{\\\\\\"incomingKey\\\\\\":\\\\\\"userId\\\\\\",\\\\\\"destinationKey\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"isPii\\\\\\":false,\\\\\\"label\\\\\\":\\\\\\"External Profile ID\\\\\\"}],
                mappableType: \\"SEGMENT_IO\\",
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incomingKey\\\\\\":\\\\\\"audienceId\\\\\\",\\\\\\"destinationKey\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"label\\\\\\":\\\\\\"External Audience ID\\\\\\"},{\\\\\\"incomingKey\\\\\\":\\\\\\"audienceName\\\\\\",\\\\\\"destinationKey\\\\\\":\\\\\\"name\\\\\\",\\\\\\"type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"label\\\\\\":\\\\\\"External Audience Name\\\\\\"}]\\",
                mappableType: \\"SEGMENT_IO\\"
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
