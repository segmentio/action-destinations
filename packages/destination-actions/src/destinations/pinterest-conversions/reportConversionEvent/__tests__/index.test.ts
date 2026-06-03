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

    describe('legacy mode', () => {
      it('should send event using legacy custom_data and flat app/device fields', async () => {
        nock(`https://api.pinterest.com`)
          .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
          .reply(200, {})

        const responses = await testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            data_format: 'legacy',
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

        const body = JSON.parse(responses[0].options.body as string)
        expect(body.data[0].custom_data.value).toBe('2000')
        expect(body.data[0].custom_data.num_items).toBe(2)
        expect(body.data[0].custom_data.np).toBe('ss-segment')
        expect(body.data[0].app_name).toBe('InitechGlobal')
        expect(body.data[0].app_version).toBe('545')
        expect(body.data[0].device_model).toBe('iPhone7,2')
        expect(body.data[0].device_type).toBe('ios')
        expect(body.data[0].os_version).toBe('8.1.3')
        expect(body.data[0].app_info).toBeUndefined()
        expect(body.data[0].device_info).toBeUndefined()
      })

      it('should send signup event in legacy mode', async () => {
        nock(`https://api.pinterest.com`)
          .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
          .reply(200, {})

        const responses = await testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            data_format: 'legacy',
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

        const body = JSON.parse(responses[0].options.body as string)
        expect(body.data[0].event_name).toBe('signup')
        expect(body.data[0].partner_name).toBe('ss-segment')
        expect(body.data[0].app_info).toBeUndefined()
        expect(body.data[0].device_info).toBeUndefined()
      })

      it('should detect pre-hashed data in legacy mode', async () => {
        nock(`https://api.pinterest.com`)
          .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
          .reply(200, {})

        const responses = await testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            data_format: 'legacy',
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
        const body = JSON.parse(responses[0].options.body as string)
        expect(body.data.length).toBe(1)
        expect(body.data[0].user_data.em).toEqual(['c551027f06bd3f307ccd6abb61edc500def2680944c010e932ab5b27a3a8f151'])
        expect(body.data[0].user_data.fn).toEqual(['44104fcaef8476724152090d6d7bd9afa8ca5b385f6a99d3c6cf36b943b9872d'])
        expect(body.data[0].user_data.ph).toEqual(['63af7d494c194a90e1cf1db5371c13f97db650161aa803e67182c0dbaf668c7b'])
        expect(body.data[0].custom_data.value).toBe('2000')
        expect(body.data[0].custom_data.num_items).toBe(2)
        expect(body.data[0].custom_data.np).toBe('ss-segment')
        expect(body.data[0].app_name).toBe('InitechGlobal')
        expect(body.data[0].device_model).toBe('iPhone7,2')
        expect(body.data[0].app_info).toBeUndefined()
        expect(body.data[0].device_info).toBeUndefined()
      })
    })

    describe('latest mode', () => {
      it('should send event using latest fields with app_info and device_info', async () => {
        nock(`https://api.pinterest.com`)
          .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
          .reply(200, {})

        const responses = await testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            data_format: 'latest',
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
            custom_data_2: {
              value: 2000,
              num_items: 2,
              currency: 'USD'
            },
            contents: [
              {
                id: 'sku_123',
                item_price: 74.99,
                quantity: 2,
                item_brand: 'Brand A',
                item_category: 'Shoes',
                item_name: 'Running Shoe'
              }
            ]
          }
        })
        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)

        const body = JSON.parse(responses[0].options.body as string)
        expect(body.data[0].custom_data.value).toBe('2000')
        expect(body.data[0].custom_data.num_items).toBe(2)
        expect(body.data[0].custom_data.currency).toBe('USD')
        expect(body.data[0].custom_data.np).toBe('ss-segment')
        expect(body.data[0].custom_data.contents).toEqual([
          {
            id: 'sku_123',
            item_price: '74.99',
            quantity: 2,
            item_brand: 'Brand A',
            item_category: 'Shoes',
            item_name: 'Running Shoe'
          }
        ])
        expect(body.data[0].app_info).toEqual({
          app_id: '3.0.1.545',
          app_name: 'InitechGlobal',
          app_package_name: 'com.production.segment',
          app_version: '545',
          user_agent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
        })
        expect(body.data[0].device_info).toEqual({
          brand: 'Apple',
          model: 'iPhone7,2',
          type: 'ios',
          os_family: 'iPhone OS',
          os_version: '8.1.3',
          timezone: 'Europe/Amsterdam'
        })
        expect(body.data[0].app_id).toBeUndefined()
        expect(body.data[0].app_name).toBeUndefined()
        expect(body.data[0].device_brand).toBeUndefined()
        expect(body.data[0].device_model).toBeUndefined()
      })

      it('should detect pre-hashed data in latest mode', async () => {
        nock(`https://api.pinterest.com`)
          .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
          .reply(200, {})

        const responses = await testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            data_format: 'latest',
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
            custom_data_2: {
              value: 2000,
              num_items: 2
            }
          }
        })
        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
        const body = JSON.parse(responses[0].options.body as string)
        expect(body.data[0].user_data.em).toEqual(['c551027f06bd3f307ccd6abb61edc500def2680944c010e932ab5b27a3a8f151'])
        expect(body.data[0].user_data.fn).toEqual(['44104fcaef8476724152090d6d7bd9afa8ca5b385f6a99d3c6cf36b943b9872d'])
        expect(body.data[0].user_data.ph).toEqual(['63af7d494c194a90e1cf1db5371c13f97db650161aa803e67182c0dbaf668c7b'])
        expect(body.data[0].custom_data.value).toBe('2000')
        expect(body.data[0].custom_data.num_items).toBe(2)
        expect(body.data[0].custom_data.np).toBe('ss-segment')
        expect(body.data[0].app_info.app_name).toBe('InitechGlobal')
        expect(body.data[0].device_info.model).toBe('iPhone7,2')
      })
    })
  })
})
