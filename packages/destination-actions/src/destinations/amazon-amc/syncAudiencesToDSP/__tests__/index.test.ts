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

const settings = {
  region: 'https://advertising-api.amazon.com'
}

describe('AmazonAds.syncAudiencesToDSP', () => {
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

  it('should work with batch events', async () => {
    nock(`https://advertising-api.amazon.com`)
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(202, { jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })

    const events: SegmentEvent[] = [
      {
        ...event,
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
        userId: 'test-kochar-02',
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

    const response = await testDestination.testBatchAction('syncAudiencesToDSP', {
      events,
      settings,
      useDefaultMappings: true
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(202)
    expect(response[0].data).toMatchObject({ jobRequestId: '1155d3e3-b18c-4b2b-a3b2-26173cdaf770' })
    expect(response[0].options.body).toBe(
      '{"records":[{"externalUserId":"test-kochar-01","countryCode":"US","action":"CREATE","hashedPII":[{"firstname":"44104fcaef8476724152090d6d7bd9afa8ca5b385f6a99d3c6cf36b943b9872d","city":"b4c0372af033c406857a420644e46c806280a0bab8246bd0c62c7807f66f794f","state":"92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d","email":"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674"}]},{"externalUserId":"test-kochar-02","countryCode":"US","action":"DELETE","hashedPII":[{"firstname":"44104fcaef8476724152090d6d7bd9afa8ca5b385f6a99d3c6cf36b943b9872d","lastname":"4cd1cb0957bc59e698beab9e86f062f2e84138bff5a446e49762da8fe0c2f499","address":"45cfec5f1df1af649d49fc74314d7c9272e2f63ae9119bd3ef4b22a040d98cbc","postal":"9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08","state":"92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d","email":"bd0bcf03735a1a00c6f1dd21c63c5d819e7e450298f301698192e8df90da3bb3"}]}],"audienceId":379909525712777677}'
    )
    expect(response[0].options).toMatchSnapshot()
  })

  it('Handle Error when amazon ads API throw error', async () => {
    nock(`https://advertising-api.amazon.com`)
      .post('/amc/audiences/records')
      .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
      .reply(400, { Message: 'STRING_VALUE can not be converted to a Long' })

    await expect(
      testDestination.testAction('syncAudiencesToDSP', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Bad Request')
  })
})
