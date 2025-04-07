export type Subscription = ErrorCondition | GroupCondition
export interface GroupCondition<T = Condition> {
  type: 'group'
  operator: GroupConditionOperator
  children: T[]
}

export interface ErrorCondition {
  error: Error
}

export type Condition =
  | GroupCondition
  | EventTypeCondition
  | EventCondition
  | EventPropertyCondition
  | EventTraitCondition
  | EventContextCondition
  | EventUserIdCondition
  | EventNameCondition

export type GroupConditionOperator = 'and' | 'or'

export interface EventTypeCondition {
  type: 'event-type'
  operator: Operator
  value?: string
}

export interface EventCondition {
  type: 'event'
  operator: Operator
  value?: string
}

export interface EventUserIdCondition {
  type: 'userId'
  operator: Operator
  value?: string
}

export interface EventNameCondition {
  type: 'name'
  operator: Operator
  value?: string
}

export interface EventPropertyCondition {
  type: 'event-property'
  name: string
  operator: Operator
  value?: string | boolean | number
}

export interface EventTraitCondition {
  type: 'event-trait'
  name: string
  operator: Operator
  value?: string | boolean | number
}

export interface EventContextCondition {
  type: 'event-context'
  name: string
  operator: Operator
  value?: string | boolean | number
}

export type Operator =
  | '='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'number_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'not_starts_with'
  | 'ends_with'
  | 'not_ends_with'
  | 'exists'
  | 'not_exists'
  | 'is_true'
  | 'is_false'
  | 'number_not_equals'

export type ConditionType =
  | 'group'
  | 'event-type'
  | 'event'
  | 'event-property'
  | 'event-trait'
  | 'event-context'
  | 'name'
  | 'userId'

export type PropertyConditionType = 'event-property' | 'event-context'
export const action: ActionDefinition<Settings, Payload> = {
  title: 'Update User Profile',
  description: "Update or create  a profile's profile attributes in Batch",
  //defaultSubscription: 'type = "identify"',
  fields: {
    multiple: true,
    identifiers: {
      label: 'Identifiers',
      description: "Identifiant(s) de l'utilisateur",
      type: 'object',
      properties: {
        custom_id: {
          label: 'User ID',
          description: 'The unique profile identifier',
          type: 'string',
          required: true,
          default: {
            '@path': '$.userId'
          }
        }
      }
    },
    $attributes: {
      label: 'Attributs',
      description: 'Profile data',
      type: 'object',
      properties: {
        $email_address: {
          label: 'Email',
          description: "The profile's email",
          type: 'string',
          allowNull: true
        },
        $email_marketing: {
          label: 'Email marketing subscribe',
          description:
            "The profile's marketing emails subscription. You can set it to subscribed , unsubscribed , or null to reset the marketing emails subscription.",
          type: 'string',
          allowNull: true
        },
        $phone_number: {
          label: 'Phone Number',
          description: "The user's phone number",
          type: 'string',
          allowNull: true
        },
        $sms_marketing: {
          label: 'SMS marketing subscribe',
          description:
            "The profile's marketing SMS subscription. You can set it to subscribed , unsubscribed , or null to reset the marketing SMS subscription.",
          type: 'string',
          allowNull: true
        },
        $language: {
          label: 'Language',
          description: "The profile's language.",
          type: 'string',
          allowNull: true
        },
        $region: {
          label: 'Region',
          description: "The profile's region",
          type: 'string',
          allowNull: true
        },
        $timezone: {
          label: 'Timezone',
          description:
            'The profile’s time zone name from IANA Time Zone Database  (e.g., “Europe/Paris”). Only valid time zone values will be set.',
          type: 'string',
          allowNull: true
        }
      }
    }
  },
  /* custom_attributes: {
    label: 'Custom Attributes',
    description: 'Hash of custom attributes to send to Batch',
    type: 'object',
    default: {
      '@path': '$.traits'
    }
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    default: 15,
    unsafe_hidden: true
  }*/
  perform: (request, data) => {
    return request('https://api.batch.com/2.2/profiles/update', {
      method: 'post',
      json: data.payload
    })
  }
}
