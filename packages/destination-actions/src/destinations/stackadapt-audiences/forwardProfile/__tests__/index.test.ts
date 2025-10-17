import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { MarketingStatus } from '../../constants'

const testDestination = createTestIntegration(Definition)
const mockGqlKey = 'test-graphql-key'
const gqlHostUrl = 'https://api.stackadapt.com'
const gqlPath = '/graphql'
const mockUserId = 'user-id'
const mockAdvertiserId = '23'
const mockEmail = 'test@email.com'

const defaultIdentifyPayload: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'identify',
  traits: {
    email: mockEmail,
    first_name: 'Billy',
    last_name: 'Bob',
    phone: '1234567890',
    street: '123 Main St',
    city: 'San Francisco',
    country: 'USA',
    state: 'CA',
    postal_code: '94105',
    timezone: 'PST',
    birth_date: '1990-06-15',
    custom_trait_1: 'custom_value_1',
    custom_trait_2: 'custom_value_2'
  }
}

const mockIdentifyMapping = {
  user_id: { '@path': '$.userId' },
  email: { '@path': '$.traits.email' },
  standard_traits: {
    first_name: { '@path': '$.traits.first_name' },
    last_name: { '@path': '$.traits.last_name' },
    phone: { '@path': '$.traits.phone' },
    address: { '@path': '$.traits.street' },
    city: { '@path': '$.traits.city' },
    country: { '@path': '$.traits.country' },
    state: { '@path': '$.traits.state' },
    postal_code: { '@path': '$.traits.postal_code' },
    timezone: { '@path': '$.traits.timezone' },
    birth_date: { '@path': '$.traits.birth_date' }
  },
  custom_traits: {
    custom_trait_1: { '@path': '$.traits.custom_trait_1' },
    custom_trait_2: { '@path': '$.traits.custom_trait_2' }
  },
  marketing_status: MarketingStatus.OPT_IN,
  event_type: 'identify'
}

const defaultTrackPayload: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'track',
  event: 'Test Track Event',
  properties: {
    email: mockEmail
  },
  context: {
    traits: {
      email: mockEmail,
      first_name: 'Saray',
      last_name: 'James',
      phone: '45678765',
      street: '123 Barn St',
      city: 'NYC',
      country: 'USA',
      state: 'NY',
      postal_code: '29323',
      timezone: 'EST',
      birth_date: '1990-06-15',
      custom_trait_1: 'custom_value_1',
      custom_trait_2: 'custom_value_2'
    }
  }
}

const mockTrackMapping = {
  user_id: { '@path': '$.userId' },
  email: { '@path': '$.context.traits.email' },
  standard_traits: {
    first_name: { '@path': '$.context.traits.first_name' },
    last_name: { '@path': '$.context.traits.last_name' },
    phone: { '@path': '$.context.traits.phone' },
    address: { '@path': '$.context.traits.street' },
    city: { '@path': '$.context.traits.city' },
    country: { '@path': '$.context.traits.country' },
    state: { '@path': '$.context.traits.state' },
    postal_code: { '@path': '$.context.traits.postal_code' },
    timezone: { '@path': '$.context.traits.timezone' },
    birth_date: { '@path': '$.context.traits.birth_date' }
  },
  custom_traits: {
    custom_trait_1: { '@path': '$.traits.custom_trait_1' },
    custom_trait_2: { '@path': '$.traits.custom_trait_2' }
  },
  marketing_status: MarketingStatus.OPT_IN,
  event_type: 'track'
}

const defaultAliasPayload: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'alias',
  previousId: 'previous-id',
  traits: {
    email: mockEmail
  }
}

const mockAliasMapping = {
  user_id: { '@path': '$.userId' },
  email: { '@path': '$.traits.email' },
  previous_id: { '@path': '$.previousId' },
  marketing_status: MarketingStatus.OPT_IN,
  event_type: { '@path': '$.type' }
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
    const event = createTestEvent(defaultIdentifyPayload)
    const responses = await testDestination.testAction('forwardProfile', {
      event,
      useDefaultMappings: true,
      mapping: mockIdentifyMapping,
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
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
                syncId: "d328f826d0bd5a0d0b297ce2c8385edf4d810cdd90b79bb77afe5cd5cffd251a",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"test@email.com\\",\\"first_name\\":\\"Billy\\",\\"last_name\\":\\"Bob\\",\\"phone\\":\\"1234567890\\",\\"address\\":\\"123 Main St\\",\\"city\\":\\"San Francisco\\",\\"country\\":\\"USA\\",\\"state\\":\\"CA\\",\\"postal_code\\":\\"94105\\",\\"timezone\\":\\"PST\\",\\"birth_date\\":\\"1990-06-15\\",\\"custom_trait_1\\":\\"custom_value_1\\",\\"custom_trait_2\\":\\"custom_value_2\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:DATE,isPii:true},{incomingKey:"custom_trait_1",destinationKey:"custom_trait_1",label:"Custom Trait 1",type:STRING,isPii:false},{incomingKey:"custom_trait_2",destinationKey:"custom_trait_2",label:"Custom Trait 2",type:STRING,isPii:false}],
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
    const event = createTestEvent(defaultTrackPayload)
    const responses = await testDestination.testAction('forwardProfile', {
      event,
      useDefaultMappings: true,
      mapping: mockTrackMapping,
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
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
                syncId: "782a40b10afb45dd7194eabe94ce5504a271ff71b501a41f4db71ebb160aa0c3",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"test@email.com\\",\\"first_name\\":\\"Saray\\",\\"last_name\\":\\"James\\",\\"phone\\":\\"45678765\\",\\"address\\":\\"123 Barn St\\",\\"city\\":\\"NYC\\",\\"country\\":\\"USA\\",\\"state\\":\\"NY\\",\\"postal_code\\":\\"29323\\",\\"timezone\\":\\"EST\\",\\"birth_date\\":\\"1990-06-15\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:DATE,isPii:true}],
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
    const events = [createTestEvent(defaultTrackPayload), createTestEvent(defaultTrackPayload)]
    const responses = await testDestination.testBatchAction('forwardProfile', {
      events,
      useDefaultMappings: true,
      mapping: mockTrackMapping,
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
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
                syncId: "7d81f7a1f1170feae1ebb655ac8bb0c92571ce71aa61bd198f1bb9360ae227ef",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"test@email.com\\",\\"first_name\\":\\"Saray\\",\\"last_name\\":\\"James\\",\\"phone\\":\\"45678765\\",\\"address\\":\\"123 Barn St\\",\\"city\\":\\"NYC\\",\\"country\\":\\"USA\\",\\"state\\":\\"NY\\",\\"postal_code\\":\\"29323\\",\\"timezone\\":\\"EST\\",\\"birth_date\\":\\"1990-06-15\\"},{\\"userId\\":\\"user-id\\",\\"email\\":\\"test@email.com\\",\\"first_name\\":\\"Saray\\",\\"last_name\\":\\"James\\",\\"phone\\":\\"45678765\\",\\"address\\":\\"123 Barn St\\",\\"city\\":\\"NYC\\",\\"country\\":\\"USA\\",\\"state\\":\\"NY\\",\\"postal_code\\":\\"29323\\",\\"timezone\\":\\"EST\\",\\"birth_date\\":\\"1990-06-15\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:DATE,isPii:true}],
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

  it('should translate alias into GQL format', async () => {
    let requestBody
    nock(gqlHostUrl)
      .post(gqlPath, (body) => {
        requestBody = body
        return body
      })
      .reply(200, { data: { success: true } })
    const event = createTestEvent(defaultAliasPayload)
    const responses = await testDestination.testAction('forwardProfile', {
      event,
      useDefaultMappings: true,
      mapping: mockAliasMapping,
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
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
                syncId: "73930db5cadbe67450ecbb41719b876acae93434a79fbff5195b4d1cd8f697fe",
                profiles: "[{\\"userId\\":\\"user-id\\",\\"email\\":\\"test@email.com\\",\\"previous_id\\":\\"previous-id\\"}]"
              }
            ) {
              userErrors {
                message
              }
            }
            upsertProfileMapping(
              input: {
                advertiserId: 23,
                mappingSchemaV2: [{incomingKey:"user_id",destinationKey:"external_id",label:"User ID",type:STRING,isPii:false},{incomingKey:"email",destinationKey:"email",label:"Email",type:STRING,isPii:true},{incomingKey:"first_name",destinationKey:"first_name",label:"First Name",type:STRING,isPii:true},{incomingKey:"last_name",destinationKey:"last_name",label:"Last Name",type:STRING,isPii:true},{incomingKey:"phone",destinationKey:"phone",label:"Phone",type:STRING,isPii:true},{incomingKey:"address",destinationKey:"address",label:"Address",type:STRING,isPii:true},{incomingKey:"city",destinationKey:"city",label:"City",type:STRING,isPii:false},{incomingKey:"state",destinationKey:"state",label:"State",type:STRING,isPii:false},{incomingKey:"country",destinationKey:"country",label:"Country",type:STRING,isPii:false},{incomingKey:"postal_code",destinationKey:"postal_code",label:"Postal Code",type:STRING,isPii:false},{incomingKey:"timezone",destinationKey:"timezone",label:"Timezone",type:STRING,isPii:false},{incomingKey:"birth_date",destinationKey:"birth_date",label:"Birth Date",type:DATE,isPii:true}],
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
