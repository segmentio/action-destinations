import { PayloadValidationError } from '@segment/actions-core'
import { EventType } from '../common/event'
import { EventPayload as SegmentEventPayload } from '../common/payload/segment'
import { EventPayload as MolocoEventPayload } from '../common/payload/moloco'

import { convertEvent } from '../common/convert'

const TEST_EVENT_TYPE = EventType.Home

describe('Moloco MCM', () => {
  describe('testConvertEvent', () => {
    it('tests an event payload with all fields', async () => {
      const input: SegmentEventPayload = {
        event_id: '12e64c12-f386-42c9-871b-8dg3e539ad19',
        timestamp: '2024-02-05T23:37:42.848Z',
        user_id: 'wcsf20ge-c3d5-11ee-9a73-0n5e570313ef',
        device: {
          os: 'IOS',
          os_version: '15.0.2',
          advertising_id: '7acefbed-d1f6-4e4e-aa26-74e93dd017e4',
          unique_device_id: '2b6f0cc904d137be2e1730235f5664094b831186',
          model: 'iPhone 12',
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF',
          language: 'en',
          ip: '1192.158.1.38'
        },
        session_id: 'c3d5-fewf-11ee-9a73-0n5e570313ef',
        items: [
          {
            id: '123',
            currency: 'USD',
            price: 12.34,
            quantity: 1,
            seller_id: 'cs032b-11ee-9a73-0n5e570313ef'
          },
          {
            id: '456',
            currency: 'USD',
            price: 56.78,
            quantity: 2,
            seller_id: 'cs032b-11ee-9a73-w5e570313ef'
          }
        ],
        revenue: {
          currency: 'USD',
          price: 69.12
        },
        search_query: 'iphone',
        page_id: '/home',
        referrer_page_id: 'google.com',
        shipping_charge: {
          currency: 'USD',
          price: 5.0
        }
      }

      const expectedOutput: MolocoEventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: '12e64c12-f386-42c9-871b-8dg3e539ad19',
        channel_type: 'APP',
        timestamp: '2024-02-05T23:37:42.848Z',
        user_id: 'wcsf20ge-c3d5-11ee-9a73-0n5e570313ef',
        device: {
          os: 'IOS',
          os_version: '15.0.2',
          advertising_id: '7acefbed-d1f6-4e4e-aa26-74e93dd017e4',
          unique_device_id: '2b6f0cc904d137be2e1730235f5664094b831186',
          model: 'iPhone 12',
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF',
          language: 'en',
          ip: '1192.158.1.38'
        },
        session_id: 'c3d5-fewf-11ee-9a73-0n5e570313ef',
        items: [
          {
            id: '123',
            price: {
              currency: 'USD',
              amount: 12.34
            },
            quantity: 1,
            seller_id: 'cs032b-11ee-9a73-0n5e570313ef'
          },
          {
            id: '456',
            price: {
              currency: 'USD',
              amount: 56.78
            },
            quantity: 2,
            seller_id: 'cs032b-11ee-9a73-w5e570313ef'
          }
        ],
        revenue: {
          currency: 'USD',
          amount: 69.12
        },
        search_query: 'iphone',
        page_id: '/home',
        referrer_page_id: 'google.com',
        shipping_charge: {
          currency: 'USD',
          amount: 5.0
        }
      }

      const output: MolocoEventPayload = convertEvent({
        eventType: TEST_EVENT_TYPE,
        payload: input,
        settings: {
          channel_type: 'APP',
          platformId: 'any_plat_id',
          platformName: 'any_plat_name',
          apiKey: 'any_api_key'
        }
      })
      expect(output).toEqual(expectedOutput)
    })

    it('tests an event payload with all fields, but os.name should be capitalized', async () => {
      const input: SegmentEventPayload = {
        event_id: '12e64c12-f386-42c9-871b-8dg3e539ad19',
        timestamp: '2024-02-05T23:37:42.848Z',
        user_id: 'wcsf20ge-c3d5-11ee-9a73-0n5e570313ef',
        device: {
          os: 'iOS',
          os_version: '15.0.2',
          advertising_id: '7acefbed-d1f6-4e4e-aa26-74e93dd017e4',
          unique_device_id: '2b6f0cc904d137be2e1730235f5664094b831186',
          model: 'iPhone 12',
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF',
          language: 'en',
          ip: '1192.158.1.38'
        },
        session_id: 'c3d5-fewf-11ee-9a73-0n5e570313ef',
        items: [
          {
            id: '123',
            currency: 'USD',
            price: 12.34,
            quantity: 1,
            seller_id: 'cs032b-11ee-9a73-0n5e570313ef'
          },
          {
            id: '456',
            currency: 'USD',
            price: 56.78,
            quantity: 2,
            seller_id: 'cs032b-11ee-9a73-w5e570313ef'
          }
        ],
        revenue: {
          currency: 'USD',
          price: 69.12
        },
        search_query: 'iphone',
        page_id: '/home',
        referrer_page_id: 'google.com',
        shipping_charge: {
          currency: 'USD',
          price: 5.0
        }
      }

      const expectedOutput: MolocoEventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: '12e64c12-f386-42c9-871b-8dg3e539ad19',
        channel_type: 'APP',
        timestamp: '2024-02-05T23:37:42.848Z',
        user_id: 'wcsf20ge-c3d5-11ee-9a73-0n5e570313ef',
        device: {
          os: 'IOS',
          os_version: '15.0.2',
          advertising_id: '7acefbed-d1f6-4e4e-aa26-74e93dd017e4',
          unique_device_id: '2b6f0cc904d137be2e1730235f5664094b831186',
          model: 'iPhone 12',
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF',
          language: 'en',
          ip: '1192.158.1.38'
        },
        session_id: 'c3d5-fewf-11ee-9a73-0n5e570313ef',
        items: [
          {
            id: '123',
            price: {
              currency: 'USD',
              amount: 12.34
            },
            quantity: 1,
            seller_id: 'cs032b-11ee-9a73-0n5e570313ef'
          },
          {
            id: '456',
            price: {
              currency: 'USD',
              amount: 56.78
            },
            quantity: 2,
            seller_id: 'cs032b-11ee-9a73-w5e570313ef'
          }
        ],
        revenue: {
          currency: 'USD',
          amount: 69.12
        },
        search_query: 'iphone',
        page_id: '/home',
        referrer_page_id: 'google.com',
        shipping_charge: {
          currency: 'USD',
          amount: 5.0
        }
      }

      const output: MolocoEventPayload = convertEvent({
        eventType: TEST_EVENT_TYPE,
        payload: input,
        settings: {
          channel_type: 'APP',
          platformId: 'any_plat_id',
          platformName: 'any_plat_name',
          apiKey: 'any_api_key'
        }
      })
      expect(output).toEqual(expectedOutput)
    })

    it('tests an event payload with iPadOS, it should be converted into IOS', async () => {
      const input: SegmentEventPayload = {
        event_id: '12e64c12-f386-42c9-871b-8dg3e539ad19',
        timestamp: '2024-02-05T23:37:42.848Z',
        user_id: 'wcsf20ge-c3d5-11ee-9a73-0n5e570313ef',
        device: {
          os: 'iPadOS',
          os_version: '15.0.2',
          advertising_id: '7acefbed-d1f6-4e4e-aa26-74e93dd017e4',
          unique_device_id: '2b6f0cc904d137be2e1730235f5664094b831186',
          model: 'iPhone 12',
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF',
          language: 'en',
          ip: '1192.158.1.38'
        },
        session_id: 'c3d5-fewf-11ee-9a73-0n5e570313ef',
        items: [
          {
            id: '123',
            currency: 'USD',
            price: 12.34,
            quantity: 1,
            seller_id: 'cs032b-11ee-9a73-0n5e570313ef'
          },
          {
            id: '456',
            currency: 'USD',
            price: 56.78,
            quantity: 2,
            seller_id: 'cs032b-11ee-9a73-w5e570313ef'
          }
        ],
        revenue: {
          currency: 'USD',
          price: 69.12
        },
        search_query: 'iphone',
        page_id: '/home',
        referrer_page_id: 'google.com',
        shipping_charge: {
          currency: 'USD',
          price: 5.0
        }
      }

      const expectedOutput: MolocoEventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: '12e64c12-f386-42c9-871b-8dg3e539ad19',
        channel_type: 'APP',
        timestamp: '2024-02-05T23:37:42.848Z',
        user_id: 'wcsf20ge-c3d5-11ee-9a73-0n5e570313ef',
        device: {
          os: 'IOS',
          os_version: '15.0.2',
          advertising_id: '7acefbed-d1f6-4e4e-aa26-74e93dd017e4',
          unique_device_id: '2b6f0cc904d137be2e1730235f5664094b831186',
          model: 'iPhone 12',
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF',
          language: 'en',
          ip: '1192.158.1.38'
        },
        session_id: 'c3d5-fewf-11ee-9a73-0n5e570313ef',
        items: [
          {
            id: '123',
            price: {
              currency: 'USD',
              amount: 12.34
            },
            quantity: 1,
            seller_id: 'cs032b-11ee-9a73-0n5e570313ef'
          },
          {
            id: '456',
            price: {
              currency: 'USD',
              amount: 56.78
            },
            quantity: 2,
            seller_id: 'cs032b-11ee-9a73-w5e570313ef'
          }
        ],
        revenue: {
          currency: 'USD',
          amount: 69.12
        },
        search_query: 'iphone',
        page_id: '/home',
        referrer_page_id: 'google.com',
        shipping_charge: {
          currency: 'USD',
          amount: 5.0
        }
      }

      const output: MolocoEventPayload = convertEvent({
        eventType: TEST_EVENT_TYPE,
        payload: input,
        settings: {
          channel_type: 'APP',
          platformId: 'any_plat_id',
          platformName: 'any_plat_name',
          apiKey: 'any_api_key'
        }
      })
      expect(output).toEqual(expectedOutput)
    })

    it('tests an event payload with a missing field (session_id)', async () => {
      const input: SegmentEventPayload = {
        event_id: '12e64c12-f386-42c9-871b-8dg3e539ad19',
        timestamp: '2024-02-05T23:37:42.848Z',
        user_id: 'wcsf20ge-c3d5-11ee-9a73-0n5e570313ef',
        device: {
          os: 'IOS',
          os_version: '15.0.2',
          advertising_id: '7acefbed-d1f6-4e4e-aa26-74e93dd017e4',
          unique_device_id: '2b6f0cc904d137be2e1730235f5664094b831186',
          model: 'iPhone 12',
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF',
          language: 'en',
          ip: '1192.158.1.38'
        },
        items: [
          {
            id: '123',
            currency: 'USD',
            price: 12.34,
            quantity: 1,
            seller_id: 'cs032b-11ee-9a73-0n5e570313ef'
          },
          {
            id: '456',
            currency: 'USD',
            price: 56.78,
            quantity: 2,
            seller_id: 'cs032b-11ee-9a73-w5e570313ef'
          }
        ],
        revenue: {
          currency: 'USD',
          price: 69.12
        },
        search_query: 'iphone',
        page_id: '/home',
        referrer_page_id: 'google.com',
        shipping_charge: {
          currency: 'USD',
          price: 5.0
        }
      }

      const expectedOutput: MolocoEventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: '12e64c12-f386-42c9-871b-8dg3e539ad19',
        channel_type: 'APP',
        timestamp: '2024-02-05T23:37:42.848Z',
        user_id: 'wcsf20ge-c3d5-11ee-9a73-0n5e570313ef',
        device: {
          os: 'IOS',
          os_version: '15.0.2',
          advertising_id: '7acefbed-d1f6-4e4e-aa26-74e93dd017e4',
          unique_device_id: '2b6f0cc904d137be2e1730235f5664094b831186',
          model: 'iPhone 12',
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF',
          language: 'en',
          ip: '1192.158.1.38'
        },
        items: [
          {
            id: '123',
            price: {
              currency: 'USD',
              amount: 12.34
            },
            quantity: 1,
            seller_id: 'cs032b-11ee-9a73-0n5e570313ef'
          },
          {
            id: '456',
            price: {
              currency: 'USD',
              amount: 56.78
            },
            quantity: 2,
            seller_id: 'cs032b-11ee-9a73-w5e570313ef'
          }
        ],
        revenue: {
          currency: 'USD',
          amount: 69.12
        },
        search_query: 'iphone',
        page_id: '/home',
        referrer_page_id: 'google.com',
        shipping_charge: {
          currency: 'USD',
          amount: 5.0
        }
      }

      const output: MolocoEventPayload = convertEvent({
        eventType: TEST_EVENT_TYPE,
        payload: input,
        settings: {
          channel_type: 'APP',
          platformId: 'any_plat_id',
          platformName: 'any_plat_name',
          apiKey: 'any_api_key'
        }
      })
      expect(output).toEqual(expectedOutput)
    })

    it('tests whether items with price by without currency throws a validation error', async () => {
      const input: SegmentEventPayload = {
        event_id: '12e64c12-f386-42c9-871b-8dg3e539ad19',
        timestamp: '2024-02-05T23:37:42.848Z',
        user_id: 'wcsf20ge-c3d5-11ee-9a73-0n5e570313ef',
        device: {
          os: 'IOS',
          os_version: '15.0.2',
          advertising_id: '7acefbed-d1f6-4e4e-aa26-74e93dd017e4',
          unique_device_id: '2b6f0cc904d137be2e1730235f5664094b831186',
          model: 'iPhone 12',
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF',
          language: 'en',
          ip: '1192.158.1.38'
        },
        session_id: 'c3d5-fewf-11ee-9a73-0n5e570313ef',
        items: [
          {
            id: '123',
            price: 12.34,
            quantity: 1,
            seller_id: 'cs032b-11ee-9a73-0n5e570313ef'
          },
          {
            id: '456',
            currency: 'USD',
            price: 56.78,
            quantity: 2,
            seller_id: 'cs032b-11ee-9a73-w5e570313ef'
          }
        ]
      }

      expect(() =>
        convertEvent({
          eventType: TEST_EVENT_TYPE,
          payload: input,
          settings: {
            channel_type: 'APP',
            platformId: 'any_plat_id',
            platformName: 'any_plat_name',
            apiKey: 'any_api_key'
          }
        })
      ).toThrowError(PayloadValidationError)
    })
  })
})
