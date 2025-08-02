import { InputField } from '@segment/actions-core'
import { TRAVEL_FIELDS, WEB } from './constants'

export const travel_fields: InputField = {
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
        value: WEB
      },
      {
        fieldKey: 'event_spec_type',
        operator: 'is',
        value: TRAVEL_FIELDS
      }
    ]
  }
}