import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, PayloadValidationError } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)

const settings: Settings = {
  sendGridApiKey: 'test-api-key'
}
const addPayload: Partial<SegmentEvent> = {
    context: {  
        personas: {
            external_audience_id: "sg_audience_id_12345",
            computation_class: "audience",
            computation_key: "seg_audience_name_1"
        }
    },
    messageId: "personas_2oRVSlPAneuZQv1r8Sc5VvPnZaV",
    traits: {
        seg_audience_name_1: true,
        email: "testemail@gmail.com",
        external_id: "some_external_id",
        phone: "+353123456789"
    },
    type: "identify",
    userId: "some_user_id",
    anonymousId: "some_anonymous_id"
}
const addPayload2: Partial<SegmentEvent> = {
    ...addPayload, 
    traits: { 
        ...addPayload.traits, 
        email: "testemail2@gmail.com",
        external_id: "some_external_id2",
        phone: "+353123456789"
    },
    userId: "some_user_id2",
    anonymousId: "some_anonymous_id2",

}
const removePayload = {
    ...addPayload, 
    traits: { 
        ...addPayload.traits, 
        seg_audience_name_1: false 
    }
} 
const removePayload2 = {
    ...addPayload2, 
    traits: { 
        ...addPayload2.traits, 
        seg_audience_name_1: false 
    }
} 
const mapping = {
    segment_computation_action: { '@path': '$.context.personas.computation_class' },
    external_audience_id: { '@path': '$.context.personas.external_audience_id' },
    segment_audience_key: { '@path': '$.context.personas.computation_key' },
    traits_or_props: { '@path': '$.traits' },
    email: { '@path': '$.traits.email' },
    anonymous_id: { '@path': '$.anonymousId' },
    external_id: { '@path': '$.traits.external_id' },
    phone_number_id: { '@path': '$.traits.phone' },
    enable_batching: true,
    batch_size: 200
}
const addExpectedPayload = {
    list_ids: ["sg_audience_id_12345"],
    contacts: [
        {
            email: "testemail@gmail.com", 
            external_id: "some_external_id", 
            phone_number_id: "+353123456789", 
            anonymous_id: "some_anonymous_id"
        }  
    ]
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('SendgridAudiences.syncAudience', () => {
  it('should upsert a single Contact and add it to a Sendgrid list correctly', async () => {
    const event = createTestEvent(addPayload)

    nock('https://api.sendgrid.com').put('/v3/marketing/contacts', addExpectedPayload).reply(200, {})
    const responses = await testDestination.testAction('syncAudience', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should upsert a single Contact with just email, and add it to a Sendgrid list correctly', async () => {
    const addPayloadCopy = JSON.parse(JSON.stringify(addPayload))
    
    const addPayloadEmailOnly = {
        ...addPayloadCopy
    }
    delete addPayloadEmailOnly.traits?.external_id
    delete addPayloadEmailOnly.traits?.phone
    addPayloadEmailOnly.anonymousId = undefined

    const addExpectedPayloadEmailOnly = {
        ...addExpectedPayload, 
        contacts: [
            {
                email: "testemail@gmail.com"
            }
        ]
    }

    const event = createTestEvent(addPayloadEmailOnly)

    nock('https://api.sendgrid.com').put('/v3/marketing/contacts', addExpectedPayloadEmailOnly).reply(200, {})
    const responses = await testDestination.testAction('syncAudience', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should upsert multiple Contacts and add them to a Sendgrid list correctly', async () => {

    const events = [createTestEvent(addPayload), createTestEvent(addPayload2)]

    const addBatchExpectedPayload = {   
        list_ids: ["sg_audience_id_12345"],
        contacts: [
            {
                email: "testemail@gmail.com", 
                external_id: "some_external_id", 
                phone_number_id: "+353123456789", 
                anonymous_id: "some_anonymous_id"
            },
            {
                email: "testemail2@gmail.com",
                external_id: "some_external_id2",
                phone_number_id: "+353123456789",
                anonymous_id: "some_anonymous_id2"
            } 
        ]
    }

    nock('https://api.sendgrid.com').put('/v3/marketing/contacts', addBatchExpectedPayload).reply(200, {})
    const responses = await testDestination.testBatchAction('syncAudience', {
        events,
        settings,
        useDefaultMappings: true,
        mapping
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should remove a single Contact from a Sendgrid list correctly', async () => {

    const event = createTestEvent(removePayload)

    const deletePath = `/v3/marketing/lists/sg_audience_id_12345/contacts?contact_ids=contact_1_id`

    const searchQuery = "{\"query\":\"email IN ('testemail@gmail.com') OR phone_number_id IN ('+353123456789') OR external_id IN ('some_external_id') OR anonymous_id IN ('some_anonymous_id')\"}"

    const searchResponse = {
        result: [
            { id: 'contact_1_id' }
        ]
    }

    nock('https://api.sendgrid.com').post('/v3/marketing/contacts/search', searchQuery).reply(200, searchResponse)    

    nock('https://api.sendgrid.com').delete(deletePath).reply(200, {})
    
    const responses = await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
  })

  it('should remove multiple Contacts from a Sendgrid list correctly', async () => {

    const events = [createTestEvent(removePayload), createTestEvent(removePayload2)]

    const deletePath = `/v3/marketing/lists/sg_audience_id_12345/contacts?contact_ids=contact_1_id,contact_2_id`

    const searchQuery = "{\"query\":\"email IN ('testemail@gmail.com','testemail2@gmail.com') OR phone_number_id IN ('+353123456789','+353123456789') OR external_id IN ('some_external_id','some_external_id2') OR anonymous_id IN ('some_anonymous_id','some_anonymous_id2')\"}"

    const searchResponse = {
        result: [
            { id: 'contact_1_id' },
            { id: 'contact_2_id' }
        ]
    }

    nock('https://api.sendgrid.com').post('/v3/marketing/contacts/search', searchQuery).reply(200, searchResponse)    

    nock('https://api.sendgrid.com').delete(deletePath).reply(200, {})
    
    const responses = await testDestination.testBatchAction('syncAudience', {
        events,
        settings,
        useDefaultMappings: true,
        mapping
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
  })

  it('should add and remove multiple Contacts from a Sendgrid list correctly', async () => {

    const events = [createTestEvent(addPayload), createTestEvent(addPayload2), createTestEvent(removePayload), createTestEvent(removePayload2)]

    const deletePath = `/v3/marketing/lists/sg_audience_id_12345/contacts?contact_ids=contact_1_id,contact_2_id`

    const searchQuery = "{\"query\":\"email IN ('testemail@gmail.com','testemail2@gmail.com') OR phone_number_id IN ('+353123456789','+353123456789') OR external_id IN ('some_external_id','some_external_id2') OR anonymous_id IN ('some_anonymous_id','some_anonymous_id2')\"}"

    const searchResponse = {
        result: [
            { id: 'contact_1_id' },
            { id: 'contact_2_id' }
        ]
    }

    const addBatchExpectedPayload = {   
        list_ids: ["sg_audience_id_12345"],
        contacts: [
            {
                email: "testemail@gmail.com", 
                external_id: "some_external_id", 
                phone_number_id: "+353123456789", 
                anonymous_id: "some_anonymous_id"
            },
            {
                email: "testemail2@gmail.com",
                external_id: "some_external_id2",
                phone_number_id: "+353123456789",
                anonymous_id: "some_anonymous_id2"
            } 
        ]
    }

    nock('https://api.sendgrid.com').put('/v3/marketing/contacts', addBatchExpectedPayload).reply(200, {})

    nock('https://api.sendgrid.com').post('/v3/marketing/contacts/search', searchQuery).reply(200, searchResponse)    

    nock('https://api.sendgrid.com').delete(deletePath).reply(200, {})
    
    const responses = await testDestination.testBatchAction('syncAudience', {
        events,
        settings,
        useDefaultMappings: true,
        mapping
    })

    expect(responses.length).toBe(3)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(responses[2].status).toBe(200)
  })

  it('should throw an error if a non batch payload is missing identifiers', async () => {

    const badPayload = JSON.parse(JSON.stringify(addPayload))
    delete badPayload.traits?.email
    delete badPayload.traits?.external_id
    delete badPayload.traits?.phone
    badPayload.anonymousId = null

    const event = createTestEvent(badPayload)
    await expect(
        testDestination.testAction('syncAudience', {
            event,
            settings,
            useDefaultMappings: true,
            mapping
        })
    ).rejects.toThrowError(
      new PayloadValidationError(
        `At least one of email, anonymous_id, external_id or phone_number_id is required`
      )
    )
  })

  it('should throw an error if a all payloads in a batch are invalid', async () => {

    const badPayload = JSON.parse(JSON.stringify(addPayload))
    delete badPayload.traits?.email
    delete badPayload.traits?.external_id
    delete badPayload.traits?.phone
    badPayload.anonymousId = null

    const badPayload2 = JSON.parse(JSON.stringify(badPayload))

    const events = [createTestEvent(badPayload), createTestEvent(badPayload2)]

    await expect(
        testDestination.testBatchAction('syncAudience', {
            events,
            settings,
            useDefaultMappings: true,
            mapping
        })
    ).rejects.toThrowError(
      new PayloadValidationError(
        `No valid payloads found`
      )
    )
  })
})
