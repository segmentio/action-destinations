import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { CJ, SimpleOrder, AdvancedOrder } from '../types'
import { getCookieValue } from './utils'

const action: BrowserActionDefinition<Settings, CJ, Payload> = {
  title: 'Order',
  description: 'Send order data to CJ.',
  defaultSubscription: 'event = "Order Completed"',
  platform: 'web',
  fields: {
    userId: {
      label: 'User ID',
      description: 'A unique ID assigned by you to the user.',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    enterpriseId: {
      label: 'Enterprise ID',
      description: 'Your CJ Enterprise ID.',
      type: 'number',
      required: true
    },
    pageType: {
      label: 'Page Type',
      description: 'Page type to be sent to CJ.',
      type: 'string',
      choices: [
        { label: 'Account Center', value: 'accountCenter' },
        { label: 'Account Signup', value: 'accountSignup' },
        { label: 'Application Start', value: 'applicationStart' },
        { label: 'Branch Locator', value: 'branchLocator' },
        { label: 'Cart', value: 'cart' },
        { label: 'Category', value: 'category' },
        { label: 'Conversion Confirmation', value: 'conversionConfirmation' },
        { label: 'Department', value: 'department' },
        { label: 'Homepage', value: 'homepage' },
        { label: 'Information', value: 'information' },
        { label: 'Product Detail', value: 'productDetail' },
        { label: 'Property Detail', value: 'propertyDetail' },
        { label: 'Property Results', value: 'propertyResults' },
        { label: 'Search Results', value: 'searchResults' },
        { label: 'Store Locator', value: 'storeLocator' },
        { label: 'Sub Category', value: 'subCategory' }
      ],
      required: true
    },
    emailHash: {
      label: 'Email address',
      description: 'Segment will ensure the email address is hashed before sending to CJ.',
      type: 'string',
      required: false,
      default: { 
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
    },
    orderId: {
      label: 'Order ID',
      description: 'The orderId is a unique identifier, such as an order identifier or invoice number, which must be populated for each order.',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.order_id' }
    },
    actionTrackerId: {
      label: 'Action Tracker ID',
      description: 'Required if not specified in Settings. This is a static value provided by CJ. Each account may have multiple actions and each will be referenced by a different actionTrackerId value.',
      type: 'string' // required either at Setting level or Action level. Will validate in the perform()
    },
    currency: {
      label: 'Currency',
      description: 'The currency of the order, e.g. USD, EUR.',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.currency' }
    },
    amount: {
      label: 'Amount',
      description: 'The total amount of the order. This should exclude shipping or tax.',
      type: 'number',
      required: true,
      default: { '@path': '$.properties.total'}
    },
    discount: {
      label: 'Discount',
      description: 'The total discount applied to the order.',
      type: 'number',
      required: false,
      default: { '@path': '$.properties.discount' }
    },
    coupon: { 
      label: 'Coupon',
      description: 'The coupon code applied to the order.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.coupon' }
    },
    cjeventOrderCookieName: {
      label: 'CJ Event Order Cookie Name',
      description: 'The name of the cookie that stores the CJ Event ID. This is required whenever the advertiser uses their own cookie to store the Event ID.',
      type: 'string',
      required: true,
      default: 'cje'
    },
    items: {
      label: 'Items',
      description: 'The items to be sent to CJ.',
      type: 'object',
      multiple: true,
      properties: {
        unitPrice: {
          label: 'Unit Price',
          description: 'the price of the item before tax and discount.',
          type: 'number',
          required: true
        },
        itemId: {
          label: 'Item ID', 
          description: 'The item sku.',
          type: 'string',
          required: true
        },
        quantity: {
          label: 'Quantity',
          description: 'The quantity of the item.',
          type: 'number',
          required: true
        },
        discount: {
          label: 'Discount',
          description: 'The discount applied to the item.',
          type: 'number',
          required: false
        }
      },
      default: {
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
    },
    allVerticals: {
      label: 'All Vertical Parameters',
      description: "This field is used to pass additional parameters specific to the vertical. All vertical parameters listed below can be utilized regardless of the account's vertical.",
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      properties: {
        ancillarySpend: {
          label: 'Ancillary Spend',
          description: 'Ancillary spend at the time of transaction, but not commissionable.',
          type: 'number'
        },
        brand: {
          label: 'Brand',
          description: 'Brand of items purchased. If there are multiple items with different brands, one brand must be designated for the order.',
          type: 'string'
        },
        brandId: {
          label: 'Brand ID',
          description: 'Identifier of brand of items purchased. If there are multiple items with different brands, one brand must be designated for the order.',
          type: 'string'
        },
        businessUnit: {
          label: 'Business Unit',
          description: 'Identifies the business unit the customer purchased through. If there are multiple items with different business units, one business unit must be designated for the order.',
          type: 'string'
        },
        campaignId: {
          label: 'Campaign ID',
          description: 'Marketing campaign id.',
          type: 'string'
        },
        campaignName: {
          label: 'Campaign Name',
          description: 'Marketing campaign name.',
          type: 'string'
        },
        category: {
          label: 'Category',
          description: 'Category of items purchased. If there are multiple items with different categories, one category must be designated for the order.',
          type: 'string'
        },
        class: {
          label: 'Class',
          description: 'Class of item.',
          type: 'string'
        },
        confirmationNumber: {
          label: 'Confirmation Number',
          description: 'Confirmation Number',
          type: 'number'
        },
        couponDiscount: {
          label: 'Coupon Discount',
          description: 'The value (amount of discount) of the coupon. This should be the number linked to the "coupon_type" parameter',
          type: 'number'
        },
        couponType: {
          label: 'Coupon Type',
          description: 'The type of coupon used in the order. This should be the number linked to the "coupon_discount" parameter.',
          type: 'string',
          choices: [
            { label: 'Percent', value: 'percent' },
            { label: 'Dollars', value: 'dollars' },
            { label: 'Added Value', value: 'added_value' }
          ]
        },
        customerCountry: {
          label: 'Customer Country',
          description: "The customer's country. ISO 3166-1 alpha 2 country code, eg. US, UK, AU, FR.",
          type: 'string'
        },
        customerSegment: {
          label: 'Customer Segment',
          description: 'Advertiser-specific customer segment definition.',
          type: 'string'
        },
        customerStatus: {
          label: 'Customer Status',
          description: 'The status of the customer, e.g. new, returning.',
          type: 'string',
          choices: [
            { label: 'New', value: 'New' },
            { label: 'Lapsed', value: 'Lapsed' },
            { label: 'Return', value: 'Return' }
          ]
        },
        customerType: {
          label: 'Customer Type',
          description: 'Indicates the type of individual making the purchase as someone representing a group.',
          type: 'string'
        },
        delivery: {
          label: 'Delivery',
          description: 'The delivery method used for the order.',
          type: 'string',
          choices: [
            { label: 'In-Store', value: 'IN_STORE' },
            { label: 'Pick-up', value: 'PICK_UP' },
            { label: 'Recurring', value: 'RECURRING' },
            { label: 'Standard', value: 'STANDARD' },
            { label: 'Next day', value: 'NEXT_DAY' },
            { label: 'Digital', value: 'DIGITAL' },
            { label: 'Express', value: 'EXPRESS' }
          ]
        },
        description: {
          label: 'Description',
          description: 'Description of the product.',
          type: 'string'
        },
        duration: {
          label: 'Duration',
          description: 'Duration in days.',
          type: 'number'
        },
        endDateTime: {
          label: 'End Date Time',
          description: 'End date and time of the order, in ISO 8601 format.',
          type: 'string',
          format: 'date-time'
        },
        genre: {
          label: 'Genre',
          description: 'Product genre. If there are multiple items with different genres, one genre must be designated for the order.',
          type: 'string'
        },
        itemId: {
          label: 'Item ID',
          description: 'Id for the item. (Simple Actions Only).',
          type: 'string'  
        },
        itemName: {
          label: 'Item Name',
          description: 'Advertiser assigned item name.',
          type: 'string'
        },
        itemType: {
          label: 'Item Type',
          description: 'Advertiser assigned item type.',
          type: 'string'
        },
        lifestage: {
          label: 'Lifestage',
          description: 'Advertiser assigned general demographic.',
          type: 'string'
        },
        location: {
          label: 'Location',
          description: 'Identifies the customer location if different from customerCountry.',
          type: 'string'
        },
        loyaltyEarned: {
          label: 'Loyalty Earned',
          description: 'Loyalty points earned on the transaction.',
          type: 'number'
        },
        loyaltyFirstTimeSignup: {
          label: 'Loyalty First Time Signup',
          description: 'Indicates whether this order coincided with the consumer joining the loyalty program.',
          type: 'string',
          choices: [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
          ]
        },
        loyaltyLevel: {
          label: 'Loyalty Level',
          description: "Indicates the level of the customer's loyalty status.",
          type: 'string'
        },
        loyaltyRedeemed: {
          label: 'Loyalty Redeemed',
          description: 'Loyalty points used during the transaction.',
          type: 'number'
        },
        loyaltyStatus: {
          label: 'Loyalty Status',
          description: 'Indicates if the customer is a loyalty member.',
          type: 'string',
          choices: [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
          ]
        },
        margin: {
          label: 'Margin',
          description: 'Margin on total order. Can be a dollar value or a custom indicator.',
          type: 'string'
        },
        marketingChannel: {
          label: 'Marketing Channel',
          description: 'Advertiser-defined marketing channel assigned to this transaction.',
          type: 'string',
          choices: [
            { label: 'Affiliate', value: 'affiliate' },
            { label: 'Display', value: 'display' },
            { label: 'Social', value: 'social' },
            { label: 'Search', value: 'search' },
            { label: 'Email', value: 'email' },
            { label: 'Direct Navigation', value: 'direct navigation' }
          ]
        },
        noCancellation: {
          label: 'No Cancellation',
          description: 'Indicates if the purchase has a no cancellation policy. "Yes" means there is a "no cancellation" policy, "no" means there is no policy.',
          type: 'string',
          choices: [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
          ]
        },
        orderSubtotal: {
          label: 'Order Subtotal',
          description: 'Subtotal for order.',
          type: 'number'
        },
        paymentMethod: {
          label: 'Payment Method',
          description: 'Method of payment.',
          type: 'string',
          choices: [
            { label: 'Credit/Debit Card', value: 'credit_debit_card' },
            { label: 'Direct Debit', value: 'direct_debit' },
            { label: 'EFTPOS', value: 'EFTPOS' },
            { label: 'Online Payments', value: 'online_payments' },
            { label: 'Cash', value: 'cash' },
            { label: 'Check', value: 'check' },
            { label: 'Money Order', value: 'money_order' },
            { label: 'Gift Card/Voucher', value: 'gift_card_voucher' },
            { label: 'Digital Currency', value: 'digital_currency' }
          ]
        },
        paymentModel: {
          label: 'Payment Model',
          description: 'Model of payment used; advertiser-specific.',
          type: 'string'
        },
        platformId: {
          label: 'Platform ID',
          description: 'Device platform customer is using.',
          type: 'string'
        },
        pointOfSale: {
          label: 'Point of Sale',
          description: 'Point of sale for the transaction.',
          type: 'string',
          choices: [
            { label: 'Amazon', value: 'AMAZON' },
            { label: 'Call Center', value: 'CALL_CENTER' },
            { label: 'Car Rental', value: 'CAR_RENTAL' },
            { label: 'Catalog', value: 'CATALOG' },
            { label: 'Hotel Location', value: 'HOTEL_LOCATION' },
            { label: 'Internet', value: 'INTERNET' },
            { label: 'In-App', value: 'IN_APP' },
            { label: 'Outlet', value: 'OUTLET' },
            { label: 'Retail Store', value: 'RETAIL_STORE' }
          ]
        },
        preorder: {
          label: 'Preorder',
          description: 'Indicates if the purchase was made prior to the item becoming available.',
          type: 'string',
          choices: [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
          ]
        },
        prepaid: {
          label: 'Prepaid',
          description: 'Indicates if the payment was made in advance of the item\'s consumption.',
          type: 'string',
          choices: [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
          ]
        },
        promotion: {
          label: 'Promotion',
          description: 'Promotion applied. If multiple, must be comma-separated.',
          type: 'string'
        },
        promotionAmount: {
          label: 'Promotion Amount',
          description: 'The numeric value associated with the promotion.',
          type: 'number'
        },
        promotionConditionThreshold: {
          label: 'Promotion Condition Threshold',
          description: 'Threshold needed to qualify for the promotion.',
          type: 'number'
        },
        promotionConditionType: {
          label: 'Promotion Condition Type',
          description: 'Type of conditions applied to the promotion.',
          type: 'string',
          choices: [
            { label: 'Brand Card Signup Specific', value: 'BRAND_CARD_SIGNUP_SPECIFIC' },
            { label: 'Brand Card Specific', value: 'BRAND_CARD_SPECIFIC' },
            { label: 'Location Specific', value: 'LOCATION_SPECIFIC' },
            { label: 'Membership Required', value: 'MEMBERSHIP_REQUIRED' },
            { label: 'Loyalty Required', value: 'LOYALTY_REQUIRED' },
            { label: 'Email Signup Required', value: 'EMAIL_SIGNUP_REQUIRED' },
            { label: 'New Customer Specific', value: 'NEW_CUSTOMER_SPECIFIC' },
            { label: 'Product Specific', value: 'PRODUCT_SPECIFIC' },
            { label: 'Point of Sale Specific', value: 'POINT_OF_SALE_SPECIFIC' }
          ]
        },
        promotionEnds: {
          label: 'Promotion Ends',
          description: 'End date of the promotion, in ISO 8601 format.',
          type: 'string',
          format: 'date-time'
        },
        promotionStarts: {
          label: 'Promotion Starts',
          description: 'Start date of the promotion, in ISO 8601 format.',
          type: 'string',
          format: 'date-time'
        },
        promotionType: {
          label: 'Promotion Type',
          description: 'Category of promotion.',
          type: 'string',
          choices: [
            { label: 'BOGO', value: 'BOGO' },
            { label: 'Amount Off', value: 'AMOUNT_OFF' },
            { label: 'Free Gift', value: 'FREE_GIFT' },
            { label: 'Free Shipping', value: 'FREE_SHIP' },
            { label: 'Introductory Offer', value: 'INTRODUCTORY_OFFER' },
            { label: 'Percent Off', value: 'PERCENT_OFF' },
            { label: 'Coupon', value: 'COUPON' }
          ]
        },
        quantity: {
          label: 'Quantity',
          description: 'Quantity for a given SKU. (Simple Actions Only).',
          type: 'integer',
        },
        rating: {
          label: 'Rating',
          description: 'Rating of the product.',
          type: 'string'
        },
        serviceType: {
          label: 'Service Type',
          description: 'Classification of service offered.',
          type: 'string',
          choices: [
            { label: 'Cable', value: 'cable' },
            { label: 'Checking Internet', value: 'checking_internet' },
            { label: 'Credit Card', value: 'credit_card' },
            { label: 'Identity', value: 'identity' },
            { label: 'Insurance', value: 'insurance' },
            { label: 'Investment', value: 'investment' },
            { label: 'Loan', value: 'loan' },
            { label: 'Payment', value: 'payment' },
            { label: 'Phone', value: 'phone' },
            { label: 'Prepaid Debit', value: 'prepaid_debit' },
            { label: 'Savings', value: 'savings' },
            { label: 'Tax', value: 'tax' },
            { label: 'TV Satellite', value: 'tv_sat' },
            { label: 'TV Streaming', value: 'tv_stream' },
            { label: 'Wireless', value: 'wireless' },
            { label: 'Wireless Business', value: 'wireless_bus' },
            { label: 'Wireless Family', value: 'wireless_fam' },
            { label: 'Wireless Individual', value: 'wireless_ind' }
          ]
        },
        startDateTime: {
          label: 'Start Date Time',
          description: 'Start of item duration (e.g., check-out or departure date/time). Must be in ISO 8601 format.',
          type: 'string',
          format: 'date-time'
        },
        subscriptionFee: {
          label: 'Subscription Fee',
          description: 'Cost of subscription fee featured when signing up for free trial.',
          type: 'number'
        },
        subscriptionLength: {
          label: 'Subscription Length',
          description: 'Product duration.',
          type: 'string'
        },
        taxAmount: {
          label: 'Tax Amount',
          description: 'Total tax for the order.',
          type: 'number'
        },
        taxType: {
          label: 'Tax Type',
          description: 'Type of tax assessed.',
          type: 'string',
          choices: [
            { label: 'Administrative', value: 'ADMINISTRATIVE' },
            { label: 'Carrier', value: 'CARRIER' },
            { label: 'Delivery', value: 'DELIVERY' },
            { label: 'Federal Universal Service', value: 'FEDERAL_UNIVERSAL_SERVICE' },
            { label: 'Local', value: 'LOCAL' },
            { label: 'Regulatory Cost Recovery', value: 'REGULATORY_COST_RECOVERY' },
            { label: 'Room', value: 'ROOM' },
            { label: 'Segment', value: 'SEGMENT' },
            { label: 'State', value: 'STATE' },
            { label: 'Tourist', value: 'TOURIST' },
            { label: 'V911 Service', value: 'V911_SERVICE' }
          ]
        },
        upsell: {
          label: 'Upsell',
          description: 'Indicates if someone converted from a trial to a subscription.',
          type: 'string',
          choices: [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
          ]
        }
      },
      default: {
        brand: { '@path': '$.properties.brand' },
        brandId: { '@path': '$.properties.brand_id' },
        businessUnit: { '@path': '$.properties.business_unit' },
        campaignId: { '@path': '$.properties.campaign_id' },
        campaignName: { '@path': '$.properties.campaign_name' },
        category: { '@path': '$.properties.category' },
        class: { '@path': '$.properties.class' }, 
        confirmationNumber: { '@path': '$.properties.confirmation_number' },
        couponDiscount: { '@path': '$.properties.coupon_discount' },
        couponType: { '@path': '$.properties.coupon_type' },
        customerCountry: { '@path': '$.context.locale' },
        customerSegment: { '@path': '$.properties.customer_segment' },
        customerStatus: { '@path': '$.properties.customer_status' },
        customerType: { '@path': '$.properties.customer_type' },
        delivery: { '@path': '$.properties.delivery' },
        description: { '@path': '$.properties.description' },
        duration: { '@path': '$.properties.duration' },
        endDateTime: { '@path': '$.properties.end_date_time' },
        genre: { '@path': '$.properties.genre' },
        itemId: { '@path': '$.properties.item_id' },
        itemName: { '@path': '$.properties.item_name' },
        itemType: { '@path': '$.properties.item_type' },
        lifestage: { '@path': '$.properties.lifestage' },
        location: { '@path': '$.properties.location' },
        loyaltyEarned: { '@path': '$.properties.loyalty_earned' },
        loyaltyFirstTimeSignup: { '@path': '$.properties.loyalty_first_time_signup' },
        loyaltyLevel: { '@path': '$.properties.loyalty_level' },
        loyaltyRedeemed: { '@path': '$.properties.loyalty_redeemed' },
        loyaltyStatus: { '@path': '$.properties.loyalty_status' },
        margin: { '@path': '$.properties.margin' },
        marketingChannel: { '@path': '$.properties.marketing_channel' },
        noCancellation: { '@path': '$.properties.no_cancellation' },
        orderSubtotal: { '@path': '$.properties.order_subtotal' },
        paymentMethod: { '@path': '$.properties.payment_method' },
        paymentModel: { '@path': '$.properties.payment_model' },
        platformId: { '@path': '$.properties.platform_id' },
        pointOfSale: { '@path': '$.properties.point_of_sale' },
        preorder: { '@path': '$.properties.preorder' },
        prepaid: { '@path': '$.properties.prepaid' },
        promotion: { '@path': '$.properties.promotion' },
        promotionAmount: { '@path': '$.properties.promotion_amount' },
        promotionConditionThreshold: { '@path': '$.properties.promotion_condition_threshold' },
        promotionConditionType: { '@path': '$.properties.promotion_condition_type' },
        promotionEnds: { '@path': '$.properties.promotion_ends' },
        promotionStarts: { '@path': '$.properties.promotion_starts' },
        promotionType: { '@path': '$.properties.promotion_type' },
        quantity: { '@path': '$.properties.quantity' },
        rating: { '@path': '$.properties.rating' },
        serviceType: { '@path': '$.properties.service_type' },
        startDateTime: { '@path': '$.properties.start_date_time' },
        subscriptionFee: { '@path': '$.properties.subscription_fee' },
        subscriptionLength: { '@path': '$.properties.subscription_length' },
        taxAmount: { '@path': '$.properties.tax_amount' },
        taxType: { '@path': '$.properties.tax_type' },
        upsell: { '@path': '$.properties.upsell' }
      }
    },
    travelVerticals: {
      label: 'Travel Vertical Parameters',
      description: 'This field is used to pass additional parameters specific to the travel vertical.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      properties: {
        bookingDate: {
          label: 'Booking Date',
          description: 'Date the booking was made.',
          type: 'string',
          format: 'date-time'
        },
        bookingStatus: {
          label: 'Booking Status',
          description: 'Booking status at the time of tag firing.',
          type: 'string'
        },
        bookingValuePostTax: {
          label: 'Booking Value Post-Tax',
          description: 'Value of booking after taxes.',
          type: 'number'
        },
        bookingValuePreTax: {
          label: 'Booking Value Pre-Tax',
          description: 'Value of booking before taxes.',
          type: 'number'
        },
        carOptions: {
          label: 'Car Options',
          description: 'Other items added to the reservation beyond the vehicle itself (e.g. "insurance", "GPS", "Car Seat").',
          type: 'string'
        },
        class: {
          label: 'Class',
          description: 'Class of item (flight, hotel, car, or cruise specific classes).',
          type: 'string',
          choices: [
            { label: 'Flight - first', value: 'first' },
            { label: 'Flight - business', value: 'business' },
            { label: 'Flight - premium economy', value: 'premiumeconomy' },
            { label: 'Flight - economy', value: 'economy' },
            { label: 'Flight - basic economy', value: 'basiceconomy' },
            { label: 'Hotel - standard', value: 'standard' },         
            { label: 'Hotel - deluxe', value: 'deluxe' },
            { label: 'Hotel - junior suite', value: 'junior_suite' }, 
            { label: 'Hotel - suite', value: 'suite' },
            { label: 'Car - economy', value: 'economy' },
            { label: 'Car - compact', value: 'compact' },
            { label: 'Car - mid size', value: 'mid_size' },
            { label: 'Car - full size', value: 'full_size' },
            { label: 'Car - premium', value: 'premium' },
            { label: 'Car - luxury', value: 'luxury' },
            { label: 'Car - mini van', value: 'mini_van' },
            { label: 'Car - convertible', value: 'convertible' },
            { label: 'Car - mid size SUV', value: 'mid_size_suv' },
            { label: 'Car - standard SUV', value: 'standard_suv' },
            { label: 'Car - full size SUV', value: 'full_size_suv' },
            { label: 'Car - full size van', value: 'full_size_van' },
            { label: 'Cruise - interior', value: 'interior' },
            { label: 'Cruise - ocean view', value: 'ocean_view' },
            { label: 'Cruise - suite', value: 'suite' },
            { label: 'Cruise - balcony', value: 'balcony' }
          ]
        },
        cruiseType: {
          label: 'Cruise Type',
          description: 'Type of cruise (Alaskan, Caribbean, etc...).',
          type: 'string'
        },
        destinationCity: {
          label: 'Destination City',
          description: "Customer service destination city name (New York City, Boston, Atlanta, etc...). If destinationCity is provided, destinationState must also be provided. If there is no Origin/Destination combo, but needs to indicate a location of service (network service, event) use 'destination' set of parameters.",
          type: 'string'
        },
        destinationCountry: {
          label: 'Destination Country',
          description: 'Customer service destination country code, per ISO 3166-1 alpha 3 country code (USA, GBR, SWE, etc...).',
          type: 'string'
        },
        destinationState: {
          label: 'Destination State',
          description: 'Customer service destination state/province code. ISO 3166-2 country subdivision standards. e.g. US-NY, US-CA, US-FL, US-TX',
          type: 'string'
        },
        domestic: {
          label: 'Domestic Travel',
          description: 'Indicates whether the travel is domestic (Yes) or international (No).',
          type: 'string',
          choices: [
            { label: 'YES', value: 'YES' },
            { label: 'NO', value: 'NO' }
          ]
        },
        dropoffIata: {
          label: 'Dropoff IATA',
          description: 'Destination location IATA code. 3 letter IATA code.',
          type: 'string'
        },
        dropoffId: {
          label: 'Dropoff ID',
          description: 'Advertiser ID for destination location.',
          type: 'string'
        },
        flightFareType: {
          label: 'Flight Fare Type',
          description: 'Type of flight fare (e.g. gotta get away).',
          type: 'string'
        },
        flightOptions: {
          label: 'Flight Options',
          description: 'Other items added to the reservation (e.g. Wi-Fi).',
          type: 'string'
        },
        flightType: {
          label: 'Flight Type',
          description: 'Type of flight (e.g. direct, layover, overnight).',
          type: 'string',
          choices: [
            { label: 'Multi City', value: 'MULTI_CITY' },
            { label: 'One Way', value: 'ONE_WAY' },
            { label: 'Round Trip', value: 'ROUND_TRIP' }
          ]
        },
        flyerMiles: {
          label: 'Flyer Miles',
          description: 'Flyer miles earned from this flight.',
          type: 'number'
        },
        guests: {
          label: 'Guests',
          description: 'Number of guests.',
          type: 'integer'
        },
        iata: {
          label: 'IATA',
          description: 'IATA code (3-letter); If using for a multi-stop flight each city in a flight can be provided in a comma-separated list.',
          type: 'string'
        },
        itineraryId: {
          label: 'Itinerary ID',
          description: 'Booking itinerary ID.',
          type: 'string'
        },
        minimumStayDuration: {
          label: 'Minimum Stay Duration',
          description: 'Minimum stay duration required in days.',
          type: 'number'
        },
        originCity: {
          label: 'Origin City',
          description: "Customer service origin city name (New York City, Ottawa, Los Angeles, etc...). If originCity is provided, originState is also provided",
          type: 'string'
        },
        originCountry: {
          label: 'Origin Country',
          description: 'Customer service origin country code per ISO 3166-1 alpha 3 country code (USA, GBR, SWE, etc...).',
          type: 'string'
        },
        originState: {
          label: 'Origin State',
          description: 'Customer service origin state/province code per ISO 3166-2 country subdivision standards (Alaska would be "or_state=US-AK", Bangkok would be "or_state=TH-10").',
          type: 'string'
        },
        paidAtBookingPostTax: {
          label: 'Paid at Booking (Post-Tax)',
          description: 'Amount paid at booking after taxes.',
          type: 'number'
        },
        paidAtBookingPreTax: {
          label: 'Paid at Booking (Pre-Tax)',
          description: 'Amount paid at booking before taxes.',
          type: 'number'
        },
        pickupIata: {
          label: 'Pickup IATA',
          description: 'Origin location IATA code.',
          type: 'string'
        },
        pickupId: {
          label: 'Pickup ID',
          description: 'Advertiser ID for origin location.',
          type: 'string'
        },
        port: {
          label: 'Port',
          description: 'Departure port city (for cruises).',
          type: 'string'
        },
        roomType: {
          label: 'Room Type',
          description: 'Room type booked. If using the same values listed for "class" parameter, use that parameter instead.',
          type: 'string'
        },
        rooms: {
          label: 'Rooms',
          description: 'Number of rooms booked.',
          type: 'integer'
        },
        shipName: {
          label: 'Ship Name',
          description: 'Name of the cruise ship.',
          type: 'string'
        },
        travelType: {
          label: 'Travel Type',
          description: '	Type of travel being booked. If you want access to standardized benchmark reporting, you must pass a value from the following list.',
          type: 'string',
          choices: [
            { label: 'Activities', value: 'ACTIVITIES' },
            { label: 'Air', value: 'AIR' },
            { label: 'Car', value: 'CAR' },
            { label: 'Cruise', value: 'CRUISE' },
            { label: 'Events', value: 'EVENTS' },
            { label: 'Hotel', value: 'HOTEL' },
            { label: 'Other', value: 'OTHER' },
            { label: 'Package', value: 'PACKAGE' },
            { label: 'Restaurants', value: 'RESTAURANTS' },
            { label: 'Travel Guides', value: 'TRAVEL_GUIDES' },
            { label: 'Vacation Rental', value: 'VACATION_RENTAL' }
          ]
        }
      },
      default: {
        bookingDate: { '@path': '$.properties.booking_date' },
        bookingStatus: { '@path': '$.properties.booking_status' },
        bookingValuePostTax: { '@path': '$.properties.booking_value_post_tax' },
        bookingValuePreTax: { '@path': '$.properties.booking_value_pre_tax' },
        carOptions: { '@path': '$.properties.car_options' },
        class: { '@path': '$.properties.class' },
        cruiseType: { '@path': '$.properties.cruise_type' },
        destinationCity: { '@path': '$.properties.destination_city' },
        destinationCountry: { '@path': '$.properties.destination_country' },
        destinationState: { '@path': '$.properties.destination_state' },
        domestic: { '@path': '$.properties.domestic' },
        dropoffIata: { '@path': '$.properties.dropoff_iata' },
        dropoffId: { '@path': '$.properties.dropoff_id' },
        flightFareType: { '@path': '$.properties.flight_fare_type' },
        flightOptions: { '@path': '$.properties.flight_options' },
        flightType: { '@path': '$.properties.flight_type' },
        flyerMiles: { '@path': '$.properties.flyer_miles' },
        guests: { '@path': '$.properties.guests' },
        iata: { '@path': '$.properties.iata' },
        itineraryId: { '@path': '$.properties.itinerary_id' },
        minimumStayDuration: { '@path': '$.properties.minimum_stay_duration' },
        originCity: { '@path': '$.properties.origin_city' },
        originCountry: { '@path': '$.properties.origin_country' },
        originState: { '@path': '$.properties.origin_state' },
        paidAtBookingPostTax: { '@path': '$.properties.paid_at_booking_post_tax' },
        paidAtBookingPreTax: { '@path': '$.properties.paid_at_booking_pre_tax' },
        pickupIata: { '@path': '$.properties.pickup_iata' },
        pickupId: { '@path': '$.properties.pickup_id' },
        port: { '@path': '$.properties.port' },
        roomType: { '@path': '$.properties.room_type' },
        rooms: { '@path': '$.properties.rooms' },
        shipName: { '@path': '$.properties.ship_name' },
        travelType: { '@path': '$.properties.travel_type' }
      }

       
    },
    financeVerticals: {
      label: 'Finance Verticals',
      description: 'This field is used to pass additional parameters specific to the finance vertical.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      properties: {
        annualFee: {
          label: 'Annual Fee',
          description: 'Amount of the annual fee.',
          type: 'number'
        },
        applicationStatus: {
          label: 'Application Status',
          description: 'Identifies the status of the application at the time the transaction is sent to CJ.',
          type: 'string',
          choices: [
            { label: 'Instant Approved', value: 'instant_approved' },
            { label: 'Instant Declined', value: 'instant_declined' },
            { label: 'Pended', value: 'pended' },
            { label: 'Approved', value: 'approved' },
            { label: 'Declined', value: 'declined' },
            { label: 'Declined Counter', value: 'declined_counter' }
          ]
        },
        apr: {
          label: 'APR',
          description: 'APR at time of application approval.',
          type: 'number'
        },
        aprTransfer: {
          label: 'APR Transfer',
          description: 'APR for transfers.',
          type: 'number'
        },
        aprTransferTime: {
          label: 'APR Transfer Time',
          description: 'If transfer APR is only for a certain period of time, pass the number of months here.',
          type: 'integer'
        },
        cardCategory: {
          label: 'Card Category',
          description: 'Category of the card.',
          type: 'string',
          choices: [
            { label: 'Balance Transfer Cards', value: 'BALANCE_TRANSFER_CARDS' },
            { label: 'Cash Back Reward Cards', value: 'CASH_BACK_REWARD_CARDS' },
            { label: 'Charge Cards', value: 'CHARGE_CARDS' },
            { label: 'Clicks', value: 'CLICKS' },
            { label: 'Military Affiliate', value: 'MILITARY_AFFILIATE' },
            { label: 'Other', value: 'OTHER' },
            { label: 'Reward Points Cards', value: 'REWARD_POINTS_CARDS' },
            { label: 'Credit Building Cards', value: 'CREDIT_BUILDING_CARDS' },
            { label: 'Student Cards', value: 'STUDENT_CARDS' },
            { label: 'Travel Reward Cards', value: 'TRAVEL_REWARD_CARDS' },
            { label: 'Unknown Product', value: 'UNKNOWN_PRODUCT' },
            { label: 'Low APR Cards', value: 'LOW_APR_CARDS' }
          ]
        },
        cashAdvanceFee: {
          label: 'Cash Advance Fee',
          description: 'Amount of the fee associated with the cash advance.',
          type: 'number'
        },
        contractLength: {
          label: 'Contract Length',
          description: 'Contract length, in months.',
          type: 'number'
        },
        contractType: {
          label: 'Contract Type',
          description: 'Advertiser-specific contract description.',
          type: 'string'
        },
        creditReport: {
          label: 'Credit Report',
          description: 'Indicates if the customer received a credit report and if it was purchased.',
          type: 'string',
          choices: [
            { label: 'Purchase', value: 'purchase' },
            { label: 'Free', value: 'free' },
            { label: 'Trial', value: 'trial' }
          ]
        },
        creditLine: {
          label: 'Credit Line',
          description: 'Amount of credit extended through product.',
          type: 'number'
        },
        creditQuality: {
          label: 'Credit Quality',
          description: 'Minimum credit tier required for product approval. (300-579=Very Poor, 580-669=Fair, 670-739=Good,740-799=Very Good, 800-850=Exceptional).',
          type: 'string',
          choices: [
            { label: 'Very Poor', value: 'Very Poor' },
            { label: 'Fair', value: 'Fair' },
            { label: 'Good', value: 'Good' },
            { label: 'Very Good', value: 'Very Good' }, 
            { label: 'Exceptional', value: 'Exceptional' }
          ]
        },
        fundedAmount: {
          label: 'Funded Amount',
          description: 'Indicates the amount of funding added to the account at the time of transaction.',
          type: 'number'
        },
        fundedCurrency: {
          label: 'Funded Currency',
          description: 'Currency of the funding provided for the new account.',
          type: 'number'
        },
        introductoryApr: {
          label: 'Introductory APR',
          description: 'The introductory APR amount. (If the intro APR is not different than overall APR, use the "APR" parameter).',
          type: 'number'
        },
        introductoryAprTime: {
          label: 'Introductory APR Time',
          description: 'The number of months the intro APR applies for.',
          type: 'integer'
        },
        minimumBalance: {
          label: 'Minimum Balance',
          description: 'Value of the minimum cash balance requirement for the account.',
          type: 'number'
        },
        minimumDeposit: {
          label: 'Minimum Deposit',
          description: 'Indicates the value if a minimum deposit is required.',
          type: 'number'
        },
        prequalify: {
          label: 'Prequalify',
          description: 'Indicates if the applicant was pre-qualified for the card.',
          type: 'string', 
          choices: [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
          ]
        },
        transferFee: {
          label: 'Transfer Fee',
          description: 'The transfer fee amount (i.e. for a credit card).',
          type: 'number'
        }
      },
      default: {
        annualFee: { '@path': '$.properties.annual_fee' },
        applicationStatus: { '@path': '$.properties.application_status' },
        apr: { '@path': '$.properties.apr' },
        aprTransfer: { '@path': '$.properties.apr_transfer' },
        aprTransferTime: { '@path': '$.properties.apr_transfer_time' },
        cardCategory: { '@path': '$.properties.card_category' },
        cashAdvanceFee: { '@path': '$.properties.cash_advance_fee' },
        contractLength: { '@path': '$.properties.contract_length' },
        contractType: { '@path': '$.properties.contract_type' },
        creditReport: { '@path': '$.properties.credit_report' },
        creditLine: { '@path': '$.properties.credit_line' },
        creditQuality: { '@path': '$.properties.credit_quality' },
        fundedAmount: { '@path': '$.properties.funded_amount' },
        fundedCurrency: { '@path': '$.properties.funded_currency' },
        introductoryApr: { '@path': '$.properties.introductory_apr' },
        introductoryAprTime: { '@path': '$.properties.introductory_apr_time' },
        minimumBalance: { '@path': '$.properties.minimum_balance' },
        minimumDeposit: { '@path': '$.properties.minimum_deposit' },
        prequalify: { '@path': '$.properties.prequalify' },
        transferFee: { '@path': '$.properties.transfer_fee' }
      }
    },
    networkServicesVerticals: {
      label: 'Network Services Verticals',
      description: 'This field is used to pass additional parameters specific to the network services vertical.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      properties: {
        annualFee: {
          label: 'Annual Fee',
          description: 'Amount of the annual fee.',
          type: 'number'
        },
        applicationStatus: {
          label: 'Application Status',
          description: 'Identifies the status of the application at the time the transaction is sent to CJ.',
          type: 'string',
          choices: [
            { label: 'Instant Approved', value: 'instant_approved' },
            { label: 'Instant Declined', value: 'instant_declined' },
            { label: 'Pended', value: 'pended' },
            { label: 'Approved', value: 'approved' },
            { label: 'Declined', value: 'declined' },
            { label: 'Declined Counter', value: 'declined_counter' }
          ]
        },
        contractLength: {
          label: 'Contract Length',
          description: 'Contract length, in months.',
          type: 'number'
        },
        contractType: {
          label: 'Contract Type',
          description: 'Advertiser-specific contract description.',
          type: 'string'
        }
      },
      default: {
        annualFee: { '@path': '$.properties.annual_fee' },
        applicationStatus: { '@path': '$.properties.application_status' },
        contractLength: { '@path': '$.properties.contract_length' },
        contractType: { '@path': '$.properties.contract_type' }
      }
    }
  },
  perform: (cj, { payload, settings }) => {

    const { 
      userId, 
      enterpriseId, 
      pageType, 
      emailHash, 
      orderId, 
      actionTrackerId, 
      currency, 
      amount, 
      discount, 
      coupon, 
      cjeventOrderCookieName, 
      items, 
      allVerticals, 
      travelVerticals, 
      financeVerticals, 
      networkServicesVerticals 
    } = payload

    const cjeventOrder: string | null = getCookieValue(cjeventOrderCookieName)

    if(!cjeventOrder){
      console.warn(`Segment CJ Actions Destination: Cookie ${cjeventOrderCookieName} not found. Please ensure the cookie is set before calling this action.`)
    }

    const actionTrackerIdFromSettings = settings.actionTrackerId

    if(!actionTrackerId || !actionTrackerIdFromSettings) {
      console.warn('Segment CJ Actions Destination: Missing actionTrackerId. This can be set as a Setting or as an Action field value.')
    }

    const order: SimpleOrder | AdvancedOrder = {
      userId, 
      enterpriseId, 
      pageType, 
      emailHash, 
      orderId, 
      actionTrackerId: actionTrackerId ?? actionTrackerIdFromSettings ?? '',
      currency, 
      amount, 
      discount, 
      coupon, 
      cjeventOrder: cjeventOrder ?? '',
      items,
      ...allVerticals,
      ...travelVerticals,
      ...financeVerticals,
      ...networkServicesVerticals
    }

    cj.order = order  
  }
}

export default action
