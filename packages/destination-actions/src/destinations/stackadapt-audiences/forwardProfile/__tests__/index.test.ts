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
  context: {
    traits: {
      email: mockEmail,
      birthday: mockBirthday
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
                advertiserId: 23,
                externalProvider: "segment_io",
                syncId: "e6a568a61b0264fb8038ae64dbfb72032f7d1f5b32cf54acbe02979d9312f470",
                profiles: "[{\\"email\\":\\"admin@stackadapt.com\\",\\"userId\\":\\"user-id\\",\\"birthDay\\":1,\\"birthMonth\\":2}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"userId",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"firstName",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"lastName",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"marketingStatus",destinationKey:"marketing_status",label:"Email Marketing Status",type:STRING,isPii:false},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postalCode",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birthDay",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birthMonth",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birthday",destinationKey:"birth_date",label:"Birthday",type:STRING,isPii:true}],
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
                advertiserId: 23,
                externalProvider: "segment_io",
                syncId: "e6a568a61b0264fb8038ae64dbfb72032f7d1f5b32cf54acbe02979d9312f470",
                profiles: "[{\\"email\\":\\"admin@stackadapt.com\\",\\"userId\\":\\"user-id\\",\\"birthDay\\":1,\\"birthMonth\\":2}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"userId",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"firstName",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"lastName",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"marketingStatus",destinationKey:"marketing_status",label:"Email Marketing Status",type:STRING,isPii:false},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postalCode",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birthDay",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birthMonth",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birthday",destinationKey:"birth_date",label:"Birthday",type:STRING,isPii:true}],
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
      settings: { apiKey: mockGqlKey }
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
                syncId: "fab5978d05bc4be0dadaed90eb6372333239e1c0c464a6a62b48d34cbaf676b2",
                profiles: "[{\\"email\\":\\"admin@stackadapt.com\\",\\"userId\\":\\"user-id\\",\\"birthDay\\":1,\\"birthMonth\\":2},{\\"email\\":\\"email2@stackadapt.com\\",\\"customField\\":\\"value\\",\\"numberCustomField\\":123,\\"userId\\":\\"user-id2\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"userId",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"firstName",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"lastName",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"marketingStatus",destinationKey:"marketing_status",label:"Email Marketing Status",type:STRING,isPii:false},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postalCode",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birthDay",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birthMonth",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birthday",destinationKey:"birth_date",label:"Birthday",type:STRING,isPii:true},{incomingKey:"customField",destinationKey:"customField",label:"Custom Field",type:STRING,isPii:false},{incomingKey:"numberCustomField",destinationKey:"numberCustomField",label:"Number Custom Field",type:NUMBER,isPii:false}],
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
      {
        "query": "mutation {
            upsertProfiles(
              input: {
                advertiserId: 23,
                externalProvider: "segment_io",
                syncId: "b9612b9eb0ade5b30e0f474e03e54449e0d108e09306aa1afdf92e2a6267146e",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"previousId\\":\\"user-id2\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"userId",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"firstName",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"lastName",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"marketingStatus",destinationKey:"marketing_status",label:"Email Marketing Status",type:STRING,isPii:false},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postalCode",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birthDay",destinationKey:"birth_day",label:"Birth Day",type:NUMBER,isPii:false},{incomingKey:"birthMonth",destinationKey:"birth_month",label:"Birth Month",type:NUMBER,isPii:false},{incomingKey:"birthday",destinationKey:"birth_date",label:"Birthday",type:STRING,isPii:true}],
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
