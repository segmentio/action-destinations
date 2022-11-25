import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { ApiRegions } from '../../utils'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Mixpanel.identifyUser', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      timestamp, traits: {
        abc: '123',
        created: '2022-10-12T00:00:00.000Z',
        email: 'joe@mixpanel.com',
        firstName: 'Joe',
        lastName: 'Doe',
        username: 'Joe Doe',
        phone: '12345678',
        name: 'Joe',
      }
    })

    nock('https://api.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      }
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          event: '$identify',
          properties: {
            $identified_id: 'user1234',
            $anon_id: event.anonymousId,
            token: MIXPANEL_PROJECT_TOKEN
          }
        })
      })
    )
    expect(responses[1].status).toBe(200)
    expect(responses[1].data).toMatchObject({})
    expect(responses[1].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $set: {
            abc: '123',
            $created: '2022-10-12T00:00:00.000Z',
            $email: 'joe@mixpanel.com',
            $first_name: 'Joe',
            $last_name: 'Doe',
            $name: 'Joe',
            $username: 'Joe Doe',
            $phone: '12345678'
          }
        })
      })
    )
  })

  it('name should automatically be derived from the firstName and lastName traits if they are defined.', async () => {
    const event = createTestEvent({
      timestamp, traits: {
        firstName: 'Joe',
        lastName: 'Doe'
      }
    })

    const event2 = createTestEvent({
      timestamp, traits: {
        firstName: 'Joe'
      }
    })

    const event3 = createTestEvent({
      timestamp, traits: {
        lastName: 'Doe'
      }
    })

    nock('https://api.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      }
    })
    expect(responses[1].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $set: {
            $first_name: 'Joe',
            $last_name: 'Doe',
            $name: 'Joe Doe'
          }
        })
      })
    )
    nock('https://api.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api.mixpanel.com').post('/track').reply(200, {})
    const responses2 = await testDestination.testAction('identifyUser', {
      event: event2,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      }
    })
    expect(responses2[1].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $set: {
            $first_name: 'Joe'
          }
        })
      })
    )
    nock('https://api.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api.mixpanel.com').post('/track').reply(200, {})
    const responses3 = await testDestination.testAction('identifyUser', {
      event: event3,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      }
    })
    expect(responses3[1].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $set: {
            $last_name: 'Doe'
          }
        })
      })
    )

  })

  it('should use EU server URL', async () => {
    const event = createTestEvent({ timestamp, traits: { abc: '123' } })

    nock('https://api-eu.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api-eu.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.EU
      }
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          event: '$identify',
          properties: {
            $identified_id: 'user1234',
            $anon_id: event.anonymousId,
            token: MIXPANEL_PROJECT_TOKEN
          }
        })
      })
    )
    expect(responses[1].status).toBe(200)
    expect(responses[1].data).toMatchObject({})
    expect(responses[1].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $set: {
            abc: '123'
          }
        })
      })
    )
  })

  it('should default to US endpoint if apiRegion setting is undefined', async () => {
    const event = createTestEvent({ timestamp, traits: { abc: '123' } })

    nock('https://api.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          event: '$identify',
          properties: {
            $identified_id: 'user1234',
            $anon_id: event.anonymousId,
            token: MIXPANEL_PROJECT_TOKEN
          }
        })
      })
    )
    expect(responses[1].status).toBe(200)
    expect(responses[1].data).toMatchObject({})
    expect(responses[1].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $set: {
            abc: '123'
          }
        })
      })
    )
  })

  it('should send segment_source_name property if sourceName setting is defined', async () => {
    const event = createTestEvent({ timestamp, traits: { abc: '123' } })

    nock('https://api.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        sourceName: 'example segment source name',
      }
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          event: '$identify',
          properties: {
            $identified_id: 'user1234',
            $anon_id: event.anonymousId,
            token: MIXPANEL_PROJECT_TOKEN,
            segment_source_name: 'example segment source name'
          }
        })
      })
    )
    expect(responses[1].status).toBe(200)
    expect(responses[1].data).toMatchObject({})
    expect(responses[1].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $set: {
            abc: '123'
          }
        })
      })
    )
  })
})
