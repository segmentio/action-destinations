export interface BatchJSON {
  identifiers: Identifiers
  attributes?: ProfileAttributes
  events?: Event[]
}

type Identifiers = {
  custom_id: string
} & {
  [key: string]: string
}

export interface ProfileAttributes {
  $email_address?: string | null
  $email_marketing?: SubscriptionSetting
  $phone_number?: string | null
  $sms_marketing?: SubscriptionSetting
  $language?: string | null
  $region?: string | null
  $timezone?: string | null
  [key: string]: string | string[] | number | boolean | null | undefined
}

export type SubscriptionSetting = 'subscribed' | 'unsubscribed' | null

export interface Event {
  name: string
  attributes?: EventAttributes
}

export type EventObject = {
  [key: string]: string | number | boolean | null | undefined | string[]
}

export interface EventAttributes {
  [key: string]: string | number | boolean | null | undefined | string[] | EventObject | EventObject[]
}
