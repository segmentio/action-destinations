import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Definition)
const mockGqlKey = 'test-graphql-key'

const gqlHostUrl = 'https://api.stackadapt.com'
const gqlPath = '/graphql-next'
const mockEmail = 'admin@stackadapt.com'
const mockUserId = 'user-id'
const mockEmail2 = 'email2@stackadapt.com'
const mockUserId2 = 'user-id2'
const mockAdvertiserId = '23'
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

const batchEventPayload: Partial<SegmentEvent> = {
  userId: mockUserId2,
  type: 'identify',
  traits: {
    email: mockEmail2,
    custom_field: 'value',
    number_custom_field: 123
  }
}

const aliasEventPayload: Partial<SegmentEvent> = {
  type: 'alias',
  userId: mockUserId,
  previousId: mockUserId2
}

describe('forwardProfile', () => {
  it('should translate identify audience entry/exit into GQL format', async () => {
    let requestBody
    nock(gqlHostUrl)
      .post(gqlPath, (body) => {
        requestBody = body
        return body
      })
      .reply(200, { data: { success: true } })
    const event = createTestEvent(defaultEventPayload)
    const responses = await testDestination.testAction('forwardProfile', {
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
              advertiserId: 23,
              externalProvider: \\"segmentio\\",
              syncId: \\"9e1d2ce099d4f67eea85e3a8e692db14e1e903365304f871c304a1d718cfe28c\\",
              profiles: \\"[{\\\\\\"email\\\\\\":\\\\\\"admin@stackadapt.com\\\\\\",\\\\\\"userId\\\\\\":\\\\\\"user-id\\\\\\",\\\\\\"audienceId\\\\\\":\\\\\\"aud_123\\\\\\",\\\\\\"audienceName\\\\\\":\\\\\\"first_time_buyer\\\\\\",\\\\\\"action\\\\\\":\\\\\\"enter\\\\\\"}]\\"
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incoming_key\\\\\\":\\\\\\"userId\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"is_pii\\\\\\":false}]\\",
                mappableType: \\"segmentio\\",
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incoming_key\\\\\\":\\\\\\"audienceId\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\"},{\\\\\\"incoming_key\\\\\\":\\\\\\"audienceName\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"name\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\"}]\\",
                mappableType: \\"segmentio\\"
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
    const responses = await testDestination.testAction('forwardProfile', {
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
              advertiserId: 23,
              externalProvider: \\"segmentio\\",
              syncId: \\"18173ad77a58c56aee5ef6ebde0ff2911b80807f32985ff1e10c03b02cd0b8bc\\",
              profiles: \\"[{\\\\\\"userId\\\\\\":\\\\\\"user-id\\\\\\",\\\\\\"audienceId\\\\\\":\\\\\\"aud_123\\\\\\",\\\\\\"audienceName\\\\\\":\\\\\\"first_time_buyer\\\\\\",\\\\\\"action\\\\\\":\\\\\\"enter\\\\\\"}]\\"
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incoming_key\\\\\\":\\\\\\"userId\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"is_pii\\\\\\":false}]\\",
                mappableType: \\"segmentio\\",
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incoming_key\\\\\\":\\\\\\"audienceId\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\"},{\\\\\\"incoming_key\\\\\\":\\\\\\"audienceName\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"name\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\"}]\\",
                mappableType: \\"segmentio\\"
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
    const events = [createTestEvent(defaultEventPayload), createTestEvent(batchEventPayload)]
    const responses = await testDestination.testBatchAction('forwardProfile', {
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
              advertiserId: 23,
              externalProvider: \\"segmentio\\",
              syncId: \\"568869a402020aef80f7079205c73a4a5e73b3ecaf2e7e95b47a47f750887ac1\\",
              profiles: \\"[{\\\\\\"email\\\\\\":\\\\\\"admin@stackadapt.com\\\\\\",\\\\\\"userId\\\\\\":\\\\\\"user-id\\\\\\",\\\\\\"audienceId\\\\\\":\\\\\\"aud_123\\\\\\",\\\\\\"audienceName\\\\\\":\\\\\\"first_time_buyer\\\\\\",\\\\\\"action\\\\\\":\\\\\\"enter\\\\\\"},{\\\\\\"email\\\\\\":\\\\\\"email2@stackadapt.com\\\\\\",\\\\\\"customField\\\\\\":\\\\\\"value\\\\\\",\\\\\\"numberCustomField\\\\\\":123,\\\\\\"userId\\\\\\":\\\\\\"user-id2\\\\\\"}]\\"
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incoming_key\\\\\\":\\\\\\"userId\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"is_pii\\\\\\":false},{\\\\\\"incoming_key\\\\\\":\\\\\\"customField\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"customField\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"is_pii\\\\\\":false},{\\\\\\"incoming_key\\\\\\":\\\\\\"numberCustomField\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"numberCustomField\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"number\\\\\\",\\\\\\"is_pii\\\\\\":false}]\\",
                mappableType: \\"segmentio\\",
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incoming_key\\\\\\":\\\\\\"audienceId\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\"},{\\\\\\"incoming_key\\\\\\":\\\\\\"audienceName\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"name\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\"}]\\",
                mappableType: \\"segmentio\\"
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

  it('should translate alias event into GQL format', async () => {
    let requestBody
    nock(gqlHostUrl)
      .post(gqlPath, (body) => {
        requestBody = body
        return body
      })
      .reply(200, { data: { success: true } })
    const event = createTestEvent(aliasEventPayload)
    const responses = await testDestination.testAction('forwardProfile', {
      event,
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
              advertiserId: 23,
              externalProvider: \\"segmentio\\",
              syncId: \\"b9612b9eb0ade5b30e0f474e03e54449e0d108e09306aa1afdf92e2a6267146e\\",
              profiles: \\"[{\\\\\\"userId\\\\\\":\\\\\\"user-id\\\\\\",\\\\\\"previousId\\\\\\":\\\\\\"user-id2\\\\\\"}]\\"
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incoming_key\\\\\\":\\\\\\"userId\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\",\\\\\\"is_pii\\\\\\":false}]\\",
                mappableType: \\"segmentio\\",
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
              input: {
                advertiserId: 23,
                mappingSchema: \\"[{\\\\\\"incoming_key\\\\\\":\\\\\\"audienceId\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"external_id\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\"},{\\\\\\"incoming_key\\\\\\":\\\\\\"audienceName\\\\\\",\\\\\\"destination_key\\\\\\":\\\\\\"name\\\\\\",\\\\\\"data_type\\\\\\":\\\\\\"string\\\\\\"}]\\",
                mappableType: \\"segmentio\\"
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
