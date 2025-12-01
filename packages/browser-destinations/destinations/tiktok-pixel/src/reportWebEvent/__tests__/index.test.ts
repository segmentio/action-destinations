import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import TikTokDestination, { destination } from '../../index'
import { TikTokPixel } from '../../types'
import { TRAVEL_FIELDS, VEHICLE_FIELDS } from '../../constants'

describe('TikTokPixel.reportWebEvent', () => {
  const settings = {
    pixelCode: '1234',
    useExistingPixel: false
  }

  let mockTtp: TikTokPixel
  let reportWebEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockTtp = {
        page: jest.fn(),
        identify: jest.fn(),
        track: jest.fn(),
        instance: jest.fn(() => mockTtp)
      }
      return Promise.resolve(mockTtp)
    })
  })

  test('sends "Pageview" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Page View',
        enabled: true,
        subscribe: 'type="page"',
        mapping: {
          event: 'Pageview'
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'page',
      anonymousId: 'anonymousId',
      userId: 'userId',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {}
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.track).toHaveBeenCalledWith(
      'Pageview',
      {
        contents: [],
        currency: 'USD'
      },
      {
        event_id: ''
      }
    )
  })

  test('maps properties correctly for "PlaceAnOrder" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Place an Order',
        enabled: true,
        subscribe: 'event = "Order Completed"',
        mapping: {
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'PlaceAnOrder',
          contents: {
            '@arrayPath': [
              '$.properties.products',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      anonymousId: 'anonymousId',
      userId: 'userId',
      event: 'Order Completed',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        products: [
          {
            product_id: '123',
            category: 'category1',
            quantity: 1,
            price: 1
          },
          {
            product_id: '456',
            category: 'category1',
            quantity: 2,
            price: 2
          }
        ],
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: ['+12345678900'],
        email: ['aaa@aaa.com'],
        description: 'test-description'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'PlaceAnOrder',
      {
        contents: [
          { content_id: '123', content_category: 'category1', price: 1, quantity: 1 },
          { content_id: '456', content_category: 'category1', price: 2, quantity: 2 }
        ],
        currency: 'USD',
        description: 'test-description',
        query: 'test-query',
        value: 10
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })

  test('maps properties correctly for "AddToCart" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Add to Cart',
        enabled: true,
        subscribe: 'event = "Product Added"',
        mapping: {
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'AddToCart',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      anonymousId: 'anonymousId',
      userId: 'userId',
      event: 'Product Added',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        product_id: '123',
        category: 'category1',
        quantity: 1,
        price: 1,
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: ['+12345678900'],
        email: ['aaa@aaa.com'],
        description: 'test-description'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'AddToCart',
      {
        contents: [{ content_id: '123', content_category: 'category1', price: 1, quantity: 1 }],
        currency: 'USD',
        description: 'test-description',
        query: 'test-query',
        value: 10
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })

  test('maps properties correctly for "ViewContent" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'View Content',
        enabled: true,
        subscribe: 'type="page"',
        mapping: {
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'ViewContent',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'page',
      anonymousId: 'anonymousId',
      userId: 'userId',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        product_id: '123',
        category: 'category1',
        quantity: 1,
        price: 1,
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: ['+12345678900'],
        email: ['aaa@aaa.com'],
        description: 'test-description'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'ViewContent',
      {
        contents: [{ content_id: '123', content_category: 'category1', price: 1, quantity: 1 }],
        currency: 'USD',
        description: 'test-description',
        query: 'test-query',
        value: 10
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })

  test('identifiers can be passed as strings only', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Place an Order',
        enabled: true,
        subscribe: 'event = "Order Completed"',
        mapping: {
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'PlaceAnOrder',
          contents: {
            '@arrayPath': [
              '$.properties.products',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      anonymousId: 'anonymousId',
      userId: 'userId',
      event: 'Order Completed',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        products: [
          {
            product_id: '123',
            category: 'category1',
            quantity: 1,
            price: 1
          },
          {
            product_id: '456',
            category: 'category1',
            quantity: 2,
            price: 2
          }
        ],
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: '+12345678900',
        email: 'aaa@aaa.com',
        description: 'test-description'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'PlaceAnOrder',
      {
        contents: [
          { content_id: '123', content_category: 'category1', price: 1, quantity: 1 },
          { content_id: '456', content_category: 'category1', price: 2, quantity: 2 }
        ],
        currency: 'USD',
        description: 'test-description',
        query: 'test-query',
        value: 10
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })

  test('maps properties correctly for "ViewContent" event for travel parameters', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'View Content',
        enabled: true,
        subscribe: 'type="page"',
        mapping: {
          event_spec_type: TRAVEL_FIELDS,
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'ViewContent',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          },
          travel_fields: {
            city: {
              '@path': '$.properties.city'
            },
            region: {
              '@path': '$.properties.region'
            },
            country: {
              '@path': '$.properties.country'
            },
            checkin_date: {
              '@path': '$.properties.checkin_date'
            },
            checkout_date: {
              '@path': '$.properties.checkout_date'
            },
            num_adults: {
              '@path': '$.properties.num_adults'
            },
            num_children: {
              '@path': '$.properties.num_children'
            },
            num_infants: {
              '@path': '$.properties.num_infants'
            },
            suggested_hotels: {
              '@path': '$.properties.suggested_hotels' // Confirmed this can be a single string or an array of strings
            },
            departing_departure_date: {
              '@path': '$.properties.departing_departure_date'
            },
            returning_departure_date: {
              '@path': '$.properties.returning_departure_date'
            },
            origin_airport: {
              '@path': '$.properties.origin_airport'
            },
            destination_airport: {
              '@path': '$.properties.destination_airport'
            },
            destination_ids: {
              '@path': '$.properties.destination_ids' // Confirmed this can be a single string or an array of strings
            },
            departing_arrival_date: {
              '@path': '$.properties.departing_arrival_date'
            },
            returning_arrival_date: {
              '@path': '$.properties.returning_arrival_date'
            },
            travel_class: {
              '@path': '$.properties.travel_class'
            },
            user_score: {
              '@path': '$.properties.user_score'
            },
            preferred_num_stops: {
              '@path': '$.properties.preferred_num_stops'
            },
            travel_start: {
              '@path': '$.properties.travel_start'
            },
            travel_end: {
              '@path': '$.properties.travel_end'
            },
            suggested_destinations: {
              '@path': '$.properties.suggested_destinations' // Confirmed this can be a single string or an array of strings
            }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'page',
      anonymousId: 'anonymousId',
      userId: 'userId',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        product_id: '123',
        category: 'category1',
        quantity: 1,
        price: 1,
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: ['+12345678900'],
        email: ['aaa@aaa.com'],
        description: 'test-description',
        city: 'test_city',
        region: 'test_region',
        country: 'test_country',
        checkin_date: 'test_checkin_date',
        checkout_date: 'test_checkout_date',
        num_adults: 1,
        num_children: 1,
        num_infants: 1,
        suggested_hotels: ['test_suggested_hotels_1', 'test_suggested_hotels_2'],
        departing_departure_date: '20250901',
        returning_departure_date: '20250901',
        origin_airport: 'test_origin_airport',
        destination_airport: 'test_destination_airport',
        destination_ids: ['destination_ids_1', 'destination_ids_2'],
        departing_arrival_date: '20250901',
        returning_arrival_date: '20250901',
        travel_class: 'eco',
        user_score: 1,
        preferred_num_stops: 0,
        travel_start: '20250901',
        travel_end: '20250901',
        suggested_destinations: ['suggested_destinations_1', 'suggested_destinations_2']
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'ViewContent',
      {
        contents: [{ content_id: '123', content_category: 'category1', price: 1, quantity: 1 }],
        country: "test_country",
        currency: 'USD',
        departing_arrival_date: "20250901",
        departing_departure_date: "20250901",
        description: 'test-description',
        destination_airport: "test_destination_airport",
        destination_ids: [
          "destination_ids_1",
          "destination_ids_2"
        ],
        num_adults: 1,
        num_children: 1,
        num_infants:1,
        origin_airport: "test_origin_airport",
        preferred_num_stops: 0,
        region: 'test_region',
        returning_arrival_date: '20250901',
        returning_departure_date: '20250901',
        suggested_destinations: ['suggested_destinations_1', 'suggested_destinations_2'],
        suggested_hotels: ['test_suggested_hotels_1', 'test_suggested_hotels_2'],
        travel_class: 'eco',
        travel_start: '20250901',
        travel_end: '20250901',
        user_score: 1,
        query: 'test-query',
        value: 10,
        city: 'test_city',
        checkin_date: 'test_checkin_date',
        checkout_date: 'test_checkout_date'
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })

  test('maps properties correctly for "ViewContent" event with auto parameters', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'View Content',
        enabled: true,
        subscribe: 'type="page"',
        mapping: {
          event_spec_type: VEHICLE_FIELDS,
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'ViewContent',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_category: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          },
          postal_code: {
            '@path': '$.properties.postal_code'
          },
          vehicle_fields: {
            postal_code: {
              '@path': '$.properties.postal_code'
            },
            make: {
              '@path': '$.properties.make'
            },
            model: {
              '@path': '$.properties.model'
            },
            year: {
              '@path': '$.properties.year'
            },
            state_of_vehicle: {
              '@path': '$.properties.state_of_vehicle'
            },
            mileage_value: {
              '@path': '$.properties.mileage_value'
            },
            mileage_unit: {
              '@path': '$.properties.mileage_unit'
            },
            exterior_color: {
              '@path': '$.properties.exterior_color'
            },
            transmission: {
              '@path': '$.properties.transmission'
            },
            body_style: {
              '@path': '$.properties.body_style'
            },
            fuel_type: {
              '@path': '$.properties.fuel_type'
            },
            drivetrain: {
              '@path': '$.properties.drive_train'
            },
            preferred_price_range_min: {
              '@path': '$.properties.preferred_price_range_min'
            },
            preferred_price_range_max: {
              '@path': '$.properties.preferred_price_range_max'
            },
            trim: {
              '@path': '$.properties.trim'
            },
            vin: {
              '@path': '$.properties.vin'
            },
            interior_color: {
              '@path': '$.properties.interior_color'
            },
            condition_of_vehicle: {
              '@path': '$.properties.condition_of_vehicle'
            },
            viewcontent_type: {
              '@path': '$.properties.viewcontent_type'
            },
            search_type: {
              '@path': '$.properties.search_type'
            },
            registration_type: {
              '@path': '$.properties.registration_type'
            }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'page',
      anonymousId: 'anonymousId',
      userId: 'userId',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        product_id: '123',
        category: 'category1',
        quantity: 1,
        price: 1,
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: ['+12345678900'],
        email: ['aaa@aaa.com'],
        description: 'test-description',
        postal_code: 'test_postal_code',
        make: 'test_make',
        model: 'test_model',
        year: 2020,
        state_of_vehicle: 'New',
        mileage_value: 12345,
        mileage_unit: 'MI',
        exterior_color: 'test_exterior_color',
        transmission: 'Automatic',
        body_style: 'Coupe',
        fuel_type: 'Diesel',
        drive_train: 'AWD',
        preferred_price_range_min: 1000,
        preferred_price_range_max: 2000,
        trim: 'test_trim',
        vin: 'test_vin',
        interior_color: 'test_interior_color',
        condition_of_vehicle: 'Good'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'ViewContent',
      {
        contents: [{ content_id: '123', content_category: 'category1', price: 1, quantity: 1 }],
        currency: 'USD',
        description: 'test-description',
        query: 'test-query',
        value: 10,
        postal_code: 'test_postal_code',
        make: 'test_make',
        model: 'test_model',
        year: 2020,
        state_of_vehicle: 'New',
        mileage: { unit: 'MI', value: 12345 },
        exterior_color: 'test_exterior_color',
        transmission: 'Automatic',
        body_style: 'Coupe',
        fuel_type: 'Diesel',
        drivetrain: 'AWD',
        preferred_price_range: [1000, 2000],
        trim: 'test_trim',
        vin: 'test_vin',
        interior_color: 'test_interior_color',
        condition_of_vehicle: 'Good'
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })
})
