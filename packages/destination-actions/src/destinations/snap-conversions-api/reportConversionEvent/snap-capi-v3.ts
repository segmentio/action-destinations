import { ExecuteInput, ModifiedResponse, RequestClient } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import {
  box,
  emptyObjectToUndefined,
  hash,
  hashEmailSafe,
  isNullOrUndefined,
  splitListValueToArray,
  raiseMisconfiguredRequiredFieldErrorIf,
  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined,
  emptyStringToUndefined,
  parseNumberSafe
} from './utils'

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

const validatePayload = (payload: Payload): Payload => {
  raiseMisconfiguredRequiredFieldErrorIf(
    !isNullOrUndefined(payload.currency) && !CURRENCY_ISO_4217_CODES.has(payload.currency.toUpperCase()),
    `${payload.currency} is not a valid currency code.`
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    isNullOrUndefined(payload.email) &&
      isNullOrUndefined(payload.phone_number) &&
      isNullOrUndefined(payload.mobile_ad_id) &&
      (isNullOrUndefined(payload.ip_address) || isNullOrUndefined(payload.user_agent)),
    `Payload must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields`
  )

  return payload
}

const eventConversionTypeToActionSource: { [k in string]?: string } = {
  WEB: 'website',
  MOBILE_APP: 'app',

  // Use the snap event_conversion_type for offline events
  OFFLINE: 'OFFLINE'
}

const iosAppIDRegex = new RegExp('^[0-9]+$')

const buildAppData = (payload: Payload, settings: Settings) => {
  const { app_data } = payload
  const app_id = emptyStringToUndefined(settings.app_id)

  // Ideally advertisers on iOS 14.5+ would pass the ATT_STATUS from the device.
  // However the field is required for app events, so hardcode the value to false (0)
  // for any events sent that include app_data.
  const appDataAdvertiserTrackingEnabled = app_data?.advertiser_tracking_enabled ? 1 : 0
  const appDataIfAppIdIsDefined = !isNullOrUndefined(app_id) ? 0 : undefined
  const advertiser_tracking_enabled = app_data != null ? appDataAdvertiserTrackingEnabled : appDataIfAppIdIsDefined

  const appDataApplicationTrackingEnabled = app_data?.application_tracking_enabled ? 1 : 0
  const application_tracking_enabled = app_data != null ? appDataApplicationTrackingEnabled : undefined

  const appDataExtInfoVersion = app_data?.version
  const appIDExtInfoVersion = iosAppIDRegex.test((app_id ?? '').trim()) ? 'i2' : 'a2'
  const extInfoVersion = appDataExtInfoVersion ?? appIDExtInfoVersion

  // extinfo needs to be defined whenever app_data is included in the data payload
  const extinfo = !isNullOrUndefined(app_id)
    ? [
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
    : undefined

  // Only set app data for app events
  return emptyObjectToUndefined({
    app_id,
    advertiser_tracking_enabled,
    application_tracking_enabled,
    extinfo
  })
}

const buildUserData = (payload: Payload) => {
  const { user_data } = payload
  // Removes all leading and trailing whitespace and converts all characters to lowercase.
  const normalizedEmail = (user_data?.email ?? payload.email)?.replace(/\s/g, '').toLowerCase()
  const email = hashEmailSafe(normalizedEmail)

  // Removes all non-numberic characters and leading zeros.
  const normalizedPhoneNumber = (user_data?.phone ?? payload.phone_number)?.replace(/\D|^0+/g, '')
  const phone_number = hash(normalizedPhoneNumber)

  // Converts all characters to lowercase
  const madid = payload.mobile_ad_id?.toLowerCase()

  const normalizedGender = user_data?.gender?.replace(/\s/g, '').toLowerCase()
  const gender = normalizedGender === 'male' ? 'm' : normalizedGender === 'female' ? 'f' : normalizedGender
  const hashedGender = hash(gender)

  const normalizedLastName = user_data?.lastName?.replace(/\s/g, '')?.toLowerCase()
  const hashedLastName = hash(normalizedLastName)

  const normalizedFirstName = user_data?.firstName?.replace(/\s/g, '')?.toLowerCase()
  const hashedFirstName = hash(normalizedFirstName)

  const client_ip_address = user_data?.client_ip_address ?? payload.ip_address
  const client_user_agent = user_data?.client_user_agent ?? payload.user_agent

  const normalizedCity = user_data?.city?.replace(/\s/g, '')?.toLowerCase()
  const hashedCity = hash(normalizedCity)

  const normalizedState = user_data?.state?.replace(/\s/g, '').toLowerCase()
  // checks if the full US state name is used instead of the two letter abbreviation
  const state = US_STATE_CODES.get(normalizedState ?? '') ?? normalizedState
  const hashedState = hash(state)

  const normalizedZip = user_data?.zip?.replace(/\s/g, '').toLowerCase()
  const hashedZip = hash(normalizedZip)

  const normalizedCountry = user_data?.country?.replace(/\s/g, '').toLowerCase()
  const country = COUNTRY_CODES.get(normalizedCountry ?? '') ?? normalizedCountry
  const hashedCountry = hash(country)

  const external_id = user_data?.externalId?.map((id) => {
    const normalizedId = id.replace(/\s/g, '').toLowerCase()
    return hash(normalizedId) as string
  })

  const db = hash(user_data?.dateOfBirth)
  const lead_id = user_data?.leadID
  const subscription_id = user_data?.subscriptionID

  const sc_click_id = payload.click_id
  const sc_cookie1 = payload.uuid_c1

  return emptyObjectToUndefined({
    client_ip_address,
    client_user_agent,
    country: hashedCountry,
    ct: hashedCity,
    db,
    em: box(email),
    external_id,
    fn: hashedFirstName,
    ge: hashedGender,
    idfv: payload.idfv,
    lead_id,
    ln: hashedLastName,
    madid,
    ph: box(phone_number),
    sc_click_id,
    sc_cookie1,
    st: hashedState,
    subscription_id,
    zp: hashedZip
  })
}

const buildCustomData = (payload: Payload) => {
  // If customer populates products array, use it instead of the individual fields
  const products = (payload.products ?? []).filter(({ item_id }) => item_id != null)

  const { content_ids, content_category, brands, num_items } =
    products.length > 0
      ? {
          content_ids: products.map(({ item_id }) => item_id),
          content_category: products.map(({ item_category }) => item_category ?? ''),
          brands: products.map((product) => product.brand ?? ''),
          num_items: products.length
        }
      : (() => {
          const content_ids = splitListValueToArray(payload.item_ids ?? '')
          return {
            content_ids,
            content_category: splitListValueToArray(payload.item_category ?? ''),
            brands: payload.brands,
            num_items: parseNumberSafe(payload.number_items) ?? content_ids?.length
          }
        })()

  return emptyObjectToUndefined({
    brands,
    content_category,
    content_ids,
    currency: payload.currency,
    num_items,
    order_id: emptyStringToUndefined(payload.transaction_id),
    search_string: payload.search_string,
    sign_up_method: payload.sign_up_method,
    value: payload.price
  })
}

const formatPayload = (payload: Payload, settings: Settings): object => {
  // event_conversion_type is a required parameter whose value is enforced as
  // always OFFLINE, WEB, or MOBILE_APP, so in practice action_source will always have a value.
  const action_source = eventConversionTypeToActionSource[payload.event_conversion_type]

  const event_id = emptyStringToUndefined(payload.client_dedup_id)

  const app_data = action_source === 'app' ? buildAppData(payload, settings) : undefined
  const user_data = buildUserData(payload)
  const custom_data = buildCustomData(payload)

  const result = {
    data: [
      {
        integration: 'segment',
        event_id,

        // Snaps CAPI v3 supports the legacy v2 events so don't bother
        // translating them
        event_name: payload.event_type,
        event_source_url: payload.page_url,
        event_time: Date.parse(payload.timestamp),
        user_data,
        custom_data,
        action_source,
        app_data
      }
    ]
  }

  return result
}

const validateAppOrPixelID = (settings: Settings, event_conversion_type: string): string => {
  const { snap_app_id, pixel_id } = settings
  const snapAppID = emptyStringToUndefined(snap_app_id)
  const snapPixelID = emptyStringToUndefined(pixel_id)

  // Some configurations specify both a snapPixelID and a snapAppID. In these cases
  // check the conversion type to ensure that the right id is selected and used.
  const appOrPixelID = (() => {
    switch (event_conversion_type) {
      case 'WEB':
      case 'OFFLINE':
        return snapPixelID
      case 'MOBILE_APP':
        return snapAppID
      default:
        return undefined
    }
  })()

  raiseMisconfiguredRequiredFieldErrorIf(
    event_conversion_type === 'OFFLINE' && isNullOrUndefined(snapPixelID),
    'If event conversion type is "OFFLINE" then Pixel ID must be defined'
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    event_conversion_type === 'MOBILE_APP' && isNullOrUndefined(snapAppID),
    'If event conversion type is "MOBILE_APP" then Snap App ID must be defined'
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    event_conversion_type === 'WEB' && isNullOrUndefined(snapPixelID),
    `If event conversion type is "${event_conversion_type}" then Pixel ID must be defined`
  )

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(appOrPixelID, 'Missing valid app or pixel ID')

  return appOrPixelID
}

export const buildRequestURL = (appOrPixelID: string, authToken: string) =>
  `https://tr.snapchat.com/v3/${appOrPixelID}/events?access_token=${authToken}`

export const performSnapCAPIv3 = async (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload>
): Promise<ModifiedResponse<unknown>> => {
  const { payload, settings } = data
  const { event_conversion_type } = payload
  const authToken = emptyStringToUndefined(data.auth?.accessToken)

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(authToken, 'Missing valid auth token')

  const url = buildRequestURL(validateAppOrPixelID(settings, event_conversion_type), authToken)
  const json = formatPayload(validatePayload(payload), settings)

  return request(url, {
    method: 'post',
    json
  })
}
