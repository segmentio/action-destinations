import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import CJDestination, { destination } from '../../index'
import { CJ } from '../../types'
import * as sendModule from '../../utils'
import * as orderModule from '../utils'
import { allVerticals, travelVerticals, financeVerticals, networkServicesVerticals } from '../order-fields'

describe('CJ init', () => {
  const settings = {
    tagId: '123456789',
    actionTrackerId: '987654321'
  }

  const testCookieName = 'cjeventOrder'
  let mockCJ: CJ
  let orderEvent: any
  beforeEach(async () => {
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockCJ = {} as CJ
      return Promise.resolve(mockCJ)
    })

    document.cookie = `${testCookieName}=testcCookieValue`

    jest.spyOn(sendModule, 'send').mockImplementation(() => {
      return Promise.resolve()
    })

    jest.spyOn(orderModule, 'setOrderJSON')
    
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('CJ pixel order event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'order',
        name: 'order',
        enabled: true,
        subscribe: 'type = "track" and event = "Order Completed"',
        mapping: {
          userId: { '@path': '$.userId' },
          enterpriseId: 999999,
          pageType: 'conversionConfirmation',
          emailHash: {
            '@if': {
              exists: { '@path': '$.context.traits.email' },
              then: { '@path': '$.context.traits.email' },
              else: { '@path': '$.properties.email' }
            }
          },
          orderId: { '@path': '$.properties.order_id' },
          currency: { '@path': '$.properties.currency' },
          amount: { '@path': '$.properties.total' },
          discount:  { '@path': '$.properties.discount' },
          coupon: { '@path': '$.properties.coupon' },
          cjeventOrderCookieName: testCookieName,
          items: {
            '@arrayPath': [
              '$.properties.products',
              {
                itemPrice: { '@path': '$.price' },
                itemId: { '@path': '$.id' },
                quantity: { '@path': '$.quantity' },
                discount: { '@path': '$.discount' }
              }
            ]
          }
        }
      }
    ]
    const context = new Context({
      type: 'track',
      event: 'Order Completed',
      userId: 'userId-abc123',
      context: {
        traits: {
          email: 'test@test.com'
        }
      },
      properties: {
        order_id: 'abc12345',
        currency: 'USD',
        coupon: 'COUPON1',
        quantity: 5,
        total: 10.99,
        discount: 1,
        products: [
          {
            id: '123',
            quantity: 1,
            price: 1,
            discount: 0.5
          },
          {
            id: '456',
            quantity: 2,
            price: 2,
            discount: 0
          }
        ]
      }
    })
    const [event] = await CJDestination({
      ...settings,
      subscriptions
    })

    const orderJSON = {
        trackingSource: 'Segment',
        userId: 'userId-abc123',
        enterpriseId: 999999,
        pageType: 'conversionConfirmation',
        emailHash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
        orderId: 'abc12345',
        actionTrackerId: "987654321",
        currency: 'USD',
        amount: 10.99,
        discount: 1,
        coupon: 'COUPON1',
        cjeventOrder: 'testcCookieValue',
        items:[
          {
            itemId: '123',
            quantity: 1,
            itemPrice: 1,
            discount: 0.5
          },
          {
            itemId: '456',
            quantity: 2,
            itemPrice: 2,
            discount: 0
          }
        ]
    }

    orderEvent = event
    const sendSpy = jest.spyOn(sendModule, 'send').mockResolvedValue(undefined)
    await orderEvent.load(Context.system(), {} as Analytics)
    await orderEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalledWith(
      {}, 
      orderJSON
    )
    expect(sendSpy).toHaveBeenCalledWith('123456789') 
    expect(mockCJ.sitePage).toBe(undefined)
    expect(mockCJ.order).toBe(undefined)
  })

  test('CJ pixel order event with pre-hashed email', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'order',
        name: 'order',
        enabled: true,
        subscribe: 'type = "track" and event = "Order Completed"',
        mapping: {
          userId: { '@path': '$.userId' },
          enterpriseId: 999999,
          pageType: 'conversionConfirmation',
          emailHash: {
            '@if': {
              exists: { '@path': '$.context.traits.email' },
              then: { '@path': '$.context.traits.email' },
              else: { '@path': '$.properties.email' }
            }
          },
          orderId: { '@path': '$.properties.order_id' },
          currency: { '@path': '$.properties.currency' },
          amount: { '@path': '$.properties.total' },
          discount:  { '@path': '$.properties.discount' },
          coupon: { '@path': '$.properties.coupon' },
          cjeventOrderCookieName: testCookieName,
          items: {
            '@arrayPath': [
              '$.properties.products',
              {
                itemPrice: { '@path': '$.price' },
                itemId: { '@path': '$.id' },
                quantity: { '@path': '$.quantity' },
                discount: { '@path': '$.discount' }
              }
            ]
          }
        }
      }
    ]
    const context = new Context({
      type: 'track',
      event: 'Order Completed',
      userId: 'userId-abc123',
      context: {
        traits: {
          email: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a'
        }
      },
      properties: {
        order_id: 'abc12345',
        currency: 'USD',
        coupon: 'COUPON1',
        quantity: 5,
        total: 10.99,
        discount: 1,
        products: [
          {
            id: '123',
            quantity: 1,
            price: 1,
            discount: 0.5
          },
          {
            id: '456',
            quantity: 2,
            price: 2,
            discount: 0
          }
        ]
      }
    })
    const [event] = await CJDestination({
      ...settings,
      subscriptions
    })

    const orderJSON = {
        trackingSource: 'Segment',
        userId: 'userId-abc123',
        enterpriseId: 999999,
        pageType: 'conversionConfirmation',
        emailHash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
        orderId: 'abc12345',
        actionTrackerId: "987654321",
        currency: 'USD',
        amount: 10.99,
        discount: 1,
        coupon: 'COUPON1',
        cjeventOrder: 'testcCookieValue',
        items:[
          {
            itemId: '123',
            quantity: 1,
            itemPrice: 1,
            discount: 0.5
          },
          {
            itemId: '456',
            quantity: 2,
            itemPrice: 2,
            discount: 0
          }
        ]
    }

    orderEvent = event
    const sendSpy = jest.spyOn(sendModule, 'send').mockResolvedValue(undefined)
    await orderEvent.load(Context.system(), {} as Analytics)
    await orderEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalledWith(
      {}, 
      orderJSON
    )
    expect(sendSpy).toHaveBeenCalledWith('123456789') 
    expect(mockCJ.sitePage).toBe(undefined)
    expect(mockCJ.order).toBe(undefined)
  })

  test('CJ pixel order event with All Verticals field data', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'order',
        name: 'order',
        enabled: true,
        subscribe: 'type = "track" and event = "Order Completed"',
        mapping: {
          userId: { '@path': '$.userId' },
          enterpriseId: 999999,
          pageType: 'conversionConfirmation',
          emailHash: {
            '@if': {
              exists: { '@path': '$.context.traits.email' },
              then: { '@path': '$.context.traits.email' },
              else: { '@path': '$.properties.email' }
            }
          },
          orderId: { '@path': '$.properties.order_id' },
          currency: { '@path': '$.properties.currency' },
          amount: { '@path': '$.properties.total' },
          discount:  { '@path': '$.properties.discount' },
          coupon: { '@path': '$.properties.coupon' },
          cjeventOrderCookieName: testCookieName,
          items: {
            '@arrayPath': [
              '$.properties.products',
              {
                itemPrice: { '@path': '$.price' },
                itemId: { '@path': '$.id' },
                quantity: { '@path': '$.quantity' },
                discount: { '@path': '$.discount' }
              }
            ]
          },
          allVerticals: allVerticals.default
        }
      }
    ]
    const context = new Context({
      type: 'track',
      event: 'Order Completed',
      userId: 'userId-abc123',
      context: {
        traits: {
          email: 'test@test.com'
        }
      },
      properties: {
        order_id: 'abc12345',
        currency: 'USD',
        coupon: 'COUPON1',
        quantity: 5,
        total: 10.99,
        discount: 1,
        products: [
          {
            id: '123',
            quantity: 1,
            price: 1,
            discount: 0.5
          },
          {
            id: '456',
            quantity: 2,
            price: 2,
            discount: 0
          }
        ],
        // All Verticals fields
        brand: 'Nike',
        brand_id: 'BR123',
        business_unit: 'Online',
        campaign_id: 'CAMP456',
        campaign_name: 'BackToSchool',
        category: 'Footwear',
        class: 'Premium',
        confirmation_number: 999888777,
        coupon_discount: 15,
        coupon_type: 'percent',
        customer_country: 'US',
        customer_segment: 'Loyal',
        customer_status: 'Return',
        customer_type: 'GroupBuyer',
        delivery: 'STANDARD',
        description: 'Running shoes',
        duration: 7,
        end_date_time: '2025-08-06T18:30:00Z',
        genre: 'Sports',
        item_id: 'ITEM999',
        item_name: 'Air Max',
        item_type: 'Sneakers',
        lifestage: 'Adult',
        location: 'NY',
        loyalty_earned: 200,
        loyalty_first_time_signup: 'Yes',
        loyalty_level: 'Gold',
        loyalty_redeemed: 50,
        loyalty_status: 'Yes',
        margin: '15%',
        marketing_channel: 'affiliate',
        no_cancellation: 'No',
        order_subtotal: 120,
        payment_method: 'credit_debit_card',
        payment_model: 'OneTime',
        platform_id: 'ios',
        point_of_sale: 'INTERNET',
        preorder: 'No',
        prepaid: 'Yes',
        promotion: 'SUMMER20',
        promotion_amount: 20,
        promotion_condition_threshold: 100,
        promotion_condition_type: 'LOYALTY_REQUIRED',
        promotion_ends: '2025-08-10T00:00:00Z',
        promotion_starts: '2025-08-01T00:00:00Z',
        promotion_type: 'PERCENT_OFF',
        rating: '4.5',
        service_type: 'wireless',
        start_date_time: '2025-08-05T10:00:00Z',
        subscription_fee: 9.99,
        subscription_length: '12 months',
        tax_amount: 10,
        tax_type: 'STATE',
        upsell: 'Yes'
      }
    })
    const [event] = await CJDestination({
      ...settings,
      subscriptions
    })

    const orderJSON = {
      trackingSource: 'Segment',
      userId: 'userId-abc123',
      enterpriseId: 999999,
      pageType: 'conversionConfirmation',
      emailHash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
      orderId: 'abc12345',
      actionTrackerId: '987654321',
      currency: 'USD',
      amount: 10.99,
      discount: 1,
      coupon: 'COUPON1',
      cjeventOrder: 'testcCookieValue',
      items: [
        {
          itemId: '123',
          quantity: 1,
          itemPrice: 1,
          discount: 0.5
        },
        {
          itemId: '456',
          quantity: 2,
          itemPrice: 2,
          discount: 0
        }
      ],
      // All Verticals fields
      brand: 'Nike',
      brandId: 'BR123',
      businessUnit: 'Online',
      campaignId: 'CAMP456',
      campaignName: 'BackToSchool',
      category: 'Footwear',
      class: 'Premium',
      confirmationNumber: 999888777,
      couponDiscount: 15,
      couponType: 'percent',
      customerSegment: 'Loyal',
      customerStatus: 'Return',
      customerType: 'GroupBuyer',
      delivery: 'STANDARD',
      description: 'Running shoes',
      duration: 7,
      endDateTime: '2025-08-06T18:30:00Z',
      genre: 'Sports',
      itemId: 'ITEM999',
      itemName: 'Air Max',
      itemType: 'Sneakers',
      lifestage: 'Adult',
      location: 'NY',
      loyaltyEarned: 200,
      loyaltyFirstTimeSignup: 'Yes',
      loyaltyLevel: 'Gold',
      loyaltyRedeemed: 50,
      loyaltyStatus: 'Yes',
      margin: '15%',
      marketingChannel: 'affiliate',
      noCancellation: 'No',
      orderSubtotal: 120,
      paymentMethod: 'credit_debit_card',
      paymentModel: 'OneTime',
      platformId: 'ios',
      pointOfSale: 'INTERNET',
      preorder: 'No',
      prepaid: 'Yes',
      promotion: 'SUMMER20',
      promotionAmount: 20,
      promotionConditionThreshold: 100,
      promotionConditionType: 'LOYALTY_REQUIRED',
      promotionEnds: '2025-08-10T00:00:00Z',
      promotionStarts: '2025-08-01T00:00:00Z',
      promotionType: 'PERCENT_OFF',
      quantity: 5,
      rating: '4.5',
      serviceType: 'wireless',
      startDateTime: '2025-08-05T10:00:00Z',
      subscriptionFee: 9.99,
      subscriptionLength: '12 months',
      taxAmount: 10,
      taxType: 'STATE',
      upsell: 'Yes'
    }

    orderEvent = event
    const sendSpy = jest.spyOn(sendModule, 'send').mockResolvedValue(undefined)
    await orderEvent.load(Context.system(), {} as Analytics)
    await orderEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalledWith(
      {}, 
      orderJSON
    )
    expect(sendSpy).toHaveBeenCalledWith('123456789') 
    expect(mockCJ.sitePage).toBe(undefined)
    expect(mockCJ.order).toBe(undefined)
  })
  
  test('CJ pixel order event with Travel Vertical data', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'order',
        name: 'order',
        enabled: true,
        subscribe: 'type = "track" and event = "Order Completed"',
        mapping: {
          verticalType: 'travel',
          userId: { '@path': '$.userId' },
          enterpriseId: 999999,
          pageType: 'conversionConfirmation',
          emailHash: {
            '@if': {
              exists: { '@path': '$.context.traits.email' },
              then: { '@path': '$.context.traits.email' },
              else: { '@path': '$.properties.email' }
            }
          },
          orderId: { '@path': '$.properties.order_id' },
          currency: { '@path': '$.properties.currency' },
          amount: { '@path': '$.properties.total' },
          discount:  { '@path': '$.properties.discount' },
          coupon: { '@path': '$.properties.coupon' },
          cjeventOrderCookieName: testCookieName,
          items: {
            '@arrayPath': [
              '$.properties.products',
              {
                itemPrice: { '@path': '$.price' },
                itemId: { '@path': '$.id' },
                quantity: { '@path': '$.quantity' },
                discount: { '@path': '$.discount' }
              }
            ]
          },
          travelVerticals: travelVerticals.default
        }
      }
    ]
    const context = new Context({
      type: 'track',
      event: 'Order Completed',
      userId: 'userId-abc123',
      context: {
        traits: {
          email: 'test@test.com'
        }
      },
      properties: {
        order_id: 'abc12345',
        currency: 'USD',
        coupon: 'COUPON1',
        quantity: 5,
        total: 10.99,
        discount: 1,
        products: [
          {
            id: '123',
            quantity: 1,
            price: 1,
            discount: 0.5
          },
          {
            id: '456',
            quantity: 2,
            price: 2,
            discount: 0
          }
        ],
        booking_date: '2025-08-06T18:30:00Z',
        booking_status: 'Booking Status Test Value',
        booking_value_post_tax: 100,
        booking_value_pre_tax: 900,
        car_options: 'insurance',
        class: 'first',
        cruise_type: 'Alaskan',
        destination_city: 'London',
        destination_country: 'UK',
        destination_state: 'France',
        domestic: 'NO',
        dropoff_iata: 'DUB',
        dropoff_id: 'CDG',
        flight_fare_type: 'gotta get away',
        flight_options: 'wifi',
        flight_type: 'ROUND_TRIP',
        flyer_miles: 8000,
        guests: 2,
        iata: 'CDG,LHR,DUB',
        itinerary_id: 'itinerary_id_1',
        minimum_stay_duration: 9,
        origin_city: 'DUB',
        origin_country: 'IE',
        origin_state: 'US-AK',
        paid_at_booking_post_tax: 100,
        paid_at_booking_pre_tax: 90,
        pickup_iata: 'LRH',
        pickup_id: 'test_pickup+id',
        port: 'SYD',
        room_type: 'Double room',
        rooms: 3,
        ship_name: 'Titanic',
        travel_type: 'CRUISE'
      }
    })
    const [event] = await CJDestination({
      ...settings,
      subscriptions
    })

    const orderJSON = {
      trackingSource: 'Segment',
      userId: 'userId-abc123',
      enterpriseId: 999999,
      pageType: 'conversionConfirmation',
      emailHash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
      orderId: 'abc12345',
      actionTrackerId: '987654321',
      currency: 'USD',
      amount: 10.99,
      discount: 1,
      coupon: 'COUPON1',
      cjeventOrder: 'testcCookieValue',
      items: [
        {
          itemId: '123',
          quantity: 1,
          itemPrice: 1,
          discount: 0.5
        },
        {
          itemId: '456',
          quantity: 2,
          itemPrice: 2,
          discount: 0
        }
      ],
      bookingDate: '2025-08-06T18:30:00Z',
      bookingStatus: 'Booking Status Test Value',
      bookingValuePostTax: 100,
      bookingValuePreTax: 900,
      carOptions: 'insurance',
      class: 'first',
      cruiseType: 'Alaskan',
      destinationCity: 'London',
      destinationCountry: 'UK',
      destinationState: 'France',
      domestic: 'NO',
      dropoffIata: 'DUB',
      dropoffId: 'CDG',
      flightFareType: 'gotta get away',
      flightOptions: 'wifi',
      flightType: 'ROUND_TRIP',
      flyerMiles: 8000,
      guests: 2,
      iata: 'CDG,LHR,DUB',
      itineraryId: 'itinerary_id_1',
      minimumStayDuration: 9,
      originCity: 'DUB',
      originCountry: 'IE',
      originState: 'US-AK',
      paidAtBookingPostTax: 100,
      paidAtBookingPreTax: 90,
      pickupIata: 'LRH',
      pickupId: 'test_pickup+id',
      port: 'SYD',
      roomType: 'Double room',
      rooms: 3,
      shipName: 'Titanic',
      travelType: 'CRUISE'
    }

    orderEvent = event
    const sendSpy = jest.spyOn(sendModule, 'send').mockResolvedValue(undefined)
    await orderEvent.load(Context.system(), {} as Analytics)
    await orderEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalledWith(
      {}, 
      orderJSON
    )
    expect(sendSpy).toHaveBeenCalledWith('123456789') 
    expect(mockCJ.sitePage).toBe(undefined)
    expect(mockCJ.order).toBe(undefined)
  })

  test('CJ pixel order event with Finance Vertical data', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'order',
        name: 'order',
        enabled: true,
        subscribe: 'type = "track" and event = "Order Completed"',
        mapping: {
          verticalType: 'finance',
          userId: { '@path': '$.userId' },
          enterpriseId: 999999,
          pageType: 'conversionConfirmation',
          emailHash: {
            '@if': {
              exists: { '@path': '$.context.traits.email' },
              then: { '@path': '$.context.traits.email' },
              else: { '@path': '$.properties.email' }
            }
          },
          orderId: { '@path': '$.properties.order_id' },
          currency: { '@path': '$.properties.currency' },
          amount: { '@path': '$.properties.total' },
          discount:  { '@path': '$.properties.discount' },
          coupon: { '@path': '$.properties.coupon' },
          cjeventOrderCookieName: testCookieName,
          items: {
            '@arrayPath': [
              '$.properties.products',
              {
                itemPrice: { '@path': '$.price' },
                itemId: { '@path': '$.id' },
                quantity: { '@path': '$.quantity' },
                discount: { '@path': '$.discount' }
              }
            ]
          },
          financeVerticals: financeVerticals.default
        }
      }
    ]
    const context = new Context({
      type: 'track',
      event: 'Order Completed',
      userId: 'userId-abc123',
      context: {
        traits: {
          email: 'test@test.com'
        }
      },
      properties: {
        order_id: 'abc12345',
        currency: 'USD',
        coupon: 'COUPON1',
        quantity: 5,
        total: 10.99,
        discount: 1,
        products: [
          {
            id: '123',
            quantity: 1,
            price: 1,
            discount: 0.5
          },
          {
            id: '456',
            quantity: 2,
            price: 2,
            discount: 0
          }
        ],
        annual_fee: 100,
        application_status: 'instant_approved',
        apr: 0.4,
        apr_transfer: 'test_aprTransfer',
        apr_transfer_time: 5,
        card_category: 'BALANCE_TRANSFER_CARDS',
        cash_advance_fee: 5,
        contract_length: 7,
        contract_type: 'test contractType',
        credit_report: 'purchase',
        credit_line: 4,
        credit_quality: 'Very Poor',
        funded_amount: 200,
        funded_currency: 'USD',
        introductory_apr: 5,
        introductory_apr_time: 2,
        minimum_balance: 500,
        minimum_deposit: { '@path': '$.properties.minimum_deposit' },
        prequalify: 'YES',
        transfer_fee: 80
      }
    })
    const [event] = await CJDestination({
      ...settings,
      subscriptions
    })

    const orderJSON = {
      trackingSource: 'Segment',
      userId: 'userId-abc123',
      enterpriseId: 999999,
      pageType: 'conversionConfirmation',
      emailHash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
      orderId: 'abc12345',
      actionTrackerId: '987654321',
      currency: 'USD',
      amount: 10.99,
      discount: 1,
      coupon: 'COUPON1',
      cjeventOrder: 'testcCookieValue',
      items: [
        {
          itemId: '123',
          quantity: 1,
          itemPrice: 1,
          discount: 0.5
        },
        {
          itemId: '456',
          quantity: 2,
          itemPrice: 2,
          discount: 0
        }
      ],
      annualFee: 100,
      applicationStatus: 'instant_approved',
      apr: 0.4,
      aprTransfer: 'test_aprTransfer',
      aprTransferTime: 5,
      cardCategory: 'BALANCE_TRANSFER_CARDS',
      cashAdvanceFee: 5,
      contractLength: 7,
      contractType: 'test contractType',
      creditReport: 'purchase',
      creditLine: 4,
      creditQuality: 'Very Poor',
      fundedAmount: 200,
      fundedCurrency: 'USD',
      introductoryApr: 5,
      introductoryAprTime: 2,
      minimumBalance: 500,
      minimumDeposit: { '@path': '$.properties.minimum_deposit' },
      prequalify: 'YES',
      transferFee: 80
    }

    orderEvent = event
    const sendSpy = jest.spyOn(sendModule, 'send').mockResolvedValue(undefined)
    await orderEvent.load(Context.system(), {} as Analytics)
    await orderEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalledWith(
      {}, 
      orderJSON
    )
    expect(sendSpy).toHaveBeenCalledWith('123456789') 
    expect(mockCJ.sitePage).toBe(undefined)
    expect(mockCJ.order).toBe(undefined)
  })

  test('CJ pixel order event with Network Service Vertical data', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'order',
        name: 'order',
        enabled: true,
        subscribe: 'type = "track" and event = "Order Completed"',
        mapping: {
          verticalType: 'network',
          userId: { '@path': '$.userId' },
          enterpriseId: 999999,
          pageType: 'conversionConfirmation',
          emailHash: {
            '@if': {
              exists: { '@path': '$.context.traits.email' },
              then: { '@path': '$.context.traits.email' },
              else: { '@path': '$.properties.email' }
            }
          },
          orderId: { '@path': '$.properties.order_id' },
          currency: { '@path': '$.properties.currency' },
          amount: { '@path': '$.properties.total' },
          discount:  { '@path': '$.properties.discount' },
          coupon: { '@path': '$.properties.coupon' },
          cjeventOrderCookieName: testCookieName,
          items: {
            '@arrayPath': [
              '$.properties.products',
              {
                itemPrice: { '@path': '$.price' },
                itemId: { '@path': '$.id' },
                quantity: { '@path': '$.quantity' },
                discount: { '@path': '$.discount' }
              }
            ]
          },
          networkServicesVerticals: networkServicesVerticals.default
        }
      }
    ]
    const context = new Context({
      type: 'track',
      event: 'Order Completed',
      userId: 'userId-abc123',
      context: {
        traits: {
          email: 'test@test.com'
        }
      },
      properties: {
        order_id: 'abc12345',
        currency: 'USD',
        coupon: 'COUPON1',
        quantity: 5,
        total: 10.99,
        discount: 1,
        products: [
          {
            id: '123',
            quantity: 1,
            price: 1,
            discount: 0.5
          },
          {
            id: '456',
            quantity: 2,
            price: 2,
            discount: 0
          }
        ],
        annual_fee: 10,
        application_status: 'instant_approved',
        contract_length: 2,
        contract_type: 'test contract type'
      }
    })
    const [event] = await CJDestination({
      ...settings,
      subscriptions
    })

    const orderJSON = {
      trackingSource: 'Segment',
      userId: 'userId-abc123',
      enterpriseId: 999999,
      pageType: 'conversionConfirmation',
      emailHash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
      orderId: 'abc12345',
      actionTrackerId: '987654321',
      currency: 'USD',
      amount: 10.99,
      discount: 1,
      coupon: 'COUPON1',
      cjeventOrder: 'testcCookieValue',
      items: [
        {
          itemId: '123',
          quantity: 1,
          itemPrice: 1,
          discount: 0.5
        },
        {
          itemId: '456',
          quantity: 2,
          itemPrice: 2,
          discount: 0
        }
      ],
      annualFee: 10,
      applicationStatus: 'instant_approved',
      contractLength: 2,
      contractType: 'test contract type'
    }

    orderEvent = event
    const sendSpy = jest.spyOn(sendModule, 'send').mockResolvedValue(undefined)
    await orderEvent.load(Context.system(), {} as Analytics)
    await orderEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalled()
    expect(orderModule.setOrderJSON).toHaveBeenCalledWith(
      {}, 
      orderJSON
    )
    expect(sendSpy).toHaveBeenCalledWith('123456789') 
    expect(mockCJ.sitePage).toBe(undefined)
    expect(mockCJ.order).toBe(undefined)
  })

})
