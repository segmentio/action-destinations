import { ExecuteInput, ModifiedResponse, RequestClient } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import {
  box,
  emptyObjectToUndefined,
  isNullOrUndefined,
  splitListValueToArray,
  raiseMisconfiguredRequiredFieldErrorIf,
  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined,
  emptyStringToUndefined,
  parseNumberSafe,
  parseDateSafe,
  smartHash
} from './utils'
import { processHashing } from '../../../lib/hashing-utils'

const CURRENCY_ISO_4217_CODES = new Set([
  'USD',
  'AED',
  'AUD',
  'BGN',
  'BRL',
  'CAD',
  'CHF',
  'CLP',
  'CNY',
  'COP',
  'CZK',
  'DKK',
  'EGP',
  'EUR',
  'GBP',
  'GIP',
  'HKD',
  'HRK',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'JPY',
  'KRW',
  'KWD',
  'KZT',
  'LBP',
  'MXN',
  'MYR',
  'NGN',
  'NOK',
  'NZD',
  'PEN',
  'PHP',
  'PKR',
  'PLN',
  'QAR',
  'RON',
  'RUB',
  'SAR',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'TWD',
  'TZS',
  'UAH',
  'VND',
  'ZAR',
  'ALL',
  'BHD',
  'DZD',
  'GHS',
  'IQD',
  'ISK',
  'JOD',
  'KES',
  'MAD',
  'OMR',
  'XOF'
])

const US_STATE_CODES = new Map<string, string>([
  ['arizona', 'az'],
  ['alabama', 'al'],
  ['alaska', 'ak'],
  ['arkansas', 'ar'],
  ['california', 'ca'],
  ['colorado', 'co'],
  ['connecticut', 'ct'],
  ['delaware', 'de'],
  ['florida', 'fl'],
  ['georgia', 'ga'],
  ['hawaii', 'hi'],
  ['idaho', 'id'],
  ['illinois', 'il'],
  ['indiana', 'in'],
  ['iowa', 'ia'],
  ['kansas', 'ks'],
  ['kentucky', 'ky'],
  ['louisiana', 'la'],
  ['maine', 'me'],
  ['maryland', 'md'],
  ['massachusetts', 'ma'],
  ['michigan', 'mi'],
  ['minnesota', 'mn'],
  ['mississippi', 'ms'],
  ['missouri', 'mo'],
  ['montana', 'mt'],
  ['nebraska', 'ne'],
  ['nevada', 'nv'],
  ['newhampshire', 'nh'],
  ['newjersey', 'nj'],
  ['newmexico', 'nm'],
  ['newyork', 'ny'],
  ['northcarolina', 'nc'],
  ['northdakota', 'nd'],
  ['ohio', 'oh'],
  ['oklahoma', 'ok'],
  ['oregon', 'or'],
  ['pennsylvania', 'pa'],
  ['rhodeisland', 'ri'],
  ['southcarolina', 'sc'],
  ['southdakota', 'sd'],
  ['tennessee', 'tn'],
  ['texas', 'tx'],
  ['utah', 'ut'],
  ['vermont', 'vt'],
  ['virginia', 'va'],
  ['washington', 'wa'],
  ['westvirginia', 'wv'],
  ['wisconsin', 'wi'],
  ['wyoming', 'wy']
])

const COUNTRY_CODES = new Map<string, string>([
  ['afghanistan', 'af'],
  ['alandislands', 'ax'],
  ['albania', 'al'],
  ['algeria', 'dz'],
  ['americansamoa', 'as'],
  ['andorra', 'ad'],
  ['angola', 'ao'],
  ['anguilla', 'ai'],
  ['antarctica', 'aq'],
  ['antiguaandbarbuda', 'ag'],
  ['argentina', 'ar'],
  ['armenia', 'am'],
  ['aruba', 'aw'],
  ['australia', 'au'],
  ['austria', 'at'],
  ['azerbaijan', 'az'],
  ['bahamas', 'bs'],
  ['bahrain', 'bh'],
  ['bangladesh', 'bd'],
  ['barbados', 'bb'],
  ['belarus', 'by'],
  ['belgium', 'be'],
  ['belize', 'bz'],
  ['benin', 'bj'],
  ['bermuda', 'bm'],
  ['bhutan', 'bt'],
  ['bolivia', 'bo'],
  ['bosniaandherzegovina', 'ba'],
  ['botswana', 'bw'],
  ['bouvetisland', 'bv'],
  ['brazil', 'br'],
  ['britishindianoceanterritory', 'io'],
  ['bruneidarussalam', 'bn'],
  ['bulgaria', 'bg'],
  ['burkinafaso', 'bf'],
  ['burundi', 'bi'],
  ['cambodia', 'kh'],
  ['cameroon', 'cm'],
  ['canada', 'ca'],
  ['capeverde', 'cv'],
  ['caymanislands', 'ky'],
  ['centralafricanrepublic', 'cf'],
  ['chad', 'td'],
  ['chile', 'cl'],
  ['china', 'cn'],
  ['christmasisland', 'cx'],
  ['cocos(keeling)islands', 'cc'],
  ['colombia', 'co'],
  ['comoros', 'km'],
  ['congo', 'cg'],
  ['congo,democraticrepublic', 'cd'],
  ['cookislands', 'ck'],
  ['costarica', 'cr'],
  ["coted'ivoire", 'ci'],
  ['croatia', 'hr'],
  ['cuba', 'cu'],
  ['cyprus', 'cy'],
  ['czechrepublic', 'cz'],
  ['denmark', 'dk'],
  ['djibouti', 'dj'],
  ['dominica', 'dm'],
  ['dominicanrepublic', 'do'],
  ['ecuador', 'ec'],
  ['egypt', 'eg'],
  ['elsalvador', 'sv'],
  ['equatorialguinea', 'gq'],
  ['eritrea', 'er'],
  ['estonia', 'ee'],
  ['ethiopia', 'et'],
  ['falklandislands(malvinas)', 'fk'],
  ['faroeislands', 'fo'],
  ['fiji', 'fj'],
  ['finland', 'fi'],
  ['france', 'fr'],
  ['frenchguiana', 'gf'],
  ['frenchpolynesia', 'pf'],
  ['frenchsouthernterritories', 'tf'],
  ['gabon', 'ga'],
  ['gambia', 'gm'],
  ['georgia', 'ge'],
  ['germany', 'de'],
  ['ghana', 'gh'],
  ['gibraltar', 'gi'],
  ['greece', 'gr'],
  ['greenland', 'gl'],
  ['grenada', 'gd'],
  ['guadeloupe', 'gp'],
  ['guam', 'gu'],
  ['guatemala', 'gt'],
  ['guernsey', 'gg'],
  ['guinea', 'gn'],
  ['guinea-bissau', 'gw'],
  ['guyana', 'gy'],
  ['haiti', 'ht'],
  ['heardisland&mcdonaldislands', 'hm'],
  ['holysee(vaticancitystate)', 'va'],
  ['honduras', 'hn'],
  ['hongkong', 'hk'],
  ['hungary', 'hu'],
  ['iceland', 'is'],
  ['india', 'in'],
  ['indonesia', 'id'],
  ['iran,islamicrepublicof', 'ir'],
  ['iraq', 'iq'],
  ['ireland', 'ie'],
  ['isleofman', 'im'],
  ['israel', 'il'],
  ['italy', 'it'],
  ['jamaica', 'jm'],
  ['japan', 'jp'],
  ['jersey', 'je'],
  ['jordan', 'jo'],
  ['kazakhstan', 'kz'],
  ['kenya', 'ke'],
  ['kiribati', 'ki'],
  ['korea', 'kr'],
  ['kuwait', 'kw'],
  ['kyrgyzstan', 'kg'],
  ["laopeople'sdemocraticrepublic", 'la'],
  ['latvia', 'lv'],
  ['lebanon', 'lb'],
  ['lesotho', 'ls'],
  ['liberia', 'lr'],
  ['libyanarabjamahiriya', 'ly'],
  ['liechtenstein', 'li'],
  ['lithuania', 'lt'],
  ['luxembourg', 'lu'],
  ['macao', 'mo'],
  ['macedonia', 'mk'],
  ['madagascar', 'mg'],
  ['malawi', 'mw'],
  ['malaysia', 'my'],
  ['maldives', 'mv'],
  ['mali', 'ml'],
  ['malta', 'mt'],
  ['marshallislands', 'mh'],
  ['martinique', 'mq'],
  ['mauritania', 'mr'],
  ['mauritius', 'mu'],
  ['mayotte', 'yt'],
  ['mexico', 'mx'],
  ['micronesia,federatedstatesof', 'fm'],
  ['moldova', 'md'],
  ['monaco', 'mc'],
  ['mongolia', 'mn'],
  ['montenegro', 'me'],
  ['montserrat', 'ms'],
  ['morocco', 'ma'],
  ['mozambique', 'mz'],
  ['myanmar', 'mm'],
  ['namibia', 'na'],
  ['nauru', 'nr'],
  ['nepal', 'np'],
  ['netherlands', 'nl'],
  ['netherlandsantilles', 'an'],
  ['newcaledonia', 'nc'],
  ['newzealand', 'nz'],
  ['nicaragua', 'ni'],
  ['niger', 'ne'],
  ['nigeria', 'ng'],
  ['niue', 'nu'],
  ['norfolkisland', 'nf'],
  ['northernmarianaislands', 'mp'],
  ['norway', 'no'],
  ['oman', 'om'],
  ['pakistan', 'pk'],
  ['palau', 'pw'],
  ['palestinianterritory,occupied', 'ps'],
  ['panama', 'pa'],
  ['papuanewguinea', 'pg'],
  ['paraguay', 'py'],
  ['peru', 'pe'],
  ['philippines', 'ph'],
  ['pitcairn', 'pn'],
  ['poland', 'pl'],
  ['portugal', 'pt'],
  ['puertorico', 'pr'],
  ['qatar', 'qa'],
  ['reunion', 're'],
  ['romania', 'ro'],
  ['russianfederation', 'ru'],
  ['rwanda', 'rw'],
  ['saintbarthelemy', 'bl'],
  ['sainthelena', 'sh'],
  ['saintkittsandnevis', 'kn'],
  ['saintlucia', 'lc'],
  ['saintmartin', 'mf'],
  ['saintpierreandmiquelon', 'pm'],
  ['saintvincentandgrenadines', 'vc'],
  ['samoa', 'ws'],
  ['sanmarino', 'sm'],
  ['saotomeandprincipe', 'st'],
  ['saudiarabia', 'sa'],
  ['senegal', 'sn'],
  ['serbia', 'rs'],
  ['seychelles', 'sc'],
  ['sierraleone', 'sl'],
  ['singapore', 'sg'],
  ['slovakia', 'sk'],
  ['slovenia', 'si'],
  ['solomonislands', 'sb'],
  ['somalia', 'so'],
  ['southafrica', 'za'],
  ['southgeorgiaandsandwichisl.', 'gs'],
  ['spain', 'es'],
  ['srilanka', 'lk'],
  ['sudan', 'sd'],
  ['suriname', 'sr'],
  ['svalbardandjanmayen', 'sj'],
  ['swaziland', 'sz'],
  ['sweden', 'se'],
  ['switzerland', 'ch'],
  ['syrianarabrepublic', 'sy'],
  ['taiwan', 'tw'],
  ['tajikistan', 'tj'],
  ['tanzania', 'tz'],
  ['thailand', 'th'],
  ['timor-leste', 'tl'],
  ['togo', 'tg'],
  ['tokelau', 'tk'],
  ['tonga', 'to'],
  ['trinidadandtobago', 'tt'],
  ['tunisia', 'tn'],
  ['turkey', 'tr'],
  ['turkmenistan', 'tm'],
  ['turksandcaicosislands', 'tc'],
  ['tuvalu', 'tv'],
  ['uganda', 'ug'],
  ['ukraine', 'ua'],
  ['unitedarabemirates', 'ae'],
  ['unitedkingdom', 'gb'],
  ['unitedstates', 'us'],
  ['unitedstatesoutlyingislands', 'um'],
  ['uruguay', 'uy'],
  ['uzbekistan', 'uz'],
  ['vanuatu', 'vu'],
  ['venezuela', 've'],
  ['vietnam', 'vn'],
  ['virginislands,british', 'vg'],
  ['virginislands,u.s.', 'vi'],
  ['wallisandfutuna', 'wf'],
  ['westernsahara', 'eh'],
  ['yemen', 'ye'],
  ['zambia', 'zm'],
  ['zimbabwe', 'zw']
])

const iosAppIDRegex = new RegExp('^[0-9]+$')

const buildAppData = (payload: Payload, settings: Settings) => {
  const { app_data } = payload
  const app_id = emptyStringToUndefined(settings.app_id)

  // Ideally advertisers on iOS 14.5+ would pass the ATT_STATUS from the device.
  // However the field is required for app events, so hardcode the value to false (0)
  // for any events sent that include app_data.
  const advertiser_tracking_enabled = app_data?.advertiser_tracking_enabled ? 1 : 0

  const appDataApplicationTrackingEnabled = app_data?.application_tracking_enabled ? 1 : 0
  const application_tracking_enabled = app_data != null ? appDataApplicationTrackingEnabled : undefined

  const appDataExtInfoVersion = app_data?.version
  const appIDExtInfoVersion = iosAppIDRegex.test(app_id ?? '') ? 'i2' : 'a2'
  const extInfoVersion = appDataExtInfoVersion ?? appIDExtInfoVersion

  // extinfo needs to be defined whenever app_data is included in the data payload
  const extinfo = [
    extInfoVersion, // required per spec version must be a2 for Android, must be i2 for iOS
    app_data?.packageName ?? '',
    app_data?.shortVersion ?? '',
    app_data?.longVersion ?? '',
    app_data?.osVersion ?? payload.os_version ?? '', // os version
    app_data?.deviceName ?? payload.device_model ?? '', // device model name
    app_data?.locale ?? '',
    app_data?.timezone ?? '',
    app_data?.carrier ?? '',
    app_data?.width ?? '',
    app_data?.height ?? '',
    app_data?.density ?? '',
    app_data?.cpuCores ?? '',
    app_data?.storageSize ?? '',
    app_data?.freeStorage ?? '',
    app_data?.deviceTimezone ?? ''
  ]

  // Only set app data for app events
  return {
    app_id,
    advertiser_tracking_enabled,
    application_tracking_enabled,
    extinfo
  }
}

const buildUserData = (payload: Payload) => {
  const { user_data } = payload
  // Removes all leading and trailing whitespace and converts all characters to lowercase.
  const normalizedValue = (value: string) => value?.replace(/\s/g, '').toLowerCase()
  const email = smartHash(user_data?.email ?? payload.email, normalizedValue)

  // Removes all non-numberic characters and leading zeros.
  const normalizedPhoneNumber = (value: string) => value?.replace(/\D|^0+/g, '')
  const phone_number = smartHash(user_data?.phone ?? payload.phone_number, normalizedPhoneNumber)

  // Converts all characters to lowercase
  const madid = (user_data?.madid ?? payload.mobile_ad_id)?.toLowerCase()

  const normalizedGender = (value: string): string => {
    const normalizedValue = value?.replace(/\s/g, '').toLowerCase()
    return normalizedValue === 'male' ? 'm' : normalizedValue === 'female' ? 'f' : normalizedValue
  }
  const hashedGender = smartHash(user_data?.gender, normalizedGender)

  const hashedLastName = smartHash(user_data?.lastName, normalizedValue)

  const hashedFirstName = smartHash(user_data?.firstName, normalizedValue)

  const client_ip_address = user_data?.client_ip_address ?? payload.ip_address
  const client_user_agent = user_data?.client_user_agent ?? payload.user_agent

  const hashedCity = smartHash(user_data?.city, normalizedValue)

  // checks if the full US state name is used instead of the two letter abbreviation
  const normalizedState = (value: string): string => {
    const normalizedValue = value?.replace(/\s/g, '').toLowerCase()
    return US_STATE_CODES.get(normalizedValue ?? '') ?? normalizedValue
  }
  const hashedState = smartHash(user_data?.state, normalizedState)

  const hashedZip = smartHash(user_data?.zip, normalizedValue)

  const normalizedCountry = (value: string): string => {
    const normalizedValue = value?.replace(/\s/g, '').toLowerCase()
    return COUNTRY_CODES.get(normalizedValue ?? '') ?? normalizedValue
  }
  const hashedCountry = smartHash(user_data?.country, normalizedCountry)

  const external_id = user_data?.externalId?.map((id) => {
    return processHashing(id, 'sha256', 'hex', normalizedValue)
  })

  const db = smartHash(user_data?.dateOfBirth)
  const lead_id = user_data?.leadID
  const subscription_id = user_data?.subscriptionID

  const idfv = user_data?.idfv ?? payload.idfv

  const sc_click_id = user_data?.sc_click_id ?? payload.click_id
  const sc_cookie1 = user_data?.sc_cookie1 ?? payload.uuid_c1

  return {
    client_ip_address,
    client_user_agent,
    country: hashedCountry,
    ct: hashedCity,
    db,
    em: box(email),
    external_id,
    fn: hashedFirstName,
    ge: hashedGender,
    idfv,
    lead_id,
    ln: hashedLastName,
    madid,
    ph: box(phone_number),
    sc_click_id,
    sc_cookie1,
    st: hashedState,
    subscription_id,
    zp: hashedZip
  }
}

const buildCustomData = (payload: Payload) => {
  const { custom_data } = payload

  const products = payload.products?.filter(({ item_id }) => item_id != null)

  const content_ids = products?.map(({ item_id }) => item_id ?? '') ?? splitListValueToArray(payload.item_ids ?? '')

  const content_category =
    products?.map(({ item_category }) => item_category ?? '') ?? splitListValueToArray(payload.item_category ?? '')

  const brands = products?.map((product) => product.brand ?? '') ?? payload.brands

  const num_items = custom_data?.num_items ?? products?.length ?? parseNumberSafe(payload.number_items)

  const currency = emptyStringToUndefined(custom_data?.currency ?? payload.currency)?.toUpperCase()
  const order_id = emptyStringToUndefined(custom_data?.order_id ?? payload.transaction_id)
  const search_string = emptyStringToUndefined(custom_data?.search_string ?? payload.search_string)
  const sign_up_method = emptyStringToUndefined(custom_data?.sign_up_method ?? payload.sign_up_method)
  const value = custom_data?.value ?? payload.price

  const checkin_date = emptyStringToUndefined(custom_data?.checkin_date)
  const travel_end = emptyStringToUndefined(custom_data?.travel_end)
  const travel_start = emptyStringToUndefined(custom_data?.travel_start)
  const suggested_destinations = emptyStringToUndefined(custom_data?.suggested_destinations)
  const destination_airport = emptyStringToUndefined(custom_data?.destination_airport)
  const country = emptyStringToUndefined(custom_data?.country)
  const city = emptyStringToUndefined(custom_data?.city)
  const region = emptyStringToUndefined(custom_data?.region)
  const neighborhood = emptyStringToUndefined(custom_data?.neighborhood)
  const departing_departure_date = emptyStringToUndefined(custom_data?.departing_departure_date)
  const departing_arrival_date = emptyStringToUndefined(custom_data?.departing_arrival_date)
  const num_adults = custom_data?.num_adults
  const origin_airport = emptyStringToUndefined(custom_data?.origin_airport)
  const returning_departure_date = emptyStringToUndefined(custom_data?.returning_departure_date)
  const returning_arrival_date = emptyStringToUndefined(custom_data?.returning_arrival_date)
  const num_children = custom_data?.num_children
  const hotel_score = emptyStringToUndefined(custom_data?.hotel_score)
  const postal_code = emptyStringToUndefined(custom_data?.postal_code)
  const num_infants = custom_data?.num_infants
  const preferred_neighborhoods = emptyStringToUndefined(custom_data?.preferred_neighborhoods)
  const preferred_star_ratings = emptyStringToUndefined(custom_data?.preferred_star_ratings)
  const suggested_hotels = emptyStringToUndefined(custom_data?.suggested_hotels)

  const dta_fields = {
    checkin_date,
    travel_end,
    travel_start,
    suggested_destinations,
    destination_airport,
    country,
    city,
    region,
    neighborhood,
    departing_departure_date,
    departing_arrival_date,
    num_adults,
    origin_airport,
    returning_departure_date,
    returning_arrival_date,
    num_children,
    hotel_score,
    postal_code,
    num_infants,
    preferred_neighborhoods,
    preferred_star_ratings,
    suggested_hotels
  }

  return emptyObjectToUndefined({
    brands,
    content_category,
    content_ids,
    currency,
    num_items,
    order_id,
    search_string,
    sign_up_method,
    value,
    ...dta_fields
  })
}

const eventConversionTypeToActionSource: { [k in string]?: string } = {
  WEB: 'website',
  MOBILE_APP: 'app',

  // Use the snap event_conversion_type for offline events
  OFFLINE: 'OFFLINE'
}

const getSupportedActionSource = (action_source: string | undefined): string | undefined => {
  const normalizedActionSource = emptyStringToUndefined(action_source)

  // Snap doesn't support all the defined action sources, so fall back to OFFLINE if specified.
  return ['website', 'app'].indexOf(normalizedActionSource ?? '') > -1
    ? normalizedActionSource
    : normalizedActionSource != null
    ? 'OFFLINE'
    : undefined
}

const buildPayloadData = (payload: Payload, settings: Settings) => {
  // event_conversion_type is a required parameter whose value is enforced as
  // always OFFLINE, WEB, or MOBILE_APP, so in practice action_source will always have a value.
  const action_source =
    getSupportedActionSource(payload.action_source) ??
    eventConversionTypeToActionSource[payload.event_conversion_type ?? '']

  // Snaps CAPI v3 supports the legacy v2 events so don't bother
  // translating them
  const event_name = payload.event_name ?? payload.event_type
  const event_source_url = payload.event_source_url ?? payload.page_url
  const event_id = emptyStringToUndefined(payload.event_id) ?? emptyStringToUndefined(payload.client_dedup_id)

  const payload_event_time = payload.event_time ?? payload.timestamp
  // Handle the case where a number is passed instead of an ISO8601 timestamp
  const event_time_number = parseNumberSafe(payload_event_time ?? '')
  const event_time_date_time = parseDateSafe(payload_event_time ?? '')
  const event_time = event_time_date_time ?? event_time_number

  const app_data = action_source === 'app' ? buildAppData(payload, settings) : undefined
  const user_data = buildUserData(payload)
  const custom_data = buildCustomData(payload)

  const data_processing_options = payload.data_processing_options ?? false ? ['LDU'] : undefined

  return {
    integration: 'segment',
    event_id,
    event_name,
    event_source_url,
    event_time,
    user_data,
    custom_data,
    action_source,
    app_data,
    data_processing_options,
    data_processing_options_country: payload.data_processing_options_country,
    data_processing_options_state: payload.data_processing_options_state
  }
}

const validateSettingsConfig = (settings: Settings, action_source: string | undefined) => {
  const { snap_app_id, pixel_id } = settings
  const snapAppID = emptyStringToUndefined(snap_app_id)
  const snapPixelID = emptyStringToUndefined(pixel_id)

  raiseMisconfiguredRequiredFieldErrorIf(
    action_source === 'OFFLINE' && isNullOrUndefined(snapPixelID),
    'If event conversion type is "OFFLINE" then Pixel ID must be defined'
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    action_source === 'app' && isNullOrUndefined(snapAppID),
    'If event conversion type is "MOBILE_APP" then Snap App ID must be defined'
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    action_source === 'website' && isNullOrUndefined(snapPixelID),
    `If event conversion type is "WEB" then Pixel ID must be defined`
  )
}

const buildRequestURL = (settings: Settings, action_source: string | undefined, authToken: string) => {
  const { snap_app_id, pixel_id } = settings

  // Some configurations specify both a snapPixelID and a snapAppID. In these cases
  // check the conversion type to ensure that the right id is selected and used.
  const appOrPixelID = emptyStringToUndefined(
    (() => {
      switch (action_source) {
        case 'website':
        case 'OFFLINE':
          return pixel_id
        case 'app':
          return snap_app_id
        default:
          return undefined
      }
    })()
  )

  return `https://tr.snapchat.com/v3/${appOrPixelID}/events?access_token=${authToken}`
}

const validatePayload = (payload: ReturnType<typeof buildPayloadData>) => {
  const {
    action_source,
    event_name,
    event_time,
    custom_data = {} as NonNullable<typeof payload.custom_data>,
    user_data
  } = payload

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(
    action_source,
    "The root value is missing the required field 'action_source'."
  )

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(
    event_name,
    "The root value is missing the required field 'event_name'."
  )

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(
    event_time,
    "The root value is missing the required field 'event_time'."
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    !isNullOrUndefined(custom_data.currency) && !CURRENCY_ISO_4217_CODES.has(custom_data.currency),
    `${custom_data.currency} is not a valid currency code.`
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    isNullOrUndefined(user_data.em) &&
      isNullOrUndefined(user_data.ph) &&
      isNullOrUndefined(user_data.madid) &&
      (isNullOrUndefined(user_data.client_ip_address) || isNullOrUndefined(user_data.client_user_agent)),
    `Payload must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields`
  )
}

export const performSnapCAPIv3 = async (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload>
): Promise<ModifiedResponse<unknown>> => {
  const { payload, settings } = data

  const payloadData = buildPayloadData(payload, settings)

  validatePayload(payloadData)
  validateSettingsConfig(settings, payloadData.action_source)

  const authToken = emptyStringToUndefined(data.auth?.accessToken)
  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(authToken, 'Missing valid auth token')

  const url = buildRequestURL(settings, payloadData.action_source, authToken)

  return request(url, {
    method: 'post',
    json: {
      data: [payloadData]
    }
  })
}
