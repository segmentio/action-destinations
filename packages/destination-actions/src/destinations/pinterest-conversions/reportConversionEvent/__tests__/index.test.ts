import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
// import { eventNames } from 'process'
import Destination from '../../index'
import { API_VERSION } from '../../constants'
import { Settings } from '../../generated-types'
// import { response } from 'express'

const testDestination = createTestIntegration(Destination)
const event = createTestEvent({
  messageId: 'test-message-rocnz07d5e8',
  timestamp: '1678203524',
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
            event_name: 'invalid_event_name',
            action_source: 'web',
            user_data: {
              em: ['411e44ce1261728ffd2c0686e44e3fffe413c0e2c5adc498bc7da883d476b9c8']
            }
          }
        })
      ).rejects.toThrowError()

      // console.log(responses);

      // expect(responses.length).toBe(1)
      // expect(responses[0].status).toBe(201)

      // expect(responses[0].options.body).toMatchInlineSnapshot(
      //     `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210000\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\"},\\"custom_data\\":{\\"city\\":\\"Gotham\\",\\"country\\":\\"United States\\",\\"last_name\\":\\"Wayne\\",\\"currency\\":\\"USD\\",\\"value\\":12.12}}]}"`
      // )
    })

    it('should throw an error for invalid currency values', async () => {
      // nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})
      nock(`https://api.pinterest.com`)
        .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
        .reply(200, {})

      // const event = createTestEvent({
      //     event: 'Product Added',
      //     userId: 'abc123',
      //     timestamp: '1631210010',
      //     properties: {
      //         action_source: 'email',
      //         currency: 'FAKE',
      //         value: 12.12,
      //         email: 'nicholas.aguilar@segment.com'
      //     }
      // })

      await expect(
        testDestination.testAction('reportCoversionEvent', {
          event,
          settings: authData,
          mapping: {
            event_name: 'checkout',
            action_source: 'web',
            user_data: {
              em: ['411e44ce1261728ffd2c0686e44e3fffe413c0e2c5adc498bc7da883d476b9c8']
            }
          }
        })
      ).resolves.not.toThrowError()
    })

    // it('should handle default mappings', async () => {
    //     nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    //     const event = createTestEvent({
    //         event: 'Product Added',
    //         timestamp: '1631210020',
    //         messageId: 'test',
    //         properties: {
    //             userId: 'testuser1234',
    //             action_source: 'email',
    //             currency: 'USD',
    //             product_id: 'abc12345',
    //             quantity: 1,
    //             price: 100
    //         }
    //     })

    //     const responses = await testDestination.testAction('addToCart', {
    //         event,
    //         settings,
    //         useDefaultMappings: true,
    //         mapping: { action_source: { '@path': '$.properties.action_source' } }
    //     })

    //     expect(responses.length).toBe(1)
    //     expect(responses[0].status).toBe(201)

    //     expect(responses[0].options.body).toMatchInlineSnapshot(
    //         `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210020\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":100,\\"contents\\":[{\\"id\\":\\"abc12345\\",\\"quantity\\":1,\\"item_price\\":100}]}}]}"`
    //     )
    // })

    // it('should throw an error if no id parameter is included in contents array objects', async () => {
    //     nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    //     const event = createTestEvent({
    //         event: 'Product Added',
    //         userId: 'abc123',
    //         timestamp: '1631210030',
    //         properties: {
    //             email: 'test@test.com',
    //             action_source: 'email',
    //             currency: 'USD',
    //             value: 12.12,
    //             quantity: 1204,
    //             delivery_category: 'drone'
    //         }
    //     })

    //     await expect(
    //         testDestination.testAction('addToCart', {
    //             event,
    //             settings,
    //             mapping: {
    //                 currency: {
    //                     '@path': '$.properties.currency'
    //                 },
    //                 value: {
    //                     '@path': '$.properties.value'
    //                 },
    //                 action_source: {
    //                     '@path': '$.properties.action_source'
    //                 },
    //                 event_time: {
    //                     '@path': '$.timestamp'
    //                 },
    //                 contents: [
    //                     {
    //                         quantity: {
    //                             '@path': '$.properties.quantity'
    //                         },
    //                         delivery_category: {
    //                             '@path': '$.properties.delivery_category'
    //                         }
    //                     }
    //                 ],
    //                 user_data: {
    //                     email: {
    //                         '@path': '$.properties.email'
    //                     }
    //                 }
    //             }
    //         })
    //     ).rejects.toThrowError("contents[0] must include an 'id' parameter.")
    // })

    // it('should send data processing options', async () => {
    //     nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    //     const event = createTestEvent({
    //         event: 'Product Added',
    //         timestamp: '1631210020',
    //         messageId: 'test',
    //         properties: {
    //             data_processing_options: true,
    //             data_processing_options_state: 1000,
    //             data_processing_options_country: 1,
    //             userId: 'testuser1234',
    //             action_source: 'email',
    //             currency: 'USD',
    //             product_id: 'abc12345',
    //             quantity: 1,
    //             price: 100
    //         }
    //     })

    //     const responses = await testDestination.testAction('addToCart', {
    //         event,
    //         settings,
    //         useDefaultMappings: true,
    //         mapping: {
    //             action_source: { '@path': '$.properties.action_source' },
    //             data_processing_options: {
    //                 '@path': '$.properties.data_processing_options'
    //             },
    //             data_processing_options_state: {
    //                 '@path': '$.properties.data_processing_options_state'
    //             },
    //             data_processing_options_country: {
    //                 '@path': '$.properties.data_processing_options_country'
    //             }
    //         }
    //     })

    //     expect(responses.length).toBe(1)
    //     expect(responses[0].status).toBe(201)

    //     expect(responses[0].options.body).toMatchInlineSnapshot(
    //         `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210020\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":100,\\"contents\\":[{\\"id\\":\\"abc12345\\",\\"quantity\\":1,\\"item_price\\":100}]},\\"data_processing_options\\":[\\"LDU\\"],\\"data_processing_options_country\\":1,\\"data_processing_options_state\\":1000}]}"`
    //     )
    // })

    // it('should not send data processing options', async () => {
    //     nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    //     const event = createTestEvent({
    //         event: 'Product Added',
    //         timestamp: '1631210020',
    //         messageId: 'test',
    //         properties: {
    //             userId: 'testuser1234',
    //             data_processing_options: false,
    //             action_source: 'email',
    //             currency: 'USD',
    //             product_id: 'abc12345',
    //             quantity: 1,
    //             price: 100
    //         }
    //     })

    //     const responses = await testDestination.testAction('addToCart', {
    //         event,
    //         settings,
    //         useDefaultMappings: true,
    //         mapping: {
    //             action_source: {
    //                 '@path': '$.properties.action_source'
    //             },
    //             data_processing_options: {
    //                 '@path': '$.properties.data_processing_options'
    //             }
    //         }
    //     })

    //     expect(responses.length).toBe(1)
    //     expect(responses[0].status).toBe(201)

    //     expect(responses[0].options.body).toMatchInlineSnapshot(
    //         `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210020\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":100,\\"contents\\":[{\\"id\\":\\"abc12345\\",\\"quantity\\":1,\\"item_price\\":100}]}}]}"`
    //     )
    // })

    // it('should send data processing options without state or country code set by user', async () => {
    //     nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    //     const event = createTestEvent({
    //         event: 'Product Added',
    //         timestamp: '1631210020',
    //         messageId: 'test',
    //         properties: {
    //             data_processing_options: true,
    //             userId: 'testuser1234',
    //             action_source: 'email',
    //             currency: 'USD',
    //             product_id: 'abc12345',
    //             quantity: 1,
    //             price: 100
    //         }
    //     })

    //     const responses = await testDestination.testAction('addToCart', {
    //         event,
    //         settings,
    //         useDefaultMappings: true,
    //         mapping: {
    //             action_source: { '@path': '$.properties.action_source' },
    //             data_processing_options: {
    //                 '@path': '$.properties.data_processing_options'
    //             }
    //         }
    //     })

    //     expect(responses.length).toBe(1)
    //     expect(responses[0].status).toBe(201)

    //     expect(responses[0].options.body).toMatchInlineSnapshot(
    //         `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210020\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"external_id\\":\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":100,\\"contents\\":[{\\"id\\":\\"abc12345\\",\\"quantity\\":1,\\"item_price\\":100}]},\\"data_processing_options\\":[\\"LDU\\"],\\"data_processing_options_country\\":0,\\"data_processing_options_state\\":0}]}"`
    //     )
    // })

    // it('should throw an error if contents.delivery_category is not supported', async () => {
    //     nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    //     const event = createTestEvent({
    //         event: 'Product Added',
    //         userId: 'abc123',
    //         timestamp: '1631210030',
    //         properties: {
    //             email: 'test@test.com',
    //             action_source: 'email',
    //             currency: 'USD',
    //             value: 12.12,
    //             id: 'abc123',
    //             quantity: 1204,
    //             delivery_category: 'submarine'
    //         }
    //     })

    //     await expect(
    //         testDestination.testAction('addToCart', {
    //             event,
    //             settings,
    //             mapping: {
    //                 currency: {
    //                     '@path': '$.properties.currency'
    //                 },
    //                 value: {
    //                     '@path': '$.properties.value'
    //                 },
    //                 action_source: {
    //                     '@path': '$.properties.action_source'
    //                 },
    //                 event_time: {
    //                     '@path': '$.timestamp'
    //                 },
    //                 contents: [
    //                     {
    //                         id: {
    //                             '@path': '$.properties.id'
    //                         },
    //                         quantity: {
    //                             '@path': '$.properties.quantity'
    //                         },
    //                         delivery_category: {
    //                             '@path': '$.properties.delivery_category'
    //                         }
    //                     }
    //                 ],
    //                 user_data: {
    //                     email: {
    //                         '@path': '$.properties.email'
    //                     }
    //                 }
    //             }
    //         })
    //     ).rejects.toThrowError('contents[0].delivery_category must be one of {in_store, home_delivery, curbside}.')
    // })

    // it('should throw an error if no user_data keys are included', async () => {
    //     nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    //     const event = createTestEvent({
    //         event: 'Product Added',
    //         userId: 'abc123',
    //         timestamp: '1631210030',
    //         properties: {
    //             action_source: 'email',
    //             currency: 'USD',
    //             value: 12.12
    //         }
    //     })

    //     await expect(
    //         testDestination.testAction('addToCart', {
    //             event,
    //             settings,
    //             mapping: {
    //                 currency: {
    //                     '@path': '$.properties.currency'
    //                 },
    //                 value: {
    //                     '@path': '$.properties.value'
    //                 },
    //                 action_source: {
    //                     '@path': '$.properties.action_source'
    //                 },
    //                 event_time: {
    //                     '@path': '$.timestamp'
    //                 }
    //                 // No user data mapping included. This should cause action to fail.
    //             }
    //         })
    //     ).rejects.toThrowError("The root value is missing the required field 'user_data'.")
    // })

    // it('should send test_event_code if present in settings', async () => {
    //     nock(`https://graph.facebook.com/v${API_VERSION}/${settingsWithTestEventCode.pixelId}`)
    //         .post(`/events`)
    //         .reply(201, {})

    //     const event = createTestEvent({
    //         event: 'Product Added',
    //         userId: 'abc123',
    //         timestamp: '1631210000',
    //         properties: {
    //             action_source: 'email',
    //             currency: 'USD',
    //             value: 12.12,
    //             email: 'nicholas.aguilar@segment.com',
    //             traits: {
    //                 city: 'Gotham',
    //                 country: 'United States',
    //                 last_name: 'Wayne'
    //             }
    //         }
    //     })

    //     const responses = await testDestination.testAction('addToCart', {
    //         event,
    //         settings: settingsWithTestEventCode,
    //         mapping: {
    //             currency: {
    //                 '@path': '$.properties.currency'
    //             },
    //             value: {
    //                 '@path': '$.properties.value'
    //             },
    //             user_data: {
    //                 email: {
    //                     '@path': '$.properties.email'
    //                 }
    //             },
    //             action_source: {
    //                 '@path': '$.properties.action_source'
    //             },
    //             event_time: {
    //                 '@path': '$.timestamp'
    //             },
    //             custom_data: {
    //                 '@path': '$.properties.traits'
    //             }
    //         }
    //     })

    //     expect(responses.length).toBe(1)
    //     expect(responses[0].status).toBe(201)

    //     expect(responses[0].options.body).toMatchInlineSnapshot(
    //         `"{\\"data\\":[{\\"event_name\\":\\"AddToCart\\",\\"event_time\\":\\"1631210000\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\"},\\"custom_data\\":{\\"city\\":\\"Gotham\\",\\"country\\":\\"United States\\",\\"last_name\\":\\"Wayne\\",\\"currency\\":\\"USD\\",\\"value\\":12.12}}],\\"test_event_code\\":\\"1234567890\\"}"`
    //     )
    // })
  })
})
