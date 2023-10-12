import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const profileEvent = createTestEvent({
  type: 'identify',
  traits: {
    title: 'Mr',
    name: 'John Doe',
    email: 'test.email@test.com',
    first_name: 'John',
    last_name: 'Doe',
    age: 50,
    birthday: '01/01/1990',
    gender: 'male',
    address: {
      city: 'London',
      country: 'UK',
      postal_code: 'AB1 1AB',
      state: 'London',
      street: 'Victoria st'
    },
    company: 'Optimizely',
    phone: '1234567890',
    avatar: 'https://image-url.com'
  }
})

describe('OptimizelyDataPlatform.upsertContact', () => {
  it('Should fire upsert contact profile', async () => {
    nock('https://function.zaius.app/twilio_segment').post('/upsert_contact').reply(201)

    const response = await testDestination.testAction('upsertContact', {
      event: profileEvent,
      settings: {
        apiKey: 'abc123',
        region: 'US'
      },
      useDefaultMappings: true
    })

    const expectedBody = `"{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test.email@test.com\\"},\\"title\\":\\"Mr\\",\\"name\\":\\"John Doe\\",\\"first_name\\":\\"John\\",\\"last_name\\":\\"Doe\\",\\"age\\":50,\\"dob\\":\\"01/01/1990\\",\\"gender\\":\\"male\\",\\"phone\\":\\"1234567890\\",\\"address\\":{\\"street\\":\\"Victoria st\\",\\"city\\":\\"London\\",\\"state\\":\\"London\\",\\"country\\":\\"UK\\"},\\"company\\":\\"Optimizely\\",\\"image_url\\":\\"https://image-url.com\\"}"`

    expect(response[0].status).toBe(201)
    expect(response[0].options.body).toMatchInlineSnapshot(expectedBody)
  })
})
