import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Destination)
const event = createTestEvent({
  context: {
    personas: {
      audience_settings: {
        advertiserId: '585806696618602999',
        countryCode: 'US',
        description: 'Test Event',
        externalAudienceId: '65241452'
      },
      computation_class: 'audience',
      computation_id: 'aud_2g5VilffxpBYqelWk4K0yBzAuFl',
      computation_key: 'amazon_ads_audience_6_may_24',
      external_audience_id: '379909525712777677',
      namespace: 'spa_rHVbZsJXToWAwcmbgpfo36',
      space_id: 'spa_rHVbZsJXToWAwcmbgpfo36'
    },
    traits: {
      email: 'test@twilio.com'
    }
  },
  event: 'Audience Entered',
  messageId: 'personas_2g5WGNhZtTET4DhSeILpE6muHnH',
  properties: {
    amazon_ads_audience_6_may_24: true,
    audience_key: 'amazon_ads_audience_6_may_24',
    externalId: '379909525712777677'
  },
  receivedAt: '2024-05-06T09:30:38.650Z',
  timestamp: '2024-05-06T09:30:22.829Z',
  type: 'track',
  userId: 'test-kochar-01',
  writeKey: 'REDACTED'
})
const events: SegmentEvent[] = [
  {
    ...event,
    userId: 'invalid@user.com',
    event: 'Audience Entered',
    properties: {
      audience_key: 'example_event_once_30_4_24_1',
      example_event_once_30_4_24_1: true,
      email: 'test@gmail.com',
      first_name: 'gaurav',
      city: 'Gurgaon',
      state: 'Haryana'
    }
  },
  {
    ...event,
    userId: 'test_kochar-02',
    event: 'Audience Exited',
    properties: {
      audience_key: 'example_event_once_30_4_24_1',
      example_event_once_30_4_24_1: true,
      email: 'test.kochar@gmail.com',
      postal: 'test',
      address: '#501/2, Test Address',
      first_name: 'gaurav',
      last_name: 'kochar',
      state: 'Haryana',
      phone: '192293719271',
      city: ' Test City'
    }
  }
]
const mapping = {
  email: {
    '@path': '$.properties.email'
  },
  event_name: {
    '@path': '$.event'
  },
  externalUserId: {
    '@path': '$.userId'
  },
  lastName: {
    '@path': '$.properties.last_name'
  },
  firstName: {
    '@path': '$.properties.first_name'
  },
  audienceId: {
    '@path': '$.context.personas.external_audience_id'
  },
  state: {
    '@path': '$.properties.state'
  },
  postal: {
    '@path': '$.properties.postal'
  },
  city: {
    '@path': '$.properties.city'
  },
  address: {
    '@path': '$.properties.address'
  },
  phone: {
    '@path': '$.properties.phone'
  },
  enable_batching: true
}

const settings = {
  region: 'https://advertising-api.amazon.com'
}

describe('AmazonAds.syncAudiencesToDSP', () => {
  beforeEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('Should add user to audience when Event is Audience Entered', async () => {
    nock(`https://advertising-api.amazon.com`)
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(202)
    expect(response[0].data).toMatchObject({ jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })
    expect(response[0].options.body).toBe(
      '{"records":[{"externalUserId":"test-kochar-01","countryCode":"US","action":"CREATE","hashedPII":[{}]}],"audienceId":379909525712777677}'
    )
    expect(response[0].options).toMatchSnapshot()
  })

  it('Normalise and Hash personally-identifiable input provided with SHA-256', async () => {
    nock(`https://advertising-api.amazon.com`)
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event: {
        ...event,
        properties: {
          audience_key: 'example_event_once_30_4_24_1',
          example_event_once_30_4_24_1: true,
          email: 'gaurav.kochar@gmail.com',
          phone: '21321312313',
          first_name: 'gaurav',
          state: 'Haryana'
        }
      },
      settings,
      useDefaultMappings: true
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(202)
    expect(response[0].data).toMatchObject({ jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })
    expect(response[0].options.body).toBe(
      '{"records":[{"externalUserId":"test-kochar-01","countryCode":"US","action":"CREATE","hashedPII":[{"firstname":"44104fcaef8476724152090d6d7bd9afa8ca5b385f6a99d3c6cf36b943b9872d","phone":"63af7d494c194a90e1cf1db5371c13f97db650161aa803e67182c0dbaf668c7b","state":"92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d","email":"15b436489faf367dadf946cfe311d44b6621814e1aacc4f8acfdf0c29a068b11"}]}],"audienceId":379909525712777677}'
    )
    expect(response[0].options).toMatchSnapshot()
  })

  it('Normalise and Hash input with extra characters and spaces', async () => {
    nock(`https://advertising-api.amazon.com`)
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event: {
        ...event,
        properties: {
          audience_key: 'rajul_vadera_test',
          rajul_vadera_test: true,
          firstName: 'Rajul',
          lastName: 'Vadera',
          address: '456 Anime Blvd. Apt 1',
          city: 'Osaka City',
          state: 'California',
          postal: '90002',
          email: 'vadera.rajul+segment@example.com',
          phone: '+555-987-6543',
          event_name: 'Audience Entered'
        }
      },
      settings,
      useDefaultMappings: true
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(202)
    expect(response[0].data).toMatchObject({ jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })
    expect(response[0].options.body).toBe(
      '{"records":[{"externalUserId":"test-kochar-01","countryCode":"US","action":"CREATE","hashedPII":[{"address":"b1afff5d12bbf57a065ada36e32fef747b5b780efc77e250c3656f9375340793","postal":"516b1543763b8b04f15897aeac07eba66f4e36fdac6945bacb6bdac57e44598a","phone":"e5a9c2de38b55b6bedcbb8a24d302bb67b2bff018ddd4ce2f7e53b809461145e","city":"6f03728dda12764dfb0aef47a8ad1289aa90edc9689ef9e9aee7cd2e8d2ef19f","state":"7e8eea5cc60980270c9ceb75ce8c087d48d726110fd3d17921f774eefd8e18d8","email":"e51e21fe4c09dbd046b84be7e9e894f666d6106b0915403a47bfbc3506e2e1bf"}]}],"audienceId":379909525712777677}'
    )
    expect(response[0].options).toMatchSnapshot()
  })

  it('Should delete user from audience when Event is Audience Exited', async () => {
    nock(`https://advertising-api.amazon.com`)
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const response = await testDestination.testAction('syncAudiencesToDSP', {
      event: {
        ...event,
        event: 'Audience Exited'
      },
      settings,
      useDefaultMappings: true
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(202)
    expect(response[0].data).toMatchObject({ jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })
    expect(response[0].options.body).toBe(
      '{"records":[{"externalUserId":"test-kochar-01","countryCode":"US","action":"DELETE","hashedPII":[{}]}],"audienceId":379909525712777677}'
    )
    expect(response[0].options).toMatchSnapshot()
  })

  it('should successfully handle a batch of events with failure response from Amazon AMC API', async () => {
    nock(`https://advertising-api.amazon.com`)
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(400, { Message: 'STRING_VALUE can not be converted to a Long' })

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events,
      settings,
      mapping
    })
    expect(response.length).toBe(2)
    expect(response[0]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'externalUserId must satisfy regular expression pattern: [0-9a-zA-Z\\-\\_]{1,128}}',
      errorreporter: 'INTEGRATIONS'
    })
    expect(response[1]).toMatchObject({
      body: '{"Message":"STRING_VALUE can not be converted to a Long"}',
      errormessage: 'Bad Request',
      errorreporter: 'DESTINATION',
      errortype: 'BAD_REQUEST',
      sent: {
        audienceId: '379909525712777677',
        city: 'Gurgaon',
        email: 'test@gmail.com',
        enable_batching: true,
        event_name: 'Audience Entered',
        externalUserId: 'invalid@user.com',
        firstName: 'gaurav',
        state: 'Haryana'
      },
      status: 400
    })
  })
  it('should work with batch events, throws error for invalid event only', async () => {
    nock(`https://advertising-api.amazon.com`)
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events,
      settings,
      mapping
    })
    expect(response.length).toBe(2)
    expect(response[0]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'externalUserId must satisfy regular expression pattern: [0-9a-zA-Z\\-\\_]{1,128}}',
      errorreporter: 'INTEGRATIONS'
    })
    expect(response[1]).toMatchObject({
      status: 200,
      sent: {
        externalUserId: 'test_kochar-02',
        countryCode: 'US',
        action: 'DELETE',
        hashedPII: [
          {
            address: '45cfec5f1df1af649d49fc74314d7c9272e2f63ae9119bd3ef4b22a040d98cbc',
            city: '9cc97f17fbf85d8b631be044749005775aa13bd7f4014d06a15c2c56a7325562',
            email: 'bd0bcf03735a1a00c6f1dd21c63c5d819e7e450298f301698192e8df90da3bb3',
            firstname: '44104fcaef8476724152090d6d7bd9afa8ca5b385f6a99d3c6cf36b943b9872d',
            lastname: '4cd1cb0957bc59e698beab9e86f062f2e84138bff5a446e49762da8fe0c2f499',
            phone: 'c161700d73a5c32b84701ebed43b9febe117ea1ebbd4e150eab92890186fb455',
            postal: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
            state: '92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d'
          }
        ]
      },
      body: '{"jobRequestId":"1155d3e3-b18c-4b2b-a3b2-26173cdaf770"}'
    })
  })

  it('should throw an error when all events are having invalid externalUserId', async () => {
    const events: SegmentEvent[] = [
      {
        ...event,
        userId: 'invalid+1@user.com',
        event: 'Audience Entered',
        properties: {
          audience_key: 'example_event_once_30_4_24_1',
          example_event_once_30_4_24_1: true,
          email: 'test@gmail.com',
          first_name: 'gaurav',
          city: 'Gurgaon',
          state: 'Haryana'
        }
      },
      {
        ...event,
        userId: 'invalid+2@user.com',
        event: 'Audience Exited',
        properties: {
          audience_key: 'example_event_once_30_4_24_1',
          example_event_once_30_4_24_1: true,
          email: 'test.kochar@gmail.com',
          postal: 'test',
          address: '#501/2, Test Address',
          first_name: 'gaurav',
          last_name: 'kochar',
          state: 'Haryana'
        }
      }
    ]

    const response = await testDestination.executeBatch('syncAudiencesToDSP', {
      events,
      settings,
      mapping
    })

    expect(response.length).toBe(2)
    expect(response[0]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'externalUserId must satisfy regular expression pattern: [0-9a-zA-Z\\-\\_]{1,128}}',
      errorreporter: 'INTEGRATIONS'
    })
    expect(response[1]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'externalUserId must satisfy regular expression pattern: [0-9a-zA-Z\\-\\_]{1,128}}',
      errorreporter: 'INTEGRATIONS'
    })
  })
})
