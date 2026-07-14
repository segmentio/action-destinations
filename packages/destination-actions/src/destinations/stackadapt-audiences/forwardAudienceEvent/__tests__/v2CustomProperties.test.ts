import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { MarketingStatus } from '../constants'

const testDestination = createTestIntegration(Definition)
const mockGqlKey = 'test-graphql-key'
const gqlHostUrl = 'https://api.stackadapt.com'
const gqlPath = '/graphql'
const mockUserId = 'user-id'
const mockAdvertiserId = '23'
const mockEmail = 'test@email.com'

const basePersonasContext = {
  personas: {
    computation_class: 'audience',
    computation_key: 'first_time_buyer',
    computation_id: 'aud_123'
  }
}

const baseMapping = {
  user_id: { '@path': '$.userId' },
  email: { '@path': '$.traits.email' },
  traits_or_props: { '@path': '$.traits' },
  segment_computation_class: { '@path': '$.context.personas.computation_class' },
  segment_computation_id: { '@path': '$.context.personas.computation_id' },
  segment_computation_key: { '@path': '$.context.personas.computation_key' },
  marketing_status: MarketingStatus.OPT_IN,
  event_type: 'identify',
  enable_batching: true
}

const baseEvent: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'identify',
  traits: {
    email: mockEmail,
    [basePersonasContext.personas.computation_key]: true
  },
  context: basePersonasContext
}

function mockGql() {
  let requestBody: Record<string, unknown> | undefined
  nock(gqlHostUrl)
    .post(gqlPath, (body) => {
      requestBody = body
      return body
    })
    .reply(200, { data: { success: true } })
  return {
    getBody: () => {
      if (!requestBody) throw new Error('Expected the GraphQL request interceptor to have captured a body')
      return requestBody
    }
  }
}

describe('v1 legacy path — documented gap', () => {
  afterEach(() => nock.cleanAll())

  it('omits custom fields from mappingSchemaV2 when all batch payloads have empty custom_traits', async () => {
    // The customer has configured custom_trait_1 as a mapped field, but no event in this
    // batch actually carries that trait. updateFieldsToMapAndFieldTypes finds nothing and
    // the field is absent from the schema — StackAdapt receives an incomplete schema.
    const { getBody } = mockGql()

    const event = createTestEvent({
      ...baseEvent,
      traits: { email: mockEmail, [basePersonasContext.personas.computation_key]: true }
    })

    await testDestination.testBatchAction('forwardAudienceEvent', {
      events: [event, event],
      mapping: {
        ...baseMapping,
        custom_properties_mode: 'v1',
        custom_traits: {
          custom_trait_1: { '@path': '$.traits.custom_trait_1' }
        }
      },
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
    })

    const query: string = getBody().query as string
    expect(query).not.toContain('custom_trait_1')
  })

  it('registers custom fields only when at least one payload in the batch has a value — non-deterministic schema', async () => {
    // Payload 1 has the trait, payload 2 does not. The schema is only complete because
    // payload 1 happened to arrive in this batch. A batch of payload-2-only events would
    // produce a different schema — the problem v2 solves.
    const { getBody } = mockGql()

    const eventWithTrait = createTestEvent({
      ...baseEvent,
      traits: {
        email: mockEmail,
        custom_trait_1: 'value',
        [basePersonasContext.personas.computation_key]: true
      }
    })
    const eventWithoutTrait = createTestEvent({
      ...baseEvent,
      traits: { email: mockEmail, [basePersonasContext.personas.computation_key]: true }
    })

    await testDestination.testBatchAction('forwardAudienceEvent', {
      events: [eventWithTrait, eventWithoutTrait],
      mapping: {
        ...baseMapping,
        custom_properties_mode: 'v1',
        custom_traits: {
          custom_trait_1: { '@path': '$.traits.custom_trait_1' }
        }
      },
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
    })

    const query: string = getBody().query as string
    // custom_trait_1 appears only because payload 1 had a value — not guaranteed
    expect(query).toContain('custom_trait_1')
  })
})

describe('v2 custom_user_properties — deterministic schema', () => {
  afterEach(() => nock.cleanAll())

  it('includes configured field in mappingSchemaV2 even when value is undefined', async () => {
    // Core fix: schema is derived from the configured array items, not runtime values.
    // The field must appear in the schema even when no value is present on any payload.
    const { getBody } = mockGql()

    const event = createTestEvent({
      ...baseEvent,
      traits: { email: mockEmail, [basePersonasContext.personas.computation_key]: true }
    })

    await testDestination.testBatchAction('forwardAudienceEvent', {
      events: [event, event],
      mapping: {
        ...baseMapping,
        custom_properties_mode: 'v2',
        custom_user_properties: [{ name: 'custom_trait_1', type: 'STRING' }]
      },
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
    })

    const query: string = getBody().query as string
    expect(query).toContain('custom_trait_1')
    expect(query).toContain('type:STRING')
  })

  it('uses declared types for all four supported types, not inferred runtime types', async () => {
    const { getBody } = mockGql()

    const event = createTestEvent({
      ...baseEvent,
      traits: {
        email: mockEmail,
        my_string: 'hello',
        my_number: '42',
        my_bool: 'true',
        my_date: '2024-01-15',
        [basePersonasContext.personas.computation_key]: true
      }
    })

    await testDestination.testAction('forwardAudienceEvent', {
      event,
      mapping: {
        ...baseMapping,
        custom_properties_mode: 'v2',
        custom_user_properties: [
          { name: 'my_string', type: 'STRING', value: { '@path': '$.traits.my_string' } },
          { name: 'my_number', type: 'NUMBER', value: { '@path': '$.traits.my_number' } },
          { name: 'my_bool', type: 'BOOLEAN', value: { '@path': '$.traits.my_bool' } },
          { name: 'my_date', type: 'DATE', value: { '@path': '$.traits.my_date' } }
        ]
      },
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
    })

    const query: string = getBody().query as string
    expect(query).toContain('"my_string"')
    expect(query).toContain('"my_number"')
    expect(query).toContain('"my_bool"')
    expect(query).toContain('"my_date"')
    // Types must match the declared type, not the JS type of the value string
    const schemaSection = query.slice(query.indexOf('mappingSchemaV2'), query.indexOf('isOptedIn'))
    expect(schemaSection).toMatch(/incomingKey:"my_string".*?type:STRING/)
    expect(schemaSection).toMatch(/incomingKey:"my_number".*?type:NUMBER/)
    expect(schemaSection).toMatch(/incomingKey:"my_bool".*?type:BOOLEAN/)
    expect(schemaSection).toMatch(/incomingKey:"my_date".*?type:DATE/)
  })

  it('schema is complete for all batches regardless of which payloads have values', async () => {
    // This is the direct fix to the v1 gap: schema comes from config, not runtime values.
    // Even a batch where no payload carries values must produce a complete schema.
    const { getBody } = mockGql()

    const eventWithValue = createTestEvent({
      ...baseEvent,
      traits: {
        email: mockEmail,
        custom_trait_1: 'value',
        [basePersonasContext.personas.computation_key]: true
      }
    })
    const eventWithoutValue = createTestEvent({
      ...baseEvent,
      traits: { email: mockEmail, [basePersonasContext.personas.computation_key]: true }
    })

    await testDestination.testBatchAction('forwardAudienceEvent', {
      events: [eventWithValue, eventWithoutValue],
      mapping: {
        ...baseMapping,
        custom_properties_mode: 'v2',
        custom_user_properties: [
          { name: 'custom_trait_1', type: 'STRING', value: { '@path': '$.traits.custom_trait_1' } }
        ]
      },
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
    })

    const query: string = getBody().query as string
    expect(query).toContain('custom_trait_1')
    expect(query).toContain('type:STRING')
  })

  it('normalizes whitespace so the profile key matches the schema key', async () => {
    // A property name with surrounding whitespace must produce the same (trimmed) key in both
    // the mappingSchemaV2 and the profile payload — otherwise the field is silently dropped.
    const { getBody } = mockGql()

    const event = createTestEvent({
      ...baseEvent,
      traits: {
        email: mockEmail,
        padded: 'padded_value',
        [basePersonasContext.personas.computation_key]: true
      }
    })

    await testDestination.testAction('forwardAudienceEvent', {
      event,
      mapping: {
        ...baseMapping,
        custom_properties_mode: 'v2',
        custom_user_properties: [{ name: '  padded_trait  ', type: 'STRING', value: { '@path': '$.traits.padded' } }]
      },
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
    })

    const query: string = getBody().query as string
    // Schema uses the trimmed key
    expect(query).toContain('incomingKey:"padded_trait"')
    // Profile payload uses the same trimmed key (not the untrimmed '  padded_trait  ')
    const profilesSection = query.slice(query.indexOf('profiles:'), query.indexOf('upsertExternalAudienceMapping'))
    expect(profilesSection).toContain('\\"padded_trait\\":')
    expect(profilesSection).not.toContain('\\"  padded_trait  \\":')
  })

  it('excludes reserved-key-named properties from the mapping schema, not just the profile', async () => {
    // A property whose name clashes with a reserved key must not appear in mappingSchemaV2 either,
    // since it is filtered out of every profile payload.
    const { getBody } = mockGql()

    const event = createTestEvent({
      ...baseEvent,
      traits: {
        email: mockEmail,
        safe_property: 'safe_value',
        [basePersonasContext.personas.computation_key]: true
      }
    })

    await testDestination.testAction('forwardAudienceEvent', {
      event,
      mapping: {
        ...baseMapping,
        custom_properties_mode: 'v2',
        custom_user_properties: [
          { name: 'first_time_buyer', type: 'STRING', value: { '@path': '$.traits.safe_property' } },
          { name: 'safe_property', type: 'STRING', value: { '@path': '$.traits.safe_property' } }
        ]
      },
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
    })

    const query: string = getBody().query as string
    const schemaSection = query.slice(query.indexOf('mappingSchemaV2'), query.indexOf('isOptedIn'))
    expect(schemaSection).toContain('incomingKey:"safe_property"')
    // reserved-key-named property is absent from the schema
    expect(schemaSection).not.toContain('incomingKey:"first_time_buyer"')
  })

  it('filters properties whose name clashes with a reserved key from the profile payload', async () => {
    const { getBody } = mockGql()

    const event = createTestEvent({
      ...baseEvent,
      traits: {
        email: mockEmail,
        safe_property: 'safe_value',
        [basePersonasContext.personas.computation_key]: true
      }
    })

    await testDestination.testAction('forwardAudienceEvent', {
      event,
      mapping: {
        ...baseMapping,
        custom_properties_mode: 'v2',
        custom_user_properties: [
          // name clashes with segment_computation_key value ('first_time_buyer') — must be excluded from profile
          { name: 'first_time_buyer', type: 'STRING', value: { '@path': '$.traits.safe_property' } },
          { name: 'safe_property', type: 'STRING', value: { '@path': '$.traits.safe_property' } }
        ]
      },
      settings: { apiKey: mockGqlKey, advertiser_id: mockAdvertiserId }
    })

    const query: string = getBody().query as string
    const profilesSection = query.slice(query.indexOf('profiles:'), query.indexOf('upsertExternalAudienceMapping'))
    // safe_property appears as a key; first_time_buyer is excluded as a key because it clashes
    // with segment_computation_key (it still legitimately appears as the audienceName value)
    expect(profilesSection).toContain('\\"safe_property\\":')
    expect(profilesSection).not.toContain('\\"first_time_buyer\\":')
  })
})
