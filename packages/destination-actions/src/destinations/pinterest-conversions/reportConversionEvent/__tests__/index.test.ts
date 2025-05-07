import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_VERSION } from '../../constants'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const event = createTestEvent({
  messageId: 'test-message-rocnz07d5e8',
  timestamp: '2023-03-13T07:56:23.846Z',
  type: 'track',
  userId: 'test-user-fon3evajtr',
  event: 'Segment Test Event Name',
  anonymousId: 'wd86yjukj5o',
  context: {
    active: true,
    app: {
      name: 'InitechGlobal',
      version: '545',
      build: '3.0.1.545',
      namespace: 'com.production.segment'
    },
    device: {
      id: 'B5372DB0-C21E-11E4-8DFC-AA07A5B093DB',
      advertisingId: '7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB',
      adTrackingEnabled: true,
      manufacturer: 'Apple',
      model: 'iPhone7,2',
      name: 'maguro',
      type: 'ios',
      token: 'ff15bc0c20c4aa6cd50854ff165fd265c838e5405bfeb9571066395b8c9da449'
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
    groupId: '12345',
    timezone: 'Europe/Amsterdam',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
  },
  receivedAt: '2023-03-13T07:56:23.846Z',
  sentAt: '2023-03-13T07:56:23.846Z'
})

const authData: Settings = {
  ad_account_id: 'test_ad_account_id',
  conversion_token: 'test_conversion_token'
}

describe('PinterestConversionApi', () => {
  describe('ReportConversionEvent', () => {
    it('should throw an error when event name is invalid and not from list', async () => {
      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            event_name: 'invalid_event_name'
          }
        })
      ).rejects.toThrowError()
    })

    it('should throw an error when account source is invalid and not selected from list', async () => {
      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            event_name: 'checkout',
            action_source: 'invalid_action_source'
          }
        })
      ).rejects.toThrowError()
    })

    it('Should send an event to pinterest successfully,if user data have either of email,hashed_maids or both client_ip_address and client_user_agent', async () => {
      nock(`https://api.pinterest.com`)
        .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
        .reply(200, {})

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings: authData,
        useDefaultMappings: true,
        mapping: {
          event_name: 'checkout',
          user_data: {
            first_name: ['Gaurav'],
            last_name: ['test'],
            external_id: ['test_external_id'],
            phone: ['123456789'],
            gender: ['male'],
            city: ['asd'],
            state: ['CA'],
            zip: ['123456'],
            country: ['US'],
            hashed_maids: ['test123123'],
            date_of_birth: ['1996-02-01'],
            email: ['test@gmail.com'],
            client_user_agent: '5.5.5.5',
            click_id: 'click-id1',
            partner_id: 'partner-id1',
            client_ip_address:
              'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
          },
          custom_data: {
            num_items: '2',
            value: 2000
          }
        }
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(JSON.parse(responses[0]?.options?.body as string)?.data?.length).toBe(1)
      expect(responses[0].options.json).toMatchSnapshot()
    })

    it("Should throw an error when user data doesn't have either of email,hashed_maids or both client_ip_address and client_user_agent", async () => {
      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            event_name: 'checkout'
          }
        })
      ).rejects.toThrowError(
        'User data must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields'
      )
    })

    it('Should send an signup event to pinterest successfully,if user data have either of email,hashed_maids or both client_ip_address and client_user_agent', async () => {
      nock(`https://api.pinterest.com`)
        .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
        .reply(200, {})

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings: authData,
        useDefaultMappings: true,
        mapping: {
          event_name: 'signup',
          user_data: {
            first_name: ['Gaurav'],
            last_name: ['test'],
            external_id: ['test_external_id'],
            phone: ['123456789'],
            gender: ['male'],
            city: ['asd'],
            state: ['CA'],
            zip: ['123456'],
            country: ['US'],
            hashed_maids: ['test123123'],
            date_of_birth: ['1996-02-01'],
            email: ['test@gmail.com'],
            client_user_agent: '5.5.5.5',
            click_id: 'click-id1',
            partner_id: 'partner-id1',
            client_ip_address:
              'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
          }
        }
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(JSON.parse(responses[0]?.options?.body as string)?.data?.length).toBe(1)
      expect(responses[0].options.json).toMatchSnapshot()
    })

    it('should be able to detect hashed data when flag is set', async () => {
      nock(`https://api.pinterest.com`)
        .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
        .reply(200, {})

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings: authData,
        useDefaultMappings: true,
        mapping: {
          event_name: 'checkout',
          user_data: {
            first_name: ['44104fcaef8476724152090d6d7bd9afa8ca5b385f6a99d3c6cf36b943b9872d'],
            last_name: ['test'],
            external_id: ['test_external_id'],
            phone: ['63af7d494c194a90e1cf1db5371c13f97db650161aa803e67182c0dbaf668c7b'],
            gender: ['male'],
            city: ['92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d'],
            state: ['92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d'],
            zip: ['92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d'],
            country: ['92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d'],
            hashed_maids: ['test123123'],
            date_of_birth: ['1996-02-01'],
            email: ['c551027f06bd3f307ccd6abb61edc500def2680944c010e932ab5b27a3a8f151'],
            client_user_agent: '5.5.5.5',
            click_id: 'click-id1',
            partner_id: 'partner-id1',
            client_ip_address:
              'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
          },
          custom_data: {
            num_items: '2',
            value: 2000
          }
        }
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(JSON.parse(responses[0]?.options?.body as string)?.data?.length).toBe(1)
      expect(responses[0].options.body).toBe(
        '{"data":[{"event_name":"checkout","action_source":"web","event_time":1678694183,"event_id":"test-message-rocnz07d5e8","event_source_url":"https://segment.com/academy/","partner_name":"ss-segment","opt_out":true,"user_data":{"em":["c551027f06bd3f307ccd6abb61edc500def2680944c010e932ab5b27a3a8f151"],"ph":["63af7d494c194a90e1cf1db5371c13f97db650161aa803e67182c0dbaf668c7b"],"ge":["62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a"],"db":["9e4b15bbd40f2429491316d291927f5153b4f8c28738e6ee6284009ce29d13d6"],"ln":["9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"],"fn":["44104fcaef8476724152090d6d7bd9afa8ca5b385f6a99d3c6cf36b943b9872d"],"ct":["92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d"],"st":["92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d"],"zp":["92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d"],"country":["92db9c574d420b2437b29d898d55604f61df6c17f5163e53337f2169dd70d38d"],"external_id":["74a6a35e39c525dcf6fd98ba90e79eb3c4358df1ae204e9489d51e6946485b2b"],"client_ip_address":"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1","client_user_agent":"5.5.5.5","hashed_maids":["f4c2178860817a2c25d2cb3185aa25779b0ecaf17c30845926218e17a18a9f89"],"click_id":"click-id1","partner_id":"partner-id1"},"custom_data":{"value":"2000","num_items":2},"app_name":"InitechGlobal","app_version":"545","device_model":"iPhone7,2","device_type":"ios","os_version":"8.1.3"}]}'
      )
    })
  })
})
