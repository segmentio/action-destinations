import { InputField } from '@segment/actions-core/destination-kit/types'

export const event_at: InputField = {
  label: 'Event At',
  description: 'The RFC3339 timestamp when the conversion event occurred',
  type: 'datetime',
  required: true,
  default: {
    '@path': '$.timestamp'
  }
}

export const custom_event_name: InputField = {
  label: 'Custom Event Name',
  description:
    'A custom event name that can be passed when tracking_type is set to "Custom". All UTF-8 characters are accepted and custom_event_name must be at most 64 characters long.',
  type: 'string',
  required: true
}

export const tracking_type: InputField = {
  label: 'Tracking Type',
  description:
    "One of Reddit CAPI's standard conversion event types. To send a Custom event to Reddit use the Custom Event Action instead.",
  type: 'string',
  required: true,
  choices: [
    { label: 'Page Visit', value: 'PageVisit' },
    { label: 'View Content', value: 'ViewContent' },
    { label: 'Search', value: 'Search' },
    { label: 'Add to Cart', value: 'AddToCart' },
    { label: 'Add to Wishlist', value: 'AddToWishlist' },
    { label: 'Purchase', value: 'Purchase' },
    { label: 'Lead', value: 'Lead' },
    { label: 'Sign Up', value: 'SignUp' }
  ]
}

export const click_id: InputField = {
  label: 'Click ID',
  description: 'The Reddit-generated id associated with a single ad click.',
  type: 'string',
  required: false,
  default: {
    '@if': {
      exists: { '@path': '$.integrations.Reddit Conversions Api.click_id' },
      then: { '@path': '$.integrations.Reddit Conversions Api.click_id' },
      else: { '@path': '$.properties.click_id' }
    }
  }
}

export const conversion_id: InputField = {
  label: 'Conversion ID',
  description: 'The unique conversion ID that corresponds to a distinct conversion event.',
  type: 'string',
  required: false,
  default: { '@path': '$.properties.conversion_id' }
}

export const event_metadata: InputField = {
  label: 'Event Metadata',
  description: 'The metadata associated with the conversion event.',
  type: 'object',
  required: false,
  properties: {
    currency: {
      label: 'Currency',
      description:
        'The currency for the value provided. This must be a three-character ISO 4217 currency code. This should only be set for revenue-related events.',
      type: 'string',
      choices: [
        { label: 'AUD - Australian Dollar', value: 'AUD' },
        { label: 'CAD - Canadian Dollar', value: 'CAD' },
        { label: 'EUR - Euro', value: 'EUR' },
        { label: 'GBP - Pound Sterling', value: 'GBP' },
        { label: 'NZD - New Zealand Dollar', value: 'NZD' },
        { label: 'USD - US Dollar', value: 'USD' }
      ]
    },
    item_count: {
      label: 'Item Count',
      description: 'The number of items in the event. This should only be set for revenue-related events.',
      type: 'integer'
    },
    value_decimal: {
      label: 'Value Decimal',
      description:
        'The value of the transaction in the base unit of the currency. For example, dollars, euros, pesos, rupees, and bitcoin for USD, EUR, MXN, INR, and BTC respectively. This should only be set for revenue-related events.',
      type: 'number'
    }
  },
  default: {
    currency: {
      '@path': '$.properties.currency'
    },
    item_count: {
      '@path': '$.properties.quantity'
    },
    value_decimal: {
      '@path': '$.properties.total'
    }
  }
}

export const products: InputField = {
  label: 'Products',
  description: 'The products associated with the conversion event.',
  type: 'object',
  required: false,
  multiple: true,
  properties: {
    category: {
      label: 'Category',
      description: "The category the product is in; for example, a label from Google's product taxonomy. Required.",
      type: 'string',
      required: true
    },
    id: {
      label: 'Product ID',
      description: 'The ID representing the product in a catalog. Required.',
      type: 'string',
      required: true
    },
    name: {
      label: 'Product Name',
      description: 'The name of the product. Optional.',
      type: 'string',
      required: false
    }
  },
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        category: { '@path': '$.category' },
        id: { '@path': '$.product_id' },
        name: { '@path': '$.name' }
      }
    ]
  }
}

export const user: InputField = {
  label: 'User',
  description: 'The identifying user parameters associated with the conversion event.',
  type: 'object',
  required: false,
  properties: {
    advertising_id: {
      label: 'Advertising ID', // NEEDS TO BE HASHED (SHA-256)
      description: 'The mobile advertising ID for the user. This can be the iOS IDFA, Android AAID.',
      type: 'string'
    },
    device_type: {
      label: 'Device Type',
      description: 'The type of mobile device. e.g. iOS or Android.',
      type: 'string'
    },
    email: {
      label: 'Email', // NEEDS TO BE HASHED (SHA-256)
      description: 'The email address of the user.',
      type: 'string'
    },
    external_id: {
      label: 'External ID', // NEEDS TO BE HASHED (SHA-256)
      description: 'An advertiser-assigned persistent identifier for the user.',
      type: 'string'
    },
    ip_address: {
      label: 'IP Address', // NEEDS TO BE HASHED (SHA-256)
      description: 'The IP address of the user.',
      type: 'string'
    },
    opt_out: {
      label: 'Opt Out',
      description: 'A flag indicating whether the user has opted out of tracking.',
      type: 'boolean'
    },
    user_agent: {
      label: 'User Agent',
      description: "The user agent of the user's browser.",
      type: 'string'
    },
    uuid: {
      label: 'UUID',
      description:
        "The value from the first-party Pixel '_rdt_uuid' cookie on your domain. Note that it is in the '{timestamp}.{uuid}' format. You may use the full value or just the UUID portion.",
      type: 'string'
    }
  },
  default: {
    advertising_id: { '@path': '$.context.device.advertisingId' },
    device_type: { '@path': '$.context.device.type' },
    email: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    },
    external_id: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    },
    ip_address: { '@path': '$.context.ip' },
    opt_out: { '@path': '$.properties.opt_out' },
    user_agent: { '@path': '$.context.userAgent' },
    uuid: {
      '@if': {
        exists: { '@path': '$.integrations.Reddit Conversions Api.uuid' },
        then: { '@path': '$.integrations.Reddit Conversions Api.uuid' },
        else: { '@path': '$.properties.uuid' }
      }
    }
  }
}

export const data_processing_options: InputField = {
  label: 'Data Processing Options',
  description: 'A structure of data processing options to specify the processing type for the event.',
  type: 'object',
  required: false,
  additionalProperties: false,
  properties: {
    country: {
      label: 'Country',
      description: 'Country Code of the user. We support ISO 3166-1 alpha-2 country code.',
      type: 'string',
      choices: [
        { label: 'AD - Andorra', value: 'AD' },
        { label: 'AE - United Arab Emirates', value: 'AE' },
        { label: 'AF - Afghanistan', value: 'AF' },
        { label: 'AG - Antigua and Barbuda', value: 'AG' },
        { label: 'AI - Anguilla', value: 'AI' },
        { label: 'AL - Albania', value: 'AL' },
        { label: 'AM - Armenia', value: 'AM' },
        { label: 'AO - Angola', value: 'AO' },
        { label: 'AQ - Antarctica', value: 'AQ' },
        { label: 'AR - Argentina', value: 'AR' },
        { label: 'AS - American Samoa', value: 'AS' },
        { label: 'AT - Austria', value: 'AT' },
        { label: 'AU - Australia', value: 'AU' },
        { label: 'AW - Aruba', value: 'AW' },
        { label: 'AX - Åland Islands', value: 'AX' },
        { label: 'AZ - Azerbaijan', value: 'AZ' },
        { label: 'BA - Bosnia and Herzegovina', value: 'BA' },
        { label: 'BB - Barbados', value: 'BB' },
        { label: 'BD - Bangladesh', value: 'BD' },
        { label: 'BE - Belgium', value: 'BE' },
        { label: 'BF - Burkina Faso', value: 'BF' },
        { label: 'BG - Bulgaria', value: 'BG' },
        { label: 'BH - Bahrain', value: 'BH' },
        { label: 'BI - Burundi', value: 'BI' },
        { label: 'BJ - Benin', value: 'BJ' },
        { label: 'BL - Saint Barthélemy', value: 'BL' },
        { label: 'BM - Bermuda', value: 'BM' },
        { label: 'BN - Brunei Darussalam', value: 'BN' },
        { label: 'BO - Bolivia (Plurinational State of)', value: 'BO' },
        { label: 'BQ - Bonaire, Sint Eustatius and Saba', value: 'BQ' },
        { label: 'BR - Brazil', value: 'BR' },
        { label: 'BS - Bahamas', value: 'BS' },
        { label: 'BT - Bhutan', value: 'BT' },
        { label: 'BV - Bouvet Island', value: 'BV' },
        { label: 'BW - Botswana', value: 'BW' },
        { label: 'BY - Belarus', value: 'BY' },
        { label: 'BZ - Belize', value: 'BZ' },
        { label: 'CA - Canada', value: 'CA' },
        { label: 'CC - Cocos (Keeling) Islands', value: 'CC' },
        { label: 'CD - Congo, Democratic Republic of the', value: 'CD' },
        { label: 'CF - Central African Republic', value: 'CF' },
        { label: 'CG - Congo', value: 'CG' },
        { label: 'CH - Switzerland', value: 'CH' },
        { label: "CI - Côte d'Ivoire", value: 'CI' },
        { label: 'CK - Cook Islands', value: 'CK' },
        { label: 'CL - Chile', value: 'CL' },
        { label: 'CM - Cameroon', value: 'CM' },
        { label: 'CN - China', value: 'CN' },
        { label: 'CO - Colombia', value: 'CO' },
        { label: 'CR - Costa Rica', value: 'CR' },
        { label: 'CU - Cuba', value: 'CU' },
        { label: 'CV - Cabo Verde', value: 'CV' },
        { label: 'CW - Curaçao', value: 'CW' },
        { label: 'CX - Christmas Island', value: 'CX' },
        { label: 'CY - Cyprus', value: 'CY' },
        { label: 'CZ - Czechia', value: 'CZ' },
        { label: 'DE - Germany', value: 'DE' },
        { label: 'DJ - Djibouti', value: 'DJ' },
        { label: 'DK - Denmark', value: 'DK' },
        { label: 'DM - Dominica', value: 'DM' },
        { label: 'DO - Dominican Republic', value: 'DO' },
        { label: 'DZ - Algeria', value: 'DZ' },
        { label: 'EC - Ecuador', value: 'EC' },
        { label: 'EE - Estonia', value: 'EE' },
        { label: 'EG - Egypt', value: 'EG' },
        { label: 'EH - Western Sahara', value: 'EH' },
        { label: 'ER - Eritrea', value: 'ER' },
        { label: 'ES - Spain', value: 'ES' },
        { label: 'ET - Ethiopia', value: 'ET' },
        { label: 'FI - Finland', value: 'FI' },
        { label: 'FJ - Fiji', value: 'FJ' },
        { label: 'FK - Falkland Islands (Malvinas)', value: 'FK' },
        { label: 'FM - Micronesia (Federated States of)', value: 'FM' },
        { label: 'FO - Faroe Islands', value: 'FO' },
        { label: 'FR - France', value: 'FR' },
        { label: 'GA - Gabon', value: 'GA' },
        { label: 'GB - United Kingdom of Great Britain and Northern Ireland', value: 'GB' },
        { label: 'GD - Grenada', value: 'GD' },
        { label: 'GE - Georgia', value: 'GE' },
        { label: 'GF - French Guiana', value: 'GF' },
        { label: 'GG - Guernsey', value: 'GG' },
        { label: 'GH - Ghana', value: 'GH' },
        { label: 'GI - Gibraltar', value: 'GI' },
        { label: 'GL - Greenland', value: 'GL' },
        { label: 'GM - Gambia', value: 'GM' },
        { label: 'GN - Guinea', value: 'GN' },
        { label: 'GP - Guadeloupe', value: 'GP' },
        { label: 'GQ - Equatorial Guinea', value: 'GQ' },
        { label: 'GR - Greece', value: 'GR' },
        { label: 'GT - Guatemala', value: 'GT' },
        { label: 'GU - Guam', value: 'GU' },
        { label: 'GW - Guinea-Bissau', value: 'GW' },
        { label: 'GY - Guyana', value: 'GY' },
        { label: 'HK - Hong Kong', value: 'HK' },
        { label: 'HM - Heard Island and McDonald Islands', value: 'HM' },
        { label: 'HN - Honduras', value: 'HN' },
        { label: 'HR - Croatia', value: 'HR' },
        { label: 'HT - Haiti', value: 'HT' },
        { label: 'HU - Hungary', value: 'HU' },
        { label: 'ID - Indonesia', value: 'ID' },
        { label: 'IE - Ireland', value: 'IE' },
        { label: 'IL - Israel', value: 'IL' },
        { label: 'IM - Isle of Man', value: 'IM' },
        { label: 'IN - India', value: 'IN' },
        { label: 'IO - British Indian Ocean Territory', value: 'IO' },
        { label: 'IQ - Iraq', value: 'IQ' },
        { label: 'IR - Iran (Islamic Republic of)', value: 'IR' },
        { label: 'IS - Iceland', value: 'IS' },
        { label: 'IT - Italy', value: 'IT' },
        { label: 'JE - Jersey', value: 'JE' },
        { label: 'JM - Jamaica', value: 'JM' },
        { label: 'JO - Jordan', value: 'JO' },
        { label: 'JP - Japan', value: 'JP' },
        { label: 'KE - Kenya', value: 'KE' },
        { label: 'KG - Kyrgyzstan', value: 'KG' },
        { label: 'KH - Cambodia', value: 'KH' },
        { label: 'KI - Kiribati', value: 'KI' },
        { label: 'KM - Comoros', value: 'KM' },
        { label: 'KN - Saint Kitts and Nevis', value: 'KN' },
        { label: "KP - Korea (Democratic People's Republic of)", value: 'KP' },
        { label: 'KR - Korea, Republic of', value: 'KR' },
        { label: 'KW - Kuwait', value: 'KW' },
        { label: 'KY - Cayman Islands', value: 'KY' },
        { label: 'KZ - Kazakhstan', value: 'KZ' },
        { label: "LA - Lao People's Democratic Republic", value: 'LA' },
        { label: 'LB - Lebanon', value: 'LB' },
        { label: 'LC - Saint Lucia', value: 'LC' },
        { label: 'LI - Liechtenstein', value: 'LI' },
        { label: 'LK - Sri Lanka', value: 'LK' },
        { label: 'LR - Liberia', value: 'LR' },
        { label: 'LS - Lesotho', value: 'LS' },
        { label: 'LT - Lithuania', value: 'LT' },
        { label: 'LU - Luxembourg', value: 'LU' },
        { label: 'LV - Latvia', value: 'LV' },
        { label: 'LY - Libya', value: 'LY' },
        { label: 'MA - Morocco', value: 'MA' },
        { label: 'MC - Monaco', value: 'MC' },
        { label: 'MD - Moldova (Republic of)', value: 'MD' },
        { label: 'ME - Montenegro', value: 'ME' },
        { label: 'MF - Saint Martin (French part)', value: 'MF' },
        { label: 'MG - Madagascar', value: 'MG' },
        { label: 'MH - Marshall Islands', value: 'MH' },
        { label: 'MK - North Macedonia', value: 'MK' },
        { label: 'ML - Mali', value: 'ML' },
        { label: 'MM - Myanmar', value: 'MM' },
        { label: 'MN - Mongolia', value: 'MN' },
        { label: 'MO - Macao', value: 'MO' },
        { label: 'MP - Northern Mariana Islands', value: 'MP' },
        { label: 'MQ - Martinique', value: 'MQ' },
        { label: 'MR - Mauritania', value: 'MR' },
        { label: 'MS - Montserrat', value: 'MS' },
        { label: 'MT - Malta', value: 'MT' },
        { label: 'MU - Mauritius', value: 'MU' },
        { label: 'MV - Maldives', value: 'MV' },
        { label: 'MW - Malawi', value: 'MW' },
        { label: 'MX - Mexico', value: 'MX' },
        { label: 'MY - Malaysia', value: 'MY' },
        { label: 'MZ - Mozambique', value: 'MZ' },
        { label: 'NA - Namibia', value: 'NA' },
        { label: 'NC - New Caledonia', value: 'NC' },
        { label: 'NE - Niger', value: 'NE' },
        { label: 'NF - Norfolk Island', value: 'NF' },
        { label: 'NG - Nigeria', value: 'NG' },
        { label: 'NI - Nicaragua', value: 'NI' },
        { label: 'NL - Netherlands', value: 'NL' },
        { label: 'NO - Norway', value: 'NO' },
        { label: 'NP - Nepal', value: 'NP' },
        { label: 'NR - Nauru', value: 'NR' },
        { label: 'NU - Niue', value: 'NU' },
        { label: 'NZ - New Zealand', value: 'NZ' },
        { label: 'OM - Oman', value: 'OM' },
        { label: 'PA - Panama', value: 'PA' },
        { label: 'PE - Peru', value: 'PE' },
        { label: 'PF - French Polynesia', value: 'PF' },
        { label: 'PG - Papua New Guinea', value: 'PG' },
        { label: 'PH - Philippines', value: 'PH' },
        { label: 'PK - Pakistan', value: 'PK' },
        { label: 'PL - Poland', value: 'PL' },
        { label: 'PM - Saint Pierre and Miquelon', value: 'PM' },
        { label: 'PN - Pitcairn', value: 'PN' },
        { label: 'PR - Puerto Rico', value: 'PR' },
        { label: 'PT - Portugal', value: 'PT' },
        { label: 'PW - Palau', value: 'PW' },
        { label: 'PY - Paraguay', value: 'PY' },
        { label: 'QA - Qatar', value: 'QA' },
        { label: 'RE - Réunion', value: 'RE' },
        { label: 'RO - Romania', value: 'RO' },
        { label: 'RS - Serbia', value: 'RS' },
        { label: 'RU - Russian Federation', value: 'RU' },
        { label: 'RW - Rwanda', value: 'RW' },
        { label: 'SA - Saudi Arabia', value: 'SA' },
        { label: 'SB - Solomon Islands', value: 'SB' },
        { label: 'SC - Seychelles', value: 'SC' },
        { label: 'SD - Sudan', value: 'SD' },
        { label: 'SE - Sweden', value: 'SE' },
        { label: 'SG - Singapore', value: 'SG' },
        { label: 'SH - Saint Helena', value: 'SH' },
        { label: 'SI - Slovenia', value: 'SI' },
        { label: 'SJ - Svalbard and Jan Mayen', value: 'SJ' },
        { label: 'SK - Slovakia', value: 'SK' },
        { label: 'SL - Sierra Leone', value: 'SL' },
        { label: 'SM - San Marino', value: 'SM' },
        { label: 'SN - Senegal', value: 'SN' },
        { label: 'SO - Somalia', value: 'SO' },
        { label: 'SR - Suriname', value: 'SR' },
        { label: 'SS - South Sudan', value: 'SS' },
        { label: 'ST - São Tomé and Príncipe', value: 'ST' },
        { label: 'SV - El Salvador', value: 'SV' },
        { label: 'SX - Sint Maarten (Dutch part)', value: 'SX' },
        { label: 'SY - Syrian Arab Republic', value: 'SY' },
        { label: 'SZ - Eswatini', value: 'SZ' },
        { label: 'TC - Turks and Caicos Islands', value: 'TC' },
        { label: 'TD - Chad', value: 'TD' },
        { label: 'TF - French Southern Territories', value: 'TF' },
        { label: 'TG - Togo', value: 'TG' },
        { label: 'TH - Thailand', value: 'TH' },
        { label: 'TJ - Tajikistan', value: 'TJ' },
        { label: 'TK - Tokelau', value: 'TK' },
        { label: 'TL - Timor-Leste', value: 'TL' },
        { label: 'TM - Turkmenistan', value: 'TM' },
        { label: 'TN - Tunisia', value: 'TN' },
        { label: 'TO - Tonga', value: 'TO' },
        { label: 'TR - Turkey', value: 'TR' },
        { label: 'TT - Trinidad and Tobago', value: 'TT' },
        { label: 'TV - Tuvalu', value: 'TV' },
        { label: 'TZ - Tanzania, United Republic of', value: 'TZ' },
        { label: 'UA - Ukraine', value: 'UA' },
        { label: 'UG - Uganda', value: 'UG' },
        { label: 'UM - United States Minor Outlying Islands', value: 'UM' },
        { label: 'UN - United Nations', value: 'UN' },
        { label: 'US - United States of America', value: 'US' },
        { label: 'UY - Uruguay', value: 'UY' },
        { label: 'UZ - Uzbekistan', value: 'UZ' },
        { label: 'VA - Holy See', value: 'VA' },
        { label: 'VC - Saint Vincent and the Grenadines', value: 'VC' },
        { label: 'VE - Venezuela (Bolivarian Republic of)', value: 'VE' },
        { label: 'VG - Virgin Islands (British)', value: 'VG' },
        { label: 'VI - Virgin Islands (U.S.)', value: 'VI' },
        { label: 'VN - Viet Nam', value: 'VN' },
        { label: 'VU - Vanuatu', value: 'VU' },
        { label: 'WF - Wallis and Futuna', value: 'WF' },
        { label: 'WS - Samoa', value: 'WS' },
        { label: 'YE - Yemen', value: 'YE' },
        { label: 'YT - Mayotte', value: 'YT' },
        { label: 'ZA - South Africa', value: 'ZA' },
        { label: 'ZM - Zambia', value: 'ZM' },
        { label: 'ZW - Zimbabwe', value: 'ZW' }
      ]
    },
    modes: {
      label: 'Modes',
      description:
        'Comma delimited list of Data Processing Modes for this conversion event. Currently only LDU (Limited Data Use) is supported.',
      type: 'string',
      choices: [{ label: 'Limited Data Use', value: 'LDU' }]
    },
    region: {
      label: 'Region',
      description:
        'Region Code of the user. We support ISO 3166-2 region code, ex: "US-CA, US-NY, etc." or just the region code without country prefix, e.g. "CA, NY, etc.".',
      type: 'string'
    }
  }
}

export const screen_dimensions: InputField = {
  label: 'Screen Dimensions',
  description: "The dimensions of the user's screen.",
  type: 'object',
  additionalProperties: false,
  properties: {
    height: {
      label: 'Height',
      description: "The height of the user's screen in pixels. This must be positive and less than 32768.",
      type: 'integer'
    },
    width: {
      label: 'Width',
      description: "The width of the user's screen in pixels. This must be positive and less than 32768.",
      type: 'integer'
    }
  }
}
