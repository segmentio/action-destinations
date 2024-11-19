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
      external_audience_id: 'sg_audience_id_12345',
      computation_class: 'audience',
      computation_key: 'seg_audience_name_1'
    }
  },
  messageId: 'personas_2oRVSlPAneuZQv1r8Sc5VvPnZaV',
  traits: {
    seg_audience_name_1: true,
    email: 'testemail@gmail.com',
    external_id: 'some_external_id',
    phone: '+353123456789'
  },
  type: 'identify',
  userId: 'some_user_id',
  anonymousId: 'some_anonymous_id'
}
const addPayload2: Partial<SegmentEvent> = {
  ...addPayload,
  traits: {
    ...addPayload.traits,
    email: 'testemail2@gmail.com',
    external_id: 'some_external_id2',
    phone: '+353123456789'
  },
  userId: 'some_user_id2',
  anonymousId: 'some_anonymous_id2'
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
  user_attributes: {
    first_name: { '@path': '$.traits.first_name' },
    last_name: { '@path': '$.traits.last_name' },
    address_line_1: { '@path': '$.traits.street' },
    address_line_2: { '@path': '$.traits.address_line_2' },
    city: { '@path': '$.traits.city' },
    state_province_region: { '@path': '$.traits.state' },
    country: { '@path': '$.traits.country' },
    postal_code: { '@path': '$.traits.postal_code' }
  },
  custom_fields: { '@path': '$.traits.custom_fields' },
  enable_batching: true,
  batch_size: 200
}
const addExpectedPayload = {
  list_ids: ['sg_audience_id_12345'],
  contacts: [
    {
      email: 'testemail@gmail.com',
      external_id: 'some_external_id',
      phone_number_id: '+353123456789',
      anonymous_id: 'some_anonymous_id'
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

  it('should upsert a single Contact with user attributes and custom fields, and add it to a Sendgrid list correctly', async () => { 
    const event = createTestEvent({ 
      ...addPayload, 
      traits: { 
        ...addPayload.traits, 
        first_name: 'fname', 
        last_name: 'lname', 
        street: '123 Main St',
        address_line_2: 123456, // should be stringified
        city: 'SF', 
        state: 'CA',
        country: 'US',
        postal_code: "N88EU",
        custom_fields: {
          custom_field_1: 'custom_field_1_value',
          custom_field_2: 2345,
          custom_field_3: '2024-01-01T00:00:00.000Z',
          custom_field_4: false, // should be removed 
          custom_field_5: null // should be removed
        }
      } 
    })

    const addExpectedPayloadWithAttributes = {
      ...addExpectedPayload,
      contacts: [
        {
          email: 'testemail@gmail.com',
          external_id: 'some_external_id',
          phone_number_id: '+353123456789',
          anonymous_id: 'some_anonymous_id',
          first_name: 'fname',
          last_name: 'lname',
          address_line_1: '123 Main St',
          address_line_2: '123456',
          city: 'SF', 
          state_province_region: 'CA',
          country: 'US',
          postal_code: "N88EU",
          custom_fields: {
            custom_field_1: 'custom_field_1_value',
            custom_field_2: 2345,
            custom_field_3: '2024-01-01T00:00:00.000Z'
          }
        }
      ]
    }

    nock('https://api.sendgrid.com').put('/v3/marketing/contacts', addExpectedPayloadWithAttributes).reply(200, {})
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
          email: 'testemail@gmail.com'
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
      list_ids: ['sg_audience_id_12345'],
      contacts: [
        {
          email: 'testemail@gmail.com',
          external_id: 'some_external_id',
          phone_number_id: '+353123456789',
          anonymous_id: 'some_anonymous_id'
        },
        {
          email: 'testemail2@gmail.com',
          external_id: 'some_external_id2',
          phone_number_id: '+353123456789',
          anonymous_id: 'some_anonymous_id2'
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

    const searchQuery =
      "{\"query\":\"email IN ('testemail@gmail.com') OR phone_number_id IN ('+353123456789') OR external_id IN ('some_external_id') OR anonymous_id IN ('some_anonymous_id')\"}"

    const searchResponse = {
      result: [{ id: 'contact_1_id' }]
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

    const searchQuery =
      "{\"query\":\"email IN ('testemail@gmail.com','testemail2@gmail.com') OR phone_number_id IN ('+353123456789','+353123456789') OR external_id IN ('some_external_id','some_external_id2') OR anonymous_id IN ('some_anonymous_id','some_anonymous_id2')\"}"

    const searchResponse = {
      result: [{ id: 'contact_1_id' }, { id: 'contact_2_id' }]
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
    const events = [
      createTestEvent(addPayload),
      createTestEvent(addPayload2),
      createTestEvent(removePayload),
      createTestEvent(removePayload2)
    ]

    const deletePath = `/v3/marketing/lists/sg_audience_id_12345/contacts?contact_ids=contact_1_id,contact_2_id`

    const searchQuery =
      "{\"query\":\"email IN ('testemail@gmail.com','testemail2@gmail.com') OR phone_number_id IN ('+353123456789','+353123456789') OR external_id IN ('some_external_id','some_external_id2') OR anonymous_id IN ('some_anonymous_id','some_anonymous_id2')\"}"

    const searchResponse = {
      result: [{ id: 'contact_1_id' }, { id: 'contact_2_id' }]
    }

    const addBatchExpectedPayload = {
      list_ids: ['sg_audience_id_12345'],
      contacts: [
        {
          email: 'testemail@gmail.com',
          external_id: 'some_external_id',
          phone_number_id: '+353123456789',
          anonymous_id: 'some_anonymous_id'
        },
        {
          email: 'testemail2@gmail.com',
          external_id: 'some_external_id2',
          phone_number_id: '+353123456789',
          anonymous_id: 'some_anonymous_id2'
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

  it('should retry upserting to add Contacts after Sendgrid initially rejects some emails', async () => {
    const badPayload = JSON.parse(JSON.stringify(addPayload))
    badPayload.traits.email = 'not_a_valid_email_address@gmail.com'
    delete badPayload.traits?.external_id
    delete badPayload.traits?.phone
    badPayload.anonymousId = null

    const events = [createTestEvent(addPayload), createTestEvent(badPayload)]

    const addBatchExpectedPayload = {
      list_ids: ['sg_audience_id_12345'],
      contacts: [
        {
          email: 'testemail@gmail.com',
          external_id: 'some_external_id',
          phone_number_id: '+353123456789',
          anonymous_id: 'some_anonymous_id'
        },
        {
          email: 'not_a_valid_email_address@gmail.com' // technically this is a valid email, but the first mock response will mark it as invalid for test purposes
        }
      ]
    }

    const addBatchExpectedPayload2 = {
      list_ids: ['sg_audience_id_12345'],
      contacts: [
        {
          email: 'testemail@gmail.com',
          external_id: 'some_external_id',
          phone_number_id: '+353123456789',
          anonymous_id: 'some_anonymous_id'
        }
      ]
    }

    const responseError = {
      status: 400,
      errors: [
        {
          field: 'contacts[0].identifier',
          message: "email 'not_a_valid_email_address@gmail.com' is not valid" // mark the email as invalid so that it is removed from the next request payload
        }
      ]
    }

    nock('https://api.sendgrid.com').put('/v3/marketing/contacts', addBatchExpectedPayload).reply(400, responseError)
    nock('https://api.sendgrid.com').put('/v3/marketing/contacts', addBatchExpectedPayload2).reply(200, {})

    const responses = await testDestination.testBatchAction('syncAudience', {
      events,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(400)
    expect(responses[1].status).toBe(200)
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
      new PayloadValidationError(`At least one of email, anonymous_id, external_id or phone_number_id is required`)
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
    ).rejects.toThrowError(new PayloadValidationError(`No valid payloads found`))
  })

  it('should do multiple search and a single remove request for large batch with many identifiers but less than 100 contacts', async () => {
    const payloads = Array.from({ length: 30 }, (_, i) => ({
      ...JSON.parse(JSON.stringify(removePayload)),
      traits: {
        ...JSON.parse(JSON.stringify(removePayload.traits)),
        email: `test${i + 1}@gmail.com`,
        external_id: `some_external_id_${i + 1}`,
        phone: `+35312345678${i + 1}`
      },
      anonymousId: `some_anonymous_id_${i + 1}`
    }))

    const events = payloads.map(createTestEvent)

    const searchQuery =
      "{\"query\":\"email IN ('test1@gmail.com','test2@gmail.com','test3@gmail.com','test4@gmail.com','test5@gmail.com','test6@gmail.com','test7@gmail.com','test8@gmail.com','test9@gmail.com','test10@gmail.com','test11@gmail.com','test12@gmail.com') OR phone_number_id IN ('+353123456781','+353123456782','+353123456783','+353123456784','+353123456785','+353123456786','+353123456787','+353123456788','+353123456789','+3531234567810','+3531234567811','+3531234567812') OR external_id IN ('some_external_id_1','some_external_id_2','some_external_id_3','some_external_id_4','some_external_id_5','some_external_id_6','some_external_id_7','some_external_id_8','some_external_id_9','some_external_id_10','some_external_id_11','some_external_id_12') OR anonymous_id IN ('some_anonymous_id_1','some_anonymous_id_2','some_anonymous_id_3','some_anonymous_id_4','some_anonymous_id_5','some_anonymous_id_6','some_anonymous_id_7','some_anonymous_id_8','some_anonymous_id_9','some_anonymous_id_10','some_anonymous_id_11','some_anonymous_id_12')\"}"
    const searchQuery2 =
      "{\"query\":\"email IN ('test13@gmail.com','test14@gmail.com','test15@gmail.com','test16@gmail.com','test17@gmail.com','test18@gmail.com','test19@gmail.com','test20@gmail.com','test21@gmail.com','test22@gmail.com','test23@gmail.com','test24@gmail.com') OR phone_number_id IN ('+3531234567813','+3531234567814','+3531234567815','+3531234567816','+3531234567817','+3531234567818','+3531234567819','+3531234567820','+3531234567821','+3531234567822','+3531234567823','+3531234567824') OR external_id IN ('some_external_id_13','some_external_id_14','some_external_id_15','some_external_id_16','some_external_id_17','some_external_id_18','some_external_id_19','some_external_id_20','some_external_id_21','some_external_id_22','some_external_id_23','some_external_id_24') OR anonymous_id IN ('some_anonymous_id_13','some_anonymous_id_14','some_anonymous_id_15','some_anonymous_id_16','some_anonymous_id_17','some_anonymous_id_18','some_anonymous_id_19','some_anonymous_id_20','some_anonymous_id_21','some_anonymous_id_22','some_anonymous_id_23','some_anonymous_id_24')\"}"
    const searchQuery3 =
      "{\"query\":\"email IN ('test25@gmail.com','test26@gmail.com','test27@gmail.com','test28@gmail.com','test29@gmail.com','test30@gmail.com') OR phone_number_id IN ('+3531234567825','+3531234567826','+3531234567827','+3531234567828','+3531234567829','+3531234567830') OR external_id IN ('some_external_id_25','some_external_id_26','some_external_id_27','some_external_id_28','some_external_id_29','some_external_id_30') OR anonymous_id IN ('some_anonymous_id_25','some_anonymous_id_26','some_anonymous_id_27','some_anonymous_id_28','some_anonymous_id_29','some_anonymous_id_30')\"}"

    const searchResponse = { result: Array.from({ length: 12 }, (_, i) => ({ id: `contact_${i + 1}_id` })) }
    const searchResponse2 = { result: Array.from({ length: 12 }, (_, i) => ({ id: `contact_${i + 13}_id` })) }
    const searchResponse3 = { result: Array.from({ length: 6 }, (_, i) => ({ id: `contact_${i + 25}_id` })) }

    const deletePath = `/v3/marketing/lists/sg_audience_id_12345/contacts?contact_ids=contact_1_id,contact_2_id,contact_3_id,contact_4_id,contact_5_id,contact_6_id,contact_7_id,contact_8_id,contact_9_id,contact_10_id,contact_11_id,contact_12_id,contact_13_id,contact_14_id,contact_15_id,contact_16_id,contact_17_id,contact_18_id,contact_19_id,contact_20_id,contact_21_id,contact_22_id,contact_23_id,contact_24_id,contact_25_id,contact_26_id,contact_27_id,contact_28_id,contact_29_id,contact_30_id`

    nock('https://api.sendgrid.com').post('/v3/marketing/contacts/search', searchQuery).reply(200, searchResponse)
    nock('https://api.sendgrid.com').post('/v3/marketing/contacts/search', searchQuery2).reply(200, searchResponse2)
    nock('https://api.sendgrid.com').post('/v3/marketing/contacts/search', searchQuery3).reply(200, searchResponse3)

    nock('https://api.sendgrid.com').delete(deletePath).reply(200, {})

    const responses = await testDestination.testBatchAction('syncAudience', {
      events,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(4)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(responses[2].status).toBe(200)
    expect(responses[3].status).toBe(200)
  })

  it('should do multiple search and a multiple remove requests for large batch with many identifiers and more than 100 contacts', async () => {
    const payloads = Array.from({ length: 120 }, (_, i) => ({
      ...JSON.parse(JSON.stringify(removePayload)),
      traits: {
        ...JSON.parse(JSON.stringify(removePayload.traits)),
        email: `test${i + 1}@gmail.com`,
        external_id: null,
        phone: null
      },
      anonymousId: null
    }))

    const events = payloads.map(createTestEvent)

    const searchQuery =
      "{\"query\":\"email IN ('test1@gmail.com','test2@gmail.com','test3@gmail.com','test4@gmail.com','test5@gmail.com','test6@gmail.com','test7@gmail.com','test8@gmail.com','test9@gmail.com','test10@gmail.com','test11@gmail.com','test12@gmail.com','test13@gmail.com','test14@gmail.com','test15@gmail.com','test16@gmail.com','test17@gmail.com','test18@gmail.com','test19@gmail.com','test20@gmail.com','test21@gmail.com','test22@gmail.com','test23@gmail.com','test24@gmail.com','test25@gmail.com','test26@gmail.com','test27@gmail.com','test28@gmail.com','test29@gmail.com','test30@gmail.com','test31@gmail.com','test32@gmail.com','test33@gmail.com','test34@gmail.com','test35@gmail.com','test36@gmail.com','test37@gmail.com','test38@gmail.com','test39@gmail.com','test40@gmail.com','test41@gmail.com','test42@gmail.com','test43@gmail.com','test44@gmail.com','test45@gmail.com','test46@gmail.com','test47@gmail.com','test48@gmail.com','test49@gmail.com','test50@gmail.com')\"}"
    const searchQuery2 =
      "{\"query\":\"email IN ('test51@gmail.com','test52@gmail.com','test53@gmail.com','test54@gmail.com','test55@gmail.com','test56@gmail.com','test57@gmail.com','test58@gmail.com','test59@gmail.com','test60@gmail.com','test61@gmail.com','test62@gmail.com','test63@gmail.com','test64@gmail.com','test65@gmail.com','test66@gmail.com','test67@gmail.com','test68@gmail.com','test69@gmail.com','test70@gmail.com','test71@gmail.com','test72@gmail.com','test73@gmail.com','test74@gmail.com','test75@gmail.com','test76@gmail.com','test77@gmail.com','test78@gmail.com','test79@gmail.com','test80@gmail.com','test81@gmail.com','test82@gmail.com','test83@gmail.com','test84@gmail.com','test85@gmail.com','test86@gmail.com','test87@gmail.com','test88@gmail.com','test89@gmail.com','test90@gmail.com','test91@gmail.com','test92@gmail.com','test93@gmail.com','test94@gmail.com','test95@gmail.com','test96@gmail.com','test97@gmail.com','test98@gmail.com','test99@gmail.com','test100@gmail.com')\"}"
    const searchQuery3 =
      "{\"query\":\"email IN ('test101@gmail.com','test102@gmail.com','test103@gmail.com','test104@gmail.com','test105@gmail.com','test106@gmail.com','test107@gmail.com','test108@gmail.com','test109@gmail.com','test110@gmail.com','test111@gmail.com','test112@gmail.com','test113@gmail.com','test114@gmail.com','test115@gmail.com','test116@gmail.com','test117@gmail.com','test118@gmail.com','test119@gmail.com','test120@gmail.com')\"}"

    const searchResponse = { result: Array.from({ length: 50 }, (_, i) => ({ id: `contact_${i + 1}_id` })) }
    const searchResponse2 = { result: Array.from({ length: 50 }, (_, i) => ({ id: `contact_${i + 51}_id` })) }
    const searchResponse3 = { result: Array.from({ length: 20 }, (_, i) => ({ id: `contact_${i + 101}_id` })) }

    const deletePath = `/v3/marketing/lists/sg_audience_id_12345/contacts?contact_ids=${Array.from(
      { length: 100 },
      (_, i) => `contact_${i + 1}_id`
    ).join(',')}`
    const deletePath2 = `/v3/marketing/lists/sg_audience_id_12345/contacts?contact_ids=${Array.from(
      { length: 20 },
      (_, i) => `contact_${i + 101}_id`
    ).join(',')}`

    nock('https://api.sendgrid.com').post('/v3/marketing/contacts/search', searchQuery).reply(200, searchResponse)
    nock('https://api.sendgrid.com').post('/v3/marketing/contacts/search', searchQuery2).reply(200, searchResponse2)
    nock('https://api.sendgrid.com').post('/v3/marketing/contacts/search', searchQuery3).reply(200, searchResponse3)

    nock('https://api.sendgrid.com').delete(deletePath).reply(200, {})
    nock('https://api.sendgrid.com').delete(deletePath2).reply(200, {})

    const responses = await testDestination.testBatchAction('syncAudience', {
      events,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(5)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(responses[2].status).toBe(200)
    expect(responses[3].status).toBe(200)
    expect(responses[4].status).toBe(200)
  })
})
