import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../properties'

const SITE_CODE = 'mysitecode'
const VISITOR_CODE = 'visitorCode'
const CLIENT_ID = 'CLIENT_ID'
const CLIENT_SECRET = 'CLIENT_SECRET'

const testDestination = createTestIntegration(Destination)

describe('Kameleoon.logEvent', () => {
  it('should work', async () => {
    nock(BASE_URL).post('').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      timestamp: '2023-10-06T10:46:53.902Z',
      properties: {
        kameleoonVisitorCode: VISITOR_CODE
      },
      context: {
        active: true,
        app: {
          name: 'InitechGlobal',
          version: '545',
          build: '3.0.1.545',
          namespace: 'com.production.segment'
        },
        campaign: {
          name: 'TPS Innovation Newsletter',
          source: 'Newsletter',
          medium: 'email',
          term: 'tps reports',
          content: 'image link'
        },
        device: {
          id: 'B5372DB0-C21E-11E4-8DFC-AA07A5B093DB',
          advertisingId: '7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB',
          adTrackingEnabled: true,
          manufacturer: 'Apple',
          model: 'iPhone7,2',
          name: 'maguro',
          type: 'ios'
        },
        ip: '8.8.8.8',
        library: {
          name: 'analytics.js',
          version: '2.11.1'
        },
        locale: 'en-US',
        location: {
          city: 'San Francisco',
          country: 'United States',
          latitude: 40.2964197,
          longitude: -76.9411617,
          speed: 0
        },
        network: {
          bluetooth: false,
          carrier: 'T-Mobile US',
          cellular: true,
          wifi: false
        },
        os: {
          name: 'iPhone OS',
          version: '8.1.3'
        },
        page: {
          path: '/academy/',
          referrer: '',
          search: '',
          title: 'Analytics Academy',
          url: 'https://segment.com/academy/'
        },
        screen: {
          width: 320,
          height: 568,
          density: 2
        },
        groupId: '12345',
        timezone: 'Europe/Amsterdam',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      },
      messageId: 'test-message-ikxq2j1u94'
    })
    const apiKey = {
      id: CLIENT_ID,
      secret: CLIENT_SECRET
    }
    const responses = await testDestination.testAction('logEvent', {
      event,
      settings: {
        apiKey: Buffer.from(JSON.stringify(apiKey)).toString('base64'),
        sitecode: SITE_CODE
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
