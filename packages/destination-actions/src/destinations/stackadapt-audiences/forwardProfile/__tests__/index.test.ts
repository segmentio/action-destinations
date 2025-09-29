import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Definition)
const mockGqlKey = 'test-graphql-key'

const gqlHostUrl = 'https://api.stackadapt.com'
const gqlPath = '/graphql'
const mockEmail = 'admin@stackadapt.com'
const mockUserId = 'user-id'
const mockEmail2 = 'email2@stackadapt.com'
const mockBirthday = '2001-01-02T00:00:00.000Z'
const mockUserId2 = 'user-id2'
const mockAdvertiserId = '23'
const mockMappings = {
  advertiser_id: mockAdvertiserId,
  traits: {
    email: {
      '@path': '$.traits.email'
    },
    birthday: {
      '@path': '$.traits.birthday'
    },
    custom_field: {
      '@path': '$.traits.custom_field'
    },
    number_custom_field: {
      '@path': '$.traits.number_custom_field'
    }
  }
}
const trackMockMappings = {
  advertiser_id: mockAdvertiserId,
  traits: {
    email: {
      '@path': '$.context.traits.email'
    },
    birthday: {
      '@path': '$.context.traits.birthday'
    }
  }
}

const defaultEventPayload: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'identify',
  traits: {
    email: mockEmail,
    birthday: mockBirthday
  }
}

const trackEventPayload: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'track',
  event: 'Track Event Name',

  properties: {
    email: mockEmail,
    birthday: mockBirthday
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
  it('should translate identify into GQL format', async () => {
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
      settings: { apiKey: mockGqlKey, advertiser_id: '<ADVERTISER_ID>' }
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
                advertiserId: <ADVERTISER_ID>,
                externalProvider: "segment_io",
                syncId: "fed8f316f06bb3d93577ba9dc739eb54f39fe4a71a9464735ac41592943a52f5",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"admin@stackadapt.com\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: <ADVERTISER_ID>,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_day",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birth_month",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birth_year",destinationKey:"birth_year",label:"Birth Year",type:NUMBER,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:STRING,isPii:true}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
                  input: {
                    advertiserId: <ADVERTISER_ID>,
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

  it('should translate track into GQL format', async () => {
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
      mapping: trackMockMappings,
      settings: { apiKey: mockGqlKey, advertiser_id: '<ADVERTISER_ID>' }
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
                advertiserId: <ADVERTISER_ID>,
                externalProvider: "segment_io",
                syncId: "fed8f316f06bb3d93577ba9dc739eb54f39fe4a71a9464735ac41592943a52f5",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"admin@stackadapt.com\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: <ADVERTISER_ID>,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_day",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birth_month",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birth_year",destinationKey:"birth_year",label:"Birth Year",type:NUMBER,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:STRING,isPii:true}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
                  input: {
                    advertiserId: <ADVERTISER_ID>,
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
    const events = [createTestEvent(defaultEventPayload), createTestEvent(batchEventPayload)]
    const responses = await testDestination.testBatchAction('forwardProfile', {
      events,
      useDefaultMappings: true,
      mapping: mockMappings,
      settings: { apiKey: mockGqlKey, advertiser_id: '<ADVERTISER_ID>' }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(requestBody).toMatchInlineSnapshot(`
      {
        "query": "mutation {
            upsertProfiles(
              input: {
                advertiserId: <ADVERTISER_ID>,
                externalProvider: "segment_io",
                syncId: "9c71da60c5b1307b6ff2b03383acf168af2bf3cc5490b5de38661a6fda6252ec",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"admin@stackadapt.com\\"},{\\"userId\\":\\"user-id2\\",\\"email\\":\\"email2@stackadapt.com\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: <ADVERTISER_ID>,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_day",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birth_month",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birth_year",destinationKey:"birth_year",label:"Birth Year",type:NUMBER,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:STRING,isPii:true}],
                mappableType: "segment_io"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertExternalAudienceMapping(
                  input: {
                    advertiserId: <ADVERTISER_ID>,
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
