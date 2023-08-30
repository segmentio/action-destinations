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

// export const groupSubscriptions: InputField = {
//   label: 'Subscription Groups1',
//   description: 'Groups the user is subscribed to.',
//   type: 'object',
//   multiple: true,
//   defaultObjectUI: 'keyvalue',
//   //dynamic: true,
//   properties: {
//     name: {
//       label: 'Subscription Group Name',
//       description: 'Name of the subscription group.',
//       type: 'string',
//       //required: true
//     },
//     status: {
//       label: 'Group Status',
//       description: 'The subscription status for the specific group. Currently, it is supported for EMAIL channel',
//       type: 'string',
//       choices: [
//         { value: 'SUBSCRIBED', label: 'SUBSCRIBED' },
//         { value: 'UNSUBSCRIBED', label: 'UNSUBSCRIBED' },
//         { value: 'DID_NOT_SUBSCRIBE', label: 'DID_NOT_SUBSCRIBE' }
//       ],
//       //required: true
//     }
//   }
// }

// export const subscriptions: InputField = {
//   label: 'Subscriptions',
//   description: 'Subscription Object contains Global Subscription , Channel , Subscription Groups.',
//   type: 'object',
//   multiple: true,
//   additionalProperties: true,
//   required: true,
//   properties: {
//     email: {
//       label: 'Email',
//       description: 'Email of the user',
//       type: 'string'
//     },
//     phone: {
//       label: 'Phone',
//       description: 'Phone number of the user',
//       type: 'string'
//     },
//     email_subscription_status: {
//       label: 'Email Subscription Status',
//       description: 'Global status of the email subscription. True is subscribed, false is unsubscribed and null|undefined is did-not-subscribe.',
//       type: 'boolean'
//     },
//     sms_subscription_status: {
//       label: 'SMS Subscription Status',
//       description: 'Global status of the SMS subscription. True is subscribed, false is unsubscribed and null|undefined is did-not-subscribe.',
//       type: 'boolean'
//     },
//     whatsapp_subscription_status: {
//       label: 'SMS Subscription Status',
//       description: 'Global status of the SMS subscription. True is subscribed, false is unsubscribed and null|undefined is did-not-subscribe.',
//       type: 'boolean'
//     },
//     // email_subscription_groups: {
//     //   label: 'Email Subscription Groups',
//     //   description: 'Dynamic subscription groups associated specifically with email.',
//     //   type: 'object',
//     //   dynamic: true,
//     //   multiple: true,
//     //   properties: {
//     //     name: {
//     //       label: 'Group Name',
//     //       description: 'Name of the subscription group (e.g., promotions, newsletter)',
//     //       type: 'string',
//     //       required: true
//     //     },
//     //     status: {
//     //       label: 'Subscription Status',
//     //       description: 'Status of the subscription for the group.',
//     //       type: 'string',
//     //       choices: [
//     //         { value: 'subscribed', label: 'SUBSCRIBED' },
//     //         { value: 'unsubscribed', label: 'UNSUBSCRIBED' },
//     //         { value: 'did-not-subscribe', label: 'DID_NOT_SUBSCRIBE' }
//     //       ],
//     //       required: true
//     //     }
//     //   }
//     // }
//   }
// }

//vikram
// export const subscriptions: InputField = {
//   // subscriptions: {
//     label: 'Email Subscriptions',
//     description: 'Subscription Object contains Global Subscription , Channel , Subscription Groups.',
//     type: 'object',
//     multiple: true,
//     additionalProperties: false,
//     required: true,
//     properties: {
//       id: {
//         label: 'ID',
//         description: 'A unique identifier for the collection. For example Email, Phone or Push Tokens.',
//         type: 'string'
//       },
//       type: {
//         label: 'Channel',
//         description: 'A Channel to update subscription EMAIL | SMS | Whatsapp | IosPush | AndroidPush.',
//         type: 'string'
//       },
//       subscriptionStatus: {
//         label: 'subscriptionStatus',
//         description:
//           'The subscription status for the Channel true is subscribed, false is unsubscribed and null|undefined is did-not-subscribe.',
//         type: 'boolean'
//       },
//       groupSubscriptions: {
//         label: 'subscriptionStatus',
//         description:
//           'The subscription status for the Channel true is subscribed, false is unsubscribed and null|undefined is did-not-subscribe.',
//         multiple: true,
//         type: 'object'
//       }
//     },
//     defaultObjectUI: 'object',
//     default: {
//       '@arrayPath': [
//         '',
//         {
//           id: '',
//           type: '',
//           subscriptionStatus: ''
//         }
//       ]
//    // }
//   },
// }

// export const subscriptions: InputField = {
//   // export const subscriptionProperties: Record<string, InputField> = {
//   //   subscriptions: {
//   label: 'Subscriptions',
//   description: 'Subscription Object contains information about users Global Subscription, Channel, Subscription Groups.',
//   type: 'object',
//   defaultObjectUI: 'keyvalue',
//   multiple: true,
//   additionalProperties: false,
//   // required: true,
//   default: {
//     // '@arrayPath': [
//     //{
//     key: '',
//     type: '',
//     status: '',
//     groups: {
//       name: '',
//       status: ''
//     }
//     //    }
//     //]
//   },
//   properties: {
//     key: {
//       label: 'ID',
//       description: 'The unique identifier for the subscription (e.g., phone number, email, push tokens).',
//       type: 'string',
//       required: true
//     },
//     type: {
//       label: 'Channel',
//       description: 'A Channel to update subscription EMAIL | SMS | Whatsapp | IosPush | AndroidPush.',
//       type: 'string',
//       choices: [
//         { value: 'SMS', label: 'SMS' },
//         { value: 'EMAIL', label: 'EMAIL' },
//         { value: 'WHATSAPP', label: 'WHATSAPP' },
//         { value: 'IosPush', label: 'IosPush' },
//         { value: 'AndroidPush', label: 'AndroidPush' }
//       ],
//       required: true
//     },
//     status: {
//       label: 'Subscription Status',
//       description: 'The subscription status for the user.',
//       type: 'string',
//       choices: [
//         { value: 'SUBSCRIBED', label: 'SUBSCRIBED' },
//         { value: 'UNSUBSCRIBED', label: 'UNSUBSCRIBED' },
//         { value: 'DID_NOT_SUBSCRIBE', label: 'DID_NOT_SUBSCRIBE' }
//       ],
//       required: true
//     },
//     groups: {
//       label: 'Subscription Groups',
//       description: 'Subscription groups the user is associated with.',
//       type: 'object',
//       multiple: true,
//       dynamic: true,
//       properties: {
//         name: {
//           label: 'Subscription Group Name',
//           description: 'Name of the subscription group.',
//           type: 'string',
//           required: true
//         },
//         status: {
//           label: 'Group Status',
//           description: 'The subscription status for the specific group. Currently, it is supported for EMAIL channel',
//           type: 'string',
//           choices: [
//             { value: 'SUBSCRIBED', label: 'SUBSCRIBED' },
//             { value: 'UNSUBSCRIBED', label: 'UNSUBSCRIBED' },
//             { value: 'DID_NOT_SUBSCRIBE', label: 'DID_NOT_SUBSCRIBE' }
//           ],
//           required: true
//         }
//       }
//     }
//     //}
//   }
//   // In this representation:
//   //
//   // 1. The top-level structure represents the user's subscriptions.
//   // 2. Each subscription is defined with attributes like 'key', 'type', and 'status' which capture the core details of the subscription.
//   //     - 'key' is a unique identifier for the subscription, which can be an email or a phone number.
//   //     - 'type' specifies the medium of the subscription, with predefined choices like 'SMS', 'EMAIL', and 'WHATSAPP'.
//   //     - 'status' represents the current state of the subscription, which can have values like 'SUBSCRIBED', 'UNSUBSCRIBED' or 'DID_NOT_SUBSCRIBE'.
//   // 3. Inside the subscription structure, there's a 'groups' attribute, modeled as another InputField.
//   //     - This 'groups' attribute contains a list of group objects (type: 'object', multiple: true).
//   //     - Each group object within this list has two main properties: 'name' (which identifies the group) and 'status' (which describes the user's relationship with that group).
//   //     - By adding dynamic: true, it means that the groups property can have dynamic values & can let users or the system add them dynamically..
//   // 4. The configuration supports additional properties. This means that even if new properties are added to the data in the future, the system will not reject them.
//   // 5. A `defaultObjectUI` of 'keyvalue' ensures that users interface with a key-value editor by default, suitable for the object structure.
//   //
//   // This configuration captures the entire structure of the subscriptions object as initially described and provides flexibility for future data variations.
// }
