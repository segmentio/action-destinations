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
const mockMappings = { advertiser_id: mockAdvertiserId, marketing_status: 'Opted-in' }

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
      settings: { apiKey: mockGqlKey, advertiser_id: '23' }
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
                advertiserId: 23,
                externalProvider: "segment_io",
                syncId: "8263fa76afdf83fef971d53fd842bfb01443859bcc13fe532f96a76ee7573b88",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"test@email.com\\",\\"audienceId\\":\\"aud_123\\",\\"audienceName\\":\\"first_time_buyer\\",\\"action\\":\\"exit\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_day",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birth_month",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birth_year",destinationKey:"birth_year",label:"Birth Year",type:NUMBER,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:STRING,isPii:true},{incomingKey:"marketing_status",destinationKey:"marketing_status",label:"Marketing Status",type:STRING,isPii:false,value:"Opted-in"}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
                  input: {
                    advertiserId: 23,
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
      settings: { apiKey: mockGqlKey, advertiser_id: '23' }
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
                advertiserId: 23,
                externalProvider: "segment_io",
                syncId: "1056ea3bc0def549380da447176d8be240b8cc8cc981f8e3042418d3e6ffef24",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"test@email.com\\",\\"audienceId\\":\\"aud_123\\",\\"audienceName\\":\\"first_time_buyer\\",\\"action\\":\\"enter\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_day",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birth_month",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birth_year",destinationKey:"birth_year",label:"Birth Year",type:NUMBER,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:STRING,isPii:true},{incomingKey:"marketing_status",destinationKey:"marketing_status",label:"Marketing Status",type:STRING,isPii:false,value:"Opted-in"}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
                  input: {
                    advertiserId: 23,
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
      settings: { apiKey: mockGqlKey, advertiser_id: '23' }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(requestBody).toMatchInlineSnapshot(`
      {
        "query": "mutation {
            upsertProfiles(
              input: {
                advertiserId: 23,
                externalProvider: "segment_io",
                syncId: "4fec4aa8bf60271d2d193607c0bf773f3311fa319bb2ab01a89a5834ce592e70",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"test@email.com\\",\\"audienceId\\":\\"aud_123\\",\\"audienceName\\":\\"first_time_buyer\\",\\"action\\":\\"exit\\"},{\\"userId\\":\\"user-id\\",\\"email\\":\\"test@email.com\\",\\"audienceId\\":\\"aud_123\\",\\"audienceName\\":\\"first_time_buyer\\",\\"action\\":\\"enter\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_day",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birth_month",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birth_year",destinationKey:"birth_year",label:"Birth Year",type:NUMBER,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:STRING,isPii:true},{incomingKey:"marketing_status",destinationKey:"marketing_status",label:"Marketing Status",type:STRING,isPii:false,value:"Opted-in"}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
                  input: {
                    advertiserId: 23,
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
