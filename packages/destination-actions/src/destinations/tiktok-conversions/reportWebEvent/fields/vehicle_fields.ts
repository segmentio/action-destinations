import { InputField } from '@segment/actions-core'
import { VEHICLE_FIELDS, WEB } from '../constants'

export const vehicle_fields: InputField = {
  label: 'Vehicle Fields',
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
      description: 'Mileage unites in miles (MI) or kilometers (KM).',
      choices: [
        { value: 'MI', label: 'Miles' },
        { value: 'KM', label: 'Kilometers' }
      ]
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
      description: 'Optional for ViewContent. Use viewcontent_type to differentiate between soft lead landing pages.',
      depends_on: {
        match: 'any',
        conditions: [{ fieldKey: 'event', operator: 'is', value: 'ViewContent' }]
      }
    },
    search_type: {
      label: 'Other Search Page',
      type: 'string',
      description:
        'Optional for Search. Use search_type to differentiate other user searches (such as dealer lookup) from inventory search.',
      depends_on: {
        match: 'any',
        conditions: [{ fieldKey: 'event', operator: 'is', value: 'Search' }]
      }
    },
    registration_type: {
      label: 'Other Registration Page',
      type: 'string',
      description:
        'Optional for CompleteRegistration. Use registration_type to differentiate between different types of customer registration on websites.',
      depends_on: {
        match: 'any',
        conditions: [{ fieldKey: 'event', operator: 'is', value: 'CompleteRegistration' }]
      }
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
        value: VEHICLE_FIELDS
      }
    ]
  }
}
