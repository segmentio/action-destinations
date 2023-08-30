import { InputField } from '@segment/actions-core/destination-kit/types'

export const user_id: InputField = {
  label: 'User ID',
  description: 'Unique identifier for the user in your database. A userId or an anonymousId is required.',
  type: 'string'
}

export const anonymous_id: InputField = {
  label: 'Anonymous ID',
  description:
    'A pseudo-unique substitute for a User ID, for cases when you don’t have an absolutely unique identifier. A userId or an anonymousId is required.',
  type: 'string'
}

export const group_id: InputField = {
  label: 'Group ID',
  description: 'The group or account ID a user is associated with.',
  type: 'string'
}

export const traits: InputField = {
  label: 'Traits',
  description: 'Free-form dictionary of traits that describe the user or group of users.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  additionalProperties: true
}

export const engage_space: InputField = {
  label: 'Profile Space',
  description:
    'The Profile Space to use for creating a record. *Note: This field shows list of internal sources associated with the Profile Space. Changes made to the Profile Space name in **Settings** will not reflect in this list unless the source associated with the Profile Space is renamed explicitly.*',
  type: 'string',
  required: true,
  dynamic: true
}

export const email: InputField = {
  label: 'Email',
  description: 'Email of the user',
  type: 'string'
}

export const phone: InputField = {
  label: 'Phone',
  description: 'Phone number of the user',
  type: 'string'
}

export const email_subscription_status: InputField = {
  label: 'Email Subscription Status',
  description:
    'Global status of the email subscription. True is subscribed, false is unsubscribed and null|undefined is did-not-subscribe.',
  type: 'string'
}

export const sms_subscription_status: InputField = {
  label: 'SMS Subscription Status',
  description:
    'Global status of the SMS subscription. True is subscribed, false is unsubscribed and null|undefined is did-not-subscribe.',
  type: 'string'
}

export const whatsapp_subscription_status: InputField = {
  label: 'WhatsApp Subscription Status',
  description:
    'Global status of the WhatsApp subscription. True is subscribed, false is unsubscribed and null|undefined is did-not-subscribe.',
  type: 'string'
}

export const subscriptionGroups: InputField = {
  label: 'Subscription Groups',
  description: 'Subscription status for the groups. Object containing group names as keys and statuses as values',
  type: 'object',
  additionalProperties: true,
  unsafe_hidden: true,
  defaultObjectUI: 'keyvalue'
}
