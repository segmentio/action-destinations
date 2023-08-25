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

export const subscriptions: InputField = {
  // export const subscriptionProperties: Record<string, InputField> = {
  //   subscriptions: {
  label: 'Engage Channel and Group Subscriptions',
  description: 'Information about users Global Subscription, Channel, Subscription Groups.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  multiple: true,
  additionalProperties: false,
  // required: true,
  // default: {
  //   '@arrayPath': [
  //     {
  //       key: '',
  //       type: '',
  //       status: '',
  //       groups: {
  //         name: '',
  //         status: ''
  //       }
  //     }
  //   ]
  // },
  properties: {
    key: {
      label: 'Key',
      description: 'The unique identifier for the subscription (e.g., phone number, email).',
      type: 'string',
      required: true
    },
    type: {
      label: 'Type',
      description: 'The medium of subscription (e.g., SMS, EMAIL, WHATSAPP).',
      type: 'string',
      choices: [
        { value: 'SMS', label: 'SMS' },
        { value: 'EMAIL', label: 'EMAIL' },
        { value: 'WHATSAPP', label: 'WHATSAPP' }
      ],
      required: true
    },
    status: {
      label: 'Status',
      description: 'The subscription status for the user.',
      type: 'string',
      choices: [
        { value: 'SUBSCRIBED', label: 'SUBSCRIBED' },
        { value: 'UNSUBSCRIBED', label: 'UNSUBSCRIBED' },
        { value: 'DID_NOT_SUBSCRIBE', label: 'DID_NOT_SUBSCRIBE' }
      ],
      required: true
    },
    groups: {
      label: 'Groups',
      description: 'Subscription groups the user is associated with.',
      type: 'object',
      multiple: true,
      dynamic: true,
      properties: {
        name: {
          label: 'Group Name',
          description: 'Name of the subscription group.',
          type: 'string',
          required: true
        },
        status: {
          label: 'Group Status',
          description: 'The subscription status for the specific group.',
          type: 'string',
          choices: [
            { value: 'SUBSCRIBED', label: 'SUBSCRIBED' },
            { value: 'UNSUBSCRIBED', label: 'UNSUBSCRIBED' },
            { value: 'DID_NOT_SUBSCRIBE', label: 'DID_NOT_SUBSCRIBE' }
          ],
          required: true
        }
      }
    }
    //}
  }
  // In this representation:
  //
  // 1. The top-level structure represents the user's subscriptions.
  // 2. Each subscription is defined with attributes like 'key', 'type', and 'status' which capture the core details of the subscription.
  //     - 'key' is a unique identifier for the subscription, which can be an email or a phone number.
  //     - 'type' specifies the medium of the subscription, with predefined choices like 'SMS', 'EMAIL', and 'WHATSAPP'.
  //     - 'status' represents the current state of the subscription, which can have values like 'SUBSCRIBED', 'UNSUBSCRIBED' or 'DID_NOT_SUBSCRIBE'.
  // 3. Inside the subscription structure, there's a 'groups' attribute, modeled as another InputField.
  //     - This 'groups' attribute contains a list of group objects (type: 'object', multiple: true).
  //     - Each group object within this list has two main properties: 'name' (which identifies the group) and 'status' (which describes the user's relationship with that group).
  //     - By adding dynamic: true, it means that the groups property can have dynamic values & can let users or the system add them dynamically..
  // 4. The configuration supports additional properties. This means that even if new properties are added to the data in the future, the system will not reject them.
  // 5. A `defaultObjectUI` of 'keyvalue' ensures that users interface with a key-value editor by default, suitable for the object structure.
  //
  // This configuration captures the entire structure of the subscriptions object as initially described and provides flexibility for future data variations.
}
