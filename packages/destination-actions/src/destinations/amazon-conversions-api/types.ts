export const Region = {
    NA: 'https://advertising-api.amazon.com',
    EU: 'https://advertising-api-eu.amazon.com',
    FE: 'https://advertising-api-fe.amazon.com'
} as const

export type RegionKey = keyof typeof Region

export type RegionValue = typeof Region[RegionKey]

export interface GeographicConsentData {
    ipAddress?: string
}

export interface AmazonConsentFormat {
    amznAdStorage?: 'GRANTED' | 'DENIED'
    amznUserData?: 'GRANTED' | 'DENIED'
}

export interface ConsentData {
    geo?: GeographicConsentData
    amazonConsent?: AmazonConsentFormat
    tcf?: string
    gpp?: string
}

export interface CustomAttributeV1 {
    name: string
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN'
    value: string
}

/**
 * Types of user identifiers that can be used for matching an event to a user.
 */
export enum MatchKeyTypeV1 {
    EMAIL = 'EMAIL',
    PHONE = 'PHONE',
    FIRST_NAME = 'FIRST_NAME',
    LAST_NAME = 'LAST_NAME',
    ADDRESS = 'ADDRESS',
    CITY = 'CITY',
    STATE = 'STATE',
    POSTAL = 'POSTAL',
    MAID = 'MAID',
    RAMP_ID = 'RAMP_ID',
    MATCH_ID = 'MATCH_ID'
}

/**
 * The identifier used to match people for attribution. Matched key data needs to be normalized and hashed.
 * Email addresses provided must follow the [formatting guidelines](https://advertising.amazon.com/dsp/help/ss/en/audiences#GCCXMZYCK4RXWS6C):
 * Lowercase, remove all non-alphanumeric characters [a-zA-Z0-9] and [.@-],
 * and remove any leading or trailing whitespace. Only SHA-256 is supported.
 */
export interface MatchKeyV1 {
    type: MatchKeyTypeV1
    values: [string] // Array with exactly one element
}

/**
 * Represents an event to ingest for measurement purposes. Name, eventType, eventActionSource must be provided
 * and represents an unique event.
 */
/**
 * Event Types:
 * - ADD_TO_SHOPPING_CART - When customers add a product to their shopping cart.
 * - APPLICATION - When customers submit an application.
 * - CHECKOUT - When customers go to the checkout page.
 * - CONTACT - When customers provide contact information, such as email, phone number, etc.
 * - LEAD - When customers perform an action that initiates a sales lead.
 * - OFF_AMAZON_PURCHASES - When customers make a purchase for a service or product.
 * - MOBILE_APP_FIRST_START - When customers launch the downloaded app for the first time.
 * - PAGE_VIEW - When customers visit a page on your website.
 * - SEARCH - When customers perform a search for a product.
 * - SIGN_UP - When customers sign up for a product or service.
 * - SUBSCRIBE - When customers subscribe to your service.
 * - OTHER - Customer actions that don't fit the definition of the standard event types.
 */
export enum ConversionTypeV2 {
    ADD_TO_SHOPPING_CART = 'ADD_TO_SHOPPING_CART',
    APPLICATION = 'APPLICATION',
    CHECKOUT = 'CHECKOUT',
    CONTACT = 'CONTACT',
    LEAD = 'LEAD',
    OFF_AMAZON_PURCHASES = 'OFF_AMAZON_PURCHASES',
    MOBILE_APP_FIRST_START = 'MOBILE_APP_FIRST_START',
    PAGE_VIEW = 'PAGE_VIEW',
    SEARCH = 'SEARCH',
    SIGN_UP = 'SIGN_UP',
    SUBSCRIBE = 'SUBSCRIBE',
    OTHER = 'OTHER'
}

/**
 * The currencyCode associated with the 'value' of the event in ISO-4217 format.
 * Only applicable for OFF_AMAZON_PURCHASES event type.
 * If not provided, the currencyCode setting on the event will be used.
 */
export enum CurrencyCodeV1 {
    AED = 'AED',
    AUD = 'AUD',
    BRL = 'BRL',
    CAD = 'CAD',
    CNY = 'CNY',
    EUR = 'EUR',
    GBP = 'GBP',
    INR = 'INR',
    JPY = 'JPY',
    MXN = 'MXN',
    SAR = 'SAR',
    SEK = 'SEK',
    SGD = 'SGD',
    TRY = 'TRY',
    USD = 'USD',
    DKK = 'DKK',
    NOK = 'NOK',
    NZD = 'NZD'
}

export interface EventData {
    name: string
    eventType: ConversionTypeV2
    eventActionSource: string
    countryCode: string
    timestamp: string
    matchKeys?: MatchKeyV1[]
    value?: number
    currencyCode?: CurrencyCodeV1
    unitsSold?: number
    clientDedupeId?: string
    dataProcessingOptions?: string[]
    consent?: ConsentData
    customAttributes?: CustomAttributeV1[]
    amazonImpressionId?: string
    amazonClickId?: string
}

export interface RefreshTokenResponse {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
}

export interface SubErrorV1 {
    errorCode?: number
    errorType?: string
    errorMessage?: string
}

export interface EventDataSuccessResponseV1 {
    index: number,
    message?: string
}

export interface EventDataErrorResponseV1 {
    httpStatusCode?: string
    itemRequestId?: string
    index: number
    itemId?: string
    subErrors?: SubErrorV1[]
}

export interface ImportConversionEventsResponse {
    success?: EventDataSuccessResponseV1[]
    error?: EventDataErrorResponseV1[]
}