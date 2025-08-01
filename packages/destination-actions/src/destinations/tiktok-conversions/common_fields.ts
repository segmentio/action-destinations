import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  event_source: {
    label: 'Event Source',
    type: 'string',
    description:
      "The type of events you are uploading through TikTok Events API. Please see TikTok's [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to find this value. If no selection is made 'Web' is assumed.",
    default: 'web',
    choices: [
      {
        value: 'web',
        label: 'The events took place on your website and are measured by a Pixel Code.'
      },
      {
        value: 'crm',
        label: 'The lead events took place on a CRM system and are tracked by a CRM Event Set ID.'
      }
    ]
  },
  event_spec_type: {
    label: 'Additional Fields',
    type: 'string',
    description: 'Include fields for travel or auto events.',
    choices: [
      { value: 'Travel Fields', label: 'travel_fields' },
      { value: 'Auto Fields', label: 'auto_fields' }
    ]
  },
  event: {
    label: 'Event Name',
    type: 'string',
    required: true,
    description:
      'Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.'
  },
  event_id: {
    label: 'Event ID',
    type: 'string',
    description: 'Any hashed ID that can identify a unique user/session.',
    default: {
      '@path': '$.messageId'
    }
  },
  timestamp: {
    label: 'Event Timestamp',
    type: 'string',
    description: 'Timestamp that the event took place, in ISO 8601 format.',
    default: {
      '@path': '$.timestamp'
    }
  },
  phone_number: {
    label: 'Phone Number',
    description:
      'A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.phone' },
        then: { '@path': '$.properties.phone' },
        else: { '@path': '$.context.traits.phone' }
      }
    }
  },
  email: {
    label: 'Email',
    description:
      'A single email address or an array of email addresses. Segment will hash this value before sending to TikTok.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.email' },
        then: { '@path': '$.properties.email' },
        else: { '@path': '$.context.traits.email' }
      }
    }
  },
  first_name: {
    label: 'First Name',
    description:
      'The first name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.first_name' },
        then: { '@path': '$.properties.first_name' },
        else: { '@path': '$.context.traits.first_name' }
      }
    }
  },
  last_name: {
    label: 'Last Name',
    description:
      'The last name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.last_name' },
        then: { '@path': '$.properties.last_name' },
        else: { '@path': '$.context.traits.last_name' }
      }
    }
  },
  address: {
    label: 'Address',
    type: 'object',
    description: 'The address of the customer.',
    additionalProperties: false,
    properties: {
      city: {
        label: 'City',
        type: 'string',
        description: "The customer's city."
      },
      country: {
        label: 'Country',
        type: 'string',
        description: "The customer's country."
      },
      zip_code: {
        label: 'Zip Code',
        type: 'string',
        description: "The customer's Zip Code."
      },
      state: {
        label: 'State',
        type: 'string',
        description: "The customer's State."
      }
    },
    default: {
      city: {
        '@if': {
          exists: { '@path': '$.properties.address.city' },
          then: { '@path': '$.properties.address.city' },
          else: { '@path': '$.context.traits.address.city' }
        }
      },
      country: {
        '@if': {
          exists: { '@path': '$.properties.address.country' },
          then: { '@path': '$.properties.address.country' },
          else: { '@path': '$.context.traits.address.country' }
        }
      },
      zip_code: {
        '@if': {
          exists: { '@path': '$.properties.address.postal_code' },
          then: { '@path': '$.properties.address.postal_code' },
          else: { '@path': '$.context.traits.address.postal_code' }
        }
      },
      state: {
        '@if': {
          exists: { '@path': '$.properties.address.state' },
          then: { '@path': '$.properties.address.state' },
          else: { '@path': '$.context.traits.address.state' }
        }
      }
    }
  },
  order_id: {
    label: 'Order ID',
    type: 'string',
    description: 'Order ID of the transaction.',
    default: {
      '@path': '$.properties.order_id'
    }
  },
  shop_id: {
    label: 'Shop ID',
    type: 'string',
    description: 'Shop ID of the transaction.',
    default: {
      '@path': '$.properties.shop_id'
    }
  },
  external_id: {
    label: 'External ID',
    description:
      'Uniquely identifies the user who triggered the conversion event. Segment will hash this value before sending to TikTok. TikTok Conversions Destination supports both string and string[] types for sending external ID(s).',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    }
  },
  ttclid: {
    label: 'TikTok Click ID',
    description:
      'The value of the ttclid used to match website visitor events with TikTok ads. The ttclid is valid for 7 days. See [Set up ttclid](https://ads.tiktok.com/marketing_api/docs?rid=4eezrhr6lg4&id=1681728034437121) for details.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.ttclid' },
        then: { '@path': '$.properties.ttclid' },
        else: { '@path': '$.integrations.TikTok Conversions.ttclid' }
      }
    }
  },
  ttp: {
    label: 'TikTok Cookie ID',
    description:
      'TikTok Cookie ID. If you also use Pixel SDK and have enabled cookies, Pixel SDK automatically saves a unique identifier in the `_ttp` cookie. The value of `_ttp` is used to match website visitor events with TikTok ads. You can extract the value of `_ttp` and attach the value here. To learn more about the `ttp` parameter, refer to [Events API 2.0 - Send TikTok Cookie](https://ads.tiktok.com/marketing_api/docs?id=%201771100936446977) (`_ttp`).',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.ttp' },
        then: { '@path': '$.properties.ttp' },
        else: { '@path': '$.integrations.TikTok Conversions.ttp' }
      }
    }
  },
  lead_id: {
    label: 'TikTok Lead ID',
    description:
      'ID of TikTok leads. Every lead will have its own lead_id when exported from TikTok. This feature is in Beta. Please contact your TikTok representative to inquire regarding availability',
    type: 'string',
    default: { '@path': '$.properties.lead_id' }
  },
  locale: {
    label: 'Locale',
    description:
      'The BCP 47 language identifier. For reference, refer to the [IETF BCP 47 standardized code](https://www.rfc-editor.org/rfc/bcp/bcp47.txt).',
    type: 'string',
    default: {
      '@path': '$.context.locale'
    }
  },
  url: {
    label: 'Page URL',
    type: 'string',
    description: 'The page URL where the conversion event took place.',
    default: {
      '@path': '$.context.page.url'
    }
  },
  referrer: {
    label: 'Page Referrer',
    type: 'string',
    description: 'The page referrer.',
    default: {
      '@path': '$.context.page.referrer'
    }
  },
  ip: {
    label: 'IP Address',
    type: 'string',
    description: 'IP address of the browser.',
    default: {
      '@path': '$.context.ip'
    }
  },
  user_agent: {
    label: 'User Agent',
    type: 'string',
    description: 'User agent from the user’s device.',
    default: {
      '@path': '$.context.userAgent'
    }
  },
  contents: {
    label: 'Contents',
    type: 'object',
    multiple: true,
    description: 'Related item details for the event.',
    properties: {
      price: {
        label: 'Price',
        description: 'Price of the item.',
        type: 'number'
      },
      quantity: {
        label: 'Quantity',
        description: 'Number of items.',
        type: 'number'
      },
      content_category: {
        label: 'Content Category',
        description: 'Category of the product item.',
        type: 'string'
      },
      content_id: {
        label: 'Content ID',
        description: 'ID of the product item.',
        type: 'string'
      },
      content_name: {
        label: 'Content Name',
        description: 'Name of the product item.',
        type: 'string'
      },
      brand: {
        label: 'Brand',
        description: 'Brand name of the product item.',
        type: 'string'
      }
    }
  },
  content_type: {
    label: 'Content Type',
    description:
      'Type of the product item. When the `content_id` in the `Contents` field is specified as a `sku_id`, set this field to `product`. When the `content_id` in the `Contents` field is specified as an `item_group_id`, set this field to `product_group`.',
    type: 'string',
    choices: [
      { label: 'product', value: 'product' },
      { label: 'product_group', value: 'product_group' }
    ],
    default: 'product'
  },
  currency: {
    label: 'Currency',
    type: 'string',
    description: 'Currency for the value specified as ISO 4217 code.',
    default: {
      '@path': '$.properties.currency'
    }
  },
  value: {
    label: 'Value',
    type: 'number',
    description: 'Value of the order or items sold.',
    default: {
      '@if': {
        exists: { '@path': '$.properties.value' },
        then: { '@path': '$.properties.value' },
        else: { '@path': '$.properties.revenue' }
      }
    }
  },
  description: {
    label: 'Description',
    type: 'string',
    description: 'A string description of the web event.'
  },
  query: {
    label: 'Query',
    type: 'string',
    description: 'The text string that was searched for.',
    default: {
      '@path': '$.properties.query'
    }
  },
  limited_data_use: {
    label: 'Limited Data Use',
    type: 'boolean',
    description:
      'Use this field to flag an event for limited data processing. TikTok will recognize this parameter as a request for limited data processing, and will limit its processing activities accordingly if the event shared occurred in an eligible location. To learn more about the Limited Data Use feature, refer to [Events API 2.0 - Limited Data Use](https://ads.tiktok.com/marketing_api/docs?id=1771101204435970).',
    default: {
      '@path': '$.properties.limited_data_use'
    }
  },
  test_event_code: {
    label: 'Test Event Code',
    type: 'string',
    description:
      'Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your TikTok Events Manager under the "Test Event" tab. You\'ll want to remove your Test Event Code when sending real traffic through this integration.'
  }
}

export const newFields: Record<string, InputField> = {
  content_ids: {
    label: 'Content IDs',
    description: 'Product IDs associated with the event, such as SKUs.',
    type: 'string',
    multiple: true,
    default: {
      '@path': '$.properties.content_ids' // TODO: check multiple value mapping
    }
  },
  delivery_category: {
    label: 'Delivery Category',
    type: 'string',
    description: 'Category of the delivery.',
    default: {
      '@path': '$.properties.delivery_category'
    },
    choices: [
      { value: 'in_store', label: 'In Store - Purchase requires customer to enter the store.' },
      { value: 'curbside', label: 'Curbside - Purchase requires curbside pickup.' },
      { value: 'home_delivery', label: 'Home Delivery - Purchase is delivered to the customer.' }
    ]
  },
  num_items: {
    label: 'Number of Items',
    type: 'number',
    description: 'Number of items when checkout was initiated. Used with the InitiateCheckout event.',
    default: {
      '@path': '$.properties.num_items'
    }
  },
  predicted_ltv: {
    label: 'Prediected Lifetime Value',
    type: 'number',
    description:
      'Predicted lifetime value of a subscriber as defined by the advertiser and expressed as an exact value.',
    default: {
      '@path': '$.properties.predicted_ltv'
    }
  },
  search_string: {
    label: 'Search String',
    type: 'string',
    description: 'The text string entered by the user for the search. Used with the Search event.',
    default: {
      '@path': '$.properties.search_string'
    }
  },
  lead_fields: {
    label: 'CRM Fields',
    type: 'object',
    description: 'Fields related to CRM events.',
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      lead_id: {
        label: 'TikTok Lead ID',
        description:
          'ID of TikTok leads. Every lead will have its own lead_id when exported from TikTok. This feature is in Beta. Please contact your TikTok representative to inquire regarding availability',
        type: 'string'
      },
      lead_event_source: {
        label: 'TikTok Lead Event Source',
        description:
          'Lead source of TikTok leads. Please set this field to the name of your CRM system, such as HubSpot or Salesforce.',
        type: 'string'
      }
    },
    default: {
      lead_id: { '@path': '$.properties.lead_id' },
      lead_event_source: { '@path': '$.properties.lead_event_source' }
    },
    depends_on: {
      conditions: [
        {
          fieldKey: 'event_source',
          operator: 'is',
          value: 'crm'
        }
      ]
    }
  }
}

export const travelFields: InputField = {
  label: 'Travel Fields',
  type: 'object',
  description: 'Fields related to travel events.',
  additionalProperties: false,
  defaultObjectUI: 'keyvalue',
  properties: {
    city: {
      label: 'Hotel City Location',
      type: 'string',
      description: 'Hotel city location.'
    },
    region: {
      label: 'Hotel Region',
      type: 'string',
      description: 'Hotel region location.'
    },
    country: {
      label: 'Hotel Country',
      type: 'string',
      description: 'Hotel country location.'
    },
    checkin_date: {
      label: 'Hotel Check-in Date',
      type: 'string',
      description: 'Hotel check-in date.'
    },
    checkout_date: {
      label: 'Hotel Check-out Date',
      type: 'string',
      description: 'Hotel check-out date.'
    },
    num_adults: {
      label: 'Number of Adults',
      type: 'number',
      description: 'Number of adults.'
    },
    num_children: {
      label: 'Number of Children',
      type: 'number',
      description: 'Number of children.'
    },
    num_infants: {
      label: 'Number of Infants',
      type: 'number',
      description: 'Number of infants flying.'
    },
    suggested_hotels: {
      label: 'Suggested Hotels',
      description: 'Suggested hotels.',
      type: 'string',
      multiple: true
    },
    departing_departure_date: {
      label: 'Departure Date',
      type: 'string',
      description:
        'Date of flight departure. Accepted date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD'
    },
    returning_departure_date: {
      label: 'Arrival Date',
      type: 'string',
      description:
        'Date of return flight. Accepted date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD'
    },
    origin_airport: {
      label: 'Origin Airport',
      type: 'string',
      description: 'Origin airport.'
    },
    destination_airiport: {
      label: 'Destination Airport',
      type: 'string',
      description: 'Destination airport.'
    },
    destination_ids: {
      label: 'Destination IDs',
      description:
        'If a client has a destination catalog, the client can associate one or more destinations in the catalog with a specific flight event. For instance, link a particular route to a nearby museum and a nearby beach, both of which are destinations in the catalog.',
      type: 'string',
      multiple: true
    },
    departing_arrival_date: {
      label: 'Departing Arrival Date',
      type: 'string',
      description:
        'The date and time for arrival at the destination of the outbound journey. Accepted date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD'
    },
    returning_arrival_date: {
      label: 'Returning Arrival Date',
      type: 'string',
      description:
        'The date and time when the return journey is completed. Accepted date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD'
    },
    travel_class: {
      label: 'Flight Ticket Class',
      type: 'string',
      description: 'Class of the flight ticket, must be: "eco", "prem", "bus", "first".',
      choices: [
        // TODO: have choices & default mapping?
        { value: 'eco', label: 'Economy' },
        { value: 'prem', label: 'Premium' },
        { value: 'bus', label: 'Bus' },
        { value: 'first', label: 'First' }
      ]
    },
    user_score: {
      label: 'User Score',
      type: 'number',
      description: 'Represents the relative value of this potential customer to advertiser.'
    },
    preferred_num_stops: {
      label: 'Preferred Number of Stops',
      type: 'number',
      description: 'The preferred number of stops the user is looking for. 0 for direct flight.'
    },
    travel_start: {
      label: 'Start Date of the Trip',
      type: 'string',
      description:
        "The start date of user's trip. Accept date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD."
    },
    travel_end: {
      label: 'End Date of the Trip',
      type: 'string',
      description:
        "The end date of user's trip. Accept date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD."
    },
    suggested_destinations: {
      label: 'Suggested Destination IDs',
      description:
        'A list of IDs representing destination suugestions for this user. This parameter is not applicable for the Search event.',
      type: 'string',
      multiple: true
    }
  },
  default: {
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
      '@path': '$.properties.suggested_hotels' // TODO: confirm multiple value mapping
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
    destination_airiport: {
      '@path': '$.properties.destination_airiport'
    },
    destination_ids: {
      '@path': '$.properties.destination_ids' // TODO: confirm multiple value mapping
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
      '@path': '$.properties.suggested_destinations' // TODO: confirm multiple value mapping
    }
  },
  depends_on: {
    match: 'all',
    conditions: [
      {
        fieldKey: 'event_source',
        operator: 'is',
        value: 'web'
      },
      {
        fieldKey: 'event_spec_type',
        operator: 'is',
        value: 'travel_fields'
      }
    ]
  }
}

export const autoFields: InputField = {
  label: 'Auto Fields',
  type: 'object',
  description: 'Fields related to vehicle events.',
  additionalProperties: false,
  defaultObjectUI: 'keyvalue',
  properties: {
    postal_code: {
      label: 'Postal Code',
      type: 'string',
      description: 'Postal code for the vehicle location.'
    },
    make: {
      label: 'Make of the Vehicle',
      type: 'string',
      description: 'Vehicle make/brand/manufacturer.'
    },
    model: {
      label: 'Model of the Vehicle',
      type: 'string',
      description: 'Vehicle model.'
    },
    year: {
      label: 'Year of the Vehicle',
      type: 'number',
      description: 'Year the vehicle was laucned in yyyy format.'
    },
    state_of_vehicle: {
      label: 'State of the Vehicle',
      type: 'string',
      description: 'Vehicle status.',
      choices: [
        { value: 'New', label: 'New' },
        { value: 'Used', label: 'Used' },
        { value: 'CPO', label: 'CPO' }
      ]
    },
    mileage_value: {
      label: 'Mileage Value',
      type: 'number',
      description: 'Vehicle mileage (in km or miles). Zero (0) for new vehicle.'
    },
    mileage_unit: {
      label: 'Mileage Unit',
      type: 'string',
      description: 'Mileage unites in miles (MI) or kilometers (KM).'
    },
    exterior_color: {
      label: 'Exterior Color of the Vehicle',
      type: 'string',
      description: 'Vehicle exterior color.'
    },
    transmission: {
      label: 'Transmission Type of the Vehicle',
      type: 'string',
      description: 'Vehicle transmission type.',
      choices: [
        { value: 'Automatic', label: 'Automatic' },
        { value: 'Manual', label: 'Manual' },
        { value: 'Other', label: 'Other' }
      ]
    },
    body_style: {
      label: 'Body Type of the Vehicle',
      type: 'string',
      description: 'Vehicle body type.',
      choices: [
        { value: 'Convertible', label: 'Convertible' },
        { value: 'Coupe', label: 'Coupe' },
        { value: 'Hatchback', label: 'Hatchback' },
        { value: 'Minivan', label: 'Minivan' },
        { value: 'Truck', label: 'Truck' },
        { value: 'SUV', label: 'SUV' },
        { value: 'Sedan', label: 'Sedan' },
        { value: 'Van', label: 'Van' },
        { value: 'Wagon', label: 'Wagon' },
        { value: 'Crossover', label: 'Crossover' },
        { value: 'Other', label: 'Other' }
      ]
    },
    fuel_type: {
      label: 'Fuel Type of the Vehicle',
      type: 'string',
      description: 'Vehicle fuel type.',
      choices: [
        { value: 'Diesel', label: 'Diesel' },
        { value: 'Electric', label: 'Electric' },
        { value: 'Flex', label: 'Flex' },
        { value: 'Gasoline', label: 'Gasoline' },
        { value: 'Hybrid', label: 'Hybrid' },
        { value: 'Other', label: 'Other' }
      ]
    },
    drivetrain: {
      label: 'Drivetrain of the Vehicle',
      type: 'string',
      description: 'Vehicle drivetrain.',
      choices: [
        { value: 'AWD', label: 'AWD' },
        { value: 'FOUR_WD', label: 'Four WD' },
        { value: 'FWD', label: 'FWD' },
        { value: 'RWD', label: 'RWD' },
        { value: 'TWO_WD', label: 'Two WD' },
        { value: 'Other', label: 'Other' }
      ]
    },
    preferred_price_range_min: {
      label: 'Minimum Preferred Price',
      type: 'number',
      description: 'Minimum preferred price of the vehicle.'
    },
    preferred_price_range_max: {
      label: 'Maximum Preferred Price',
      type: 'number',
      description: 'Maximum preferred price of the vehicle.'
    },
    trim: {
      label: 'Trim of the Vehicle',
      type: 'string',
      description: 'Vehicle trim.'
    },
    vin: {
      label: 'VIN of the Vehicle',
      type: 'string',
      description: 'Vehicle identification number. Maximum characters: 17.'
    },
    interior_color: {
      label: 'Interior Color of the Vehicle',
      type: 'string',
      description: 'Vehicle interior color.'
    },
    condition_of_vehicle: {
      label: 'Condition of the Vehicle',
      type: 'string',
      description: 'Vehicle drivetrain.',
      choices: [
        { value: 'Excellent', label: 'Excellent' },
        { value: 'Good', label: 'Good' },
        { value: 'Fair', label: 'Fair' },
        { value: 'Poor', label: 'Poor' },
        { value: 'Other', label: 'Other' }
      ]
    },
    viewcontent_type: {
      label: 'Soft Lead Landing Page',
      type: 'string',
      description: 'Optional for ViewContent. Use viewcontent_type to differentiate between soft lead landing pages.'
    },
    search_type: {
      label: 'Other Search Page',
      type: 'string',
      description:
        'Optional for Search. Use search_type to differentiate other user searches (such as dealer lookup) from inventory search.'
    },
    registration_type: {
      label: 'Other Registration Page',
      type: 'string',
      description:
        'Optional for CompleteRegistration. Use registration_type to differentiate between different types of customer registration on websites.'
    }
  },
  default: {
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
      '@path': '$.properties.travel_class'
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
      '@path': '$.properties.travel_class'
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
      '@path': '$.properties.travel_class'
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
  },
  depends_on: {
    match: 'all',
    conditions: [
      {
        fieldKey: 'event_source',
        operator: 'is',
        value: 'web'
      },
      {
        fieldKey: 'event_spec_type',
        operator: 'is',
        value: 'auto_fields'
      }
    ]
  }
}
