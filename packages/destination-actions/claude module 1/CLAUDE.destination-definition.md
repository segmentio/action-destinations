# What is a Destination?

A Destination is a package of code that accepts Segment track(), identify(), page(), screen() or group() event payloads as inputs, and transforms them and sends them on to a Destination platform.

The Destination platform can be any type of Marketing tool, email or communications tool, database, CRM or nearly any other type of platform that can store user profile data and user analytics data.

# Destination components

All the code for a Destination is stored in a folder under the destination-actions folder.

The file structure of a Destination is as follows:
The root `index.ts` file (with the asterisk) is the entry point to your destination.
In the file structure example below there are 2 Actions defined, action1 and action2.

```
$ tree packages/destination-actions/src/destinations/<destination-name>
packages/destination-actions/src/destinations/<destination-name>
├── generated-types.ts
├── index.ts *
└── action1
    ├── generated-types.ts
    └── index.ts
└── action2
    ├── generated-types.ts
    └── index.ts
```

### Destination Definition

The main definition in the root index.ts file of your Destination will look something like this:

```typescript
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import action1 from './action1'
import action2 from './action2'

const destination: DestinationDefinition<Settings, AudienceSettings> = {
  // a human-friendly short name for the Destination which that gets displayed to users. Should include the name of the Destination platform.
  name: '',

  // a human ffriendly programmatic name for the Destination. Should be lower case, alpha characters and - characters only. The word actions should be included.
  slug: '',

  // a human-friendly description that gets displayed to users.
  description: '',

  // Contains details for authenticating to the Destination platform.
  authentication: {},

  // Contains details for adding common headers into all HTTPS requests.
  extendRequest: () => {}

  // Actions are where the transformation logic lives.
  actions: {
    action1,
    action2
  }
}

// Every Destination Definition needs to be exported so that it can be registered in Segment's platform.
export default destination
```

### Action Definition

```typescript
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  // a human-friendly short name for the Action which that gets displayed to users. Should convey the purpose of the Action. e.g. Send Event, or Upsert User, or Sync Audience
  title: '',

  // a human-friendly longer name for the Action which that gets displayed to users. Should convey the purpose of the Action in more detail. e.g. Send analytics events Event to <destination platform name>
  description: '',

  // An expression indicating which Segment events will trigger the code in this Action as inputs. e.g. 'type = track' or 'type = identify'
  defaultSubscription: '',

  // An object containing InputField Destinitions. InputFields select parts of the input Segment event payload for processing in the perform() and performBatch() functions. The data from the InputFields gets passed into these functions via the payload parameter. We refer to this payload as the resolved payload, as it's only a subset of the original input payload.
  fields: {},

  // A function which gets invoked when a Segment payload matches the subscription or defaultSubscription. The function transforms the data passed in the `payload` and `settings` parameter, and sends the data to the Destination using the `request` parameter.
  perform: async (request, { settings, payload }) => {},

  // The same as the perform() function, except that the payload parameter represends an array of payload objects.
  performBatch: async (request, { settings, payload }) => {}
}

// Every Action must be exported so that it can be imported to the Destination Definition.
export default action
```

## Input Fields

For each action or authentication scheme you can define a collection of inputs as fields. Input fields are what users see in the Segment UI to configure how data gets sent to the destination platform or what data is needed for authentication. These fields (for the action only) are able to accept input from the Segment event.

Input fields have various properties that help define how they are rendered, how their values are parsed and more. Here’s an example:

```typescript
const destination = {
  // ...other properties
  actions: {
    // Action name
    postToChannel: {
      // ...
      fields: {
        // An Input Field named webhookUrl. This is how the field is referenced in the perform() and performBatch() functions.
        // The Input Field must implement the InputField interface.
        webhookUrl: {
          // The name of the Input Field which gets displayed to the user in the Segment UI
          label: 'Webhook URL',
          // The description of the Input Field which gets displayed to the user in the Segment UI
          description: 'Slack webhook URL.',
          // The type of the Input Field. The field will reject the entire payload if the type doesn't match the value passed into the field
          type: 'string',
          // Indicates if the field is required or not. A required field will reject the entire payload if no value is passed into it.
          required: true
        },
        text: {
          label: 'Message',
          description: 'The text message to post to Slack',
          type: 'string',
          required: true
        }
      }
    }
  }
}
```

### Input Field Interface

Here's the full interface that input fields allow:

```typescript
interface InputField {
  /** A short, human-friendly label for the field. This gets displayed in the Segment UI*/
  label: string

  /** A human-friendly description of the field.  This gets displayed in the Segment UI */
  description: string

  /** The data type for the field */
  type: 'string' | 'text' | 'number' | 'integer' | 'datetime' | 'boolean' | 'password' | 'object'

  /*
    This attribute can only be used with Input Fields which are of type object.
    The attribute contols how the Input Field displays in the UI.
    'keyvalue' // Users will see the key value object editor by default and can change to the object editor.
    'object' // Users will see the object editor by default and can change to the key value editor.
    'keyvalue:only' // Users will only use the key value editor.
    'object:only' // Users will only use the object editor.
    'arrayeditor' // if used in conjunction with multi:true will allow user to edit array of object elements.
  */
  defaultObjectUI: 'keyvalue' | 'object' | 'keyvalue:only' | 'object:only' | 'arrayeditor'

  /*
    This attribute can only be used with Input Fields which are of type object.
    It indicates if the customer can pass additional properties into the object field if those properties are not defined as sub fields the Input Field Destination.
    This is useful when the Developer want to restrict the customer from sending additional data into an object above what we want to allow.
  */
  additionalProperties: boolean

  /*
    Inidicates if the Input Field should be hidden in the user interface.
    Setting this to false can be helpful when the Developer wants to select part of the payload without the customer needing to know about it. This is often used when the Developer doesn't want to expose internal Segment processing mechanics to the customer.
  */
  unsafe_hidden: boolean

  /** Whether null is allowed or not */
  allowNull?: boolean

  /** Whether or not the field accepts multiple values (an array of `type`). Setting to true means that an array must be passed to the field */
  multiple?: boolean

  /** An optional default value for the field. This can be a static value like a string or number, or it can be a Mapping Kit Directive. Mapping Kit Directives specify a location in the Segment input payload to select the value from.*/
  default?: string | number | boolean | object | Directive

  /** A placeholder display value that suggests what to input */
  placeholder?: string

  /** Whether or not the field supports dynamically fetching options */
  dynamic?: boolean

  /** Whether or not the field is required. A DependsOnCondition allows for more complex rules above a basic boolean value. */
  required?: boolean | DependsOnConditions

  /**
   * Optional definition for the properties of `type: 'object'` fields
   * (also arrays of objects when using `multiple: true`)
   * Note: this part of the schema is not persisted outside the code
   * but is used for validation and typedefs
   */
  properties?: Record<string, InputField>

  /**
   * Format option to specify more nuanced 'string' types
   * @see {@link https://github.com/ajv-validator/ajv/tree/v6#formats}
   * The Input Field will reject a the entire Segment input event if the value passed to the field doesn't meet the specified format.
   */
  format?:
    | 'date' // full-date according to RFC3339.
    | 'time' // time with optional time-zone.
    | 'date-time' // date-time from the same source (time-zone is mandatory). date, time and date-time validate ranges in full mode and only regexp in fast mode (see options).
    | 'uri' // full URI.
    | 'uri-reference' // URI reference, including full and relative URIs.
    | 'uri-template' // URI template according to RFC6570
    | 'email' // email address.
    | 'hostname' // host name according to RFC1034.
    | 'ipv4' // IP address v4.
    | 'ipv6' // IP address v6.
    | 'regex' // tests whether a string is a valid regular expression by passing it to RegExp constructor.
    | 'uuid' // Universally Unique IDentifier according to RFC4122.
    | 'password' // hint to the UI to hide/obfuscate input strings (applied automatically when using `type: 'password'`
    | 'text' // longer strings (applied automatically when using `type: 'text'`

  /**
   * Minimum value for a field of type 'number'
   * When applied to a string field the minimum length of the string
   * */
  minimum?: number
  /**
   * Maximum value for a field of type 'number'
   * When applied to a string field the maximum length of the string
   */
  maximum?: number

  /**
   * A predefined set of options for the Input Field.
   * Only relevant for `type: 'string'` or `type: 'number'`.
   * If this attribute is set, only values which match one of the choice values will pass validation.
   */
  choices: Array<{
    /** The value of the option */
    value: string | number
    /** A human-friendly label for the option */
    label: string
  }>
}
```

## Default Values

You can set default values for fields. These defaults are not used at run-time, however. These defaults **pre-populate the initial value of the field when users first set up an action**.

Default values can be literal values that match the `type` of the field (e.g. a literal string: ` "``hello``" `) or they can be mapping-kit directives just like the values from Segment’s rich input in the app. Mapping Kit Directives specify a location in the Segment input payload to select the value from. It’s likely that you’ll want to use directives to the default value. Here are some examples:

```typescript
const destination = {
  // ...other properties
  actions: {
    // The Action name
    doSomething: {
      // ...
      fields: {
        // An Input Field named 'name'
        name: {
          label: 'Name',
          description: "The person's name",
          // The field type is string. Any value other than string will result in the entire payload being dropped before the perform() or performBatch() function gets called
          type: 'string',
          // The default mapping is set to a Mapping Kit Directive pointing to the root.traits.name location in the Segment input event payload
          default: { '@path': '$.traits.name' },
          required: true
        },
        email: {
          label: 'Email',
          description: "The person's email address",
          type: 'string',
          // The default mapping is set to a Mapping Kit Directive pointing to the root.properties.email_address location in the Segment input event payload
          default: { '@path': '$.properties.email_address' }
        },
        // an object field example. Defaults should be specified on the top level.
        value: {
          label: 'Conversion Value',
          description: 'The monetary value for a conversion. This is an object with shape: {"currencyCode": USD", "amount": "100"}'
          type: 'object'
          // For object fields, the default mapping should be specified at the object level, and not in the sub field levels
          // There can still be separate default mappings for currencyCode and amount, but they need to be included in the object level default field
          default: {
            currencyCode: { '@path': '$.properties.currency' },
            amount: { '@path': '$.properties.revenue' }
          },
          properties: {
            currencyCode: {
              label: 'Currency Code',
              type: 'string',
              required: true,
              description: 'ISO format'
            },
            amount: {
              label: 'Amount',
              type: 'string',
              required: true,
              description: 'Value of the conversion in decimal string. Can be dynamically set up or have a fixed value.'
            }
          }
          }
        }
      }
    }
  }
}
```

## Required Fields

You may configure a field to either be always required, not required, or conditionally required. Validation for required fields is performed both when a user is configuring a mapping in the UI and when an event payload is delivered to the perform() or performBatch functions.

**An example of each possible value for `required`**

```typescript
const destination = {
  actions: {
    // The name of the Action
    readmeAction: {
      fields: {
        // The name of the Input Field
        operation: {
          label: 'Operation',
          description: 'An operation for the readme action',
          type: 'string',
          // This field is always required and any payloads omitting it will fail
          required: true
        },
        // The name of the Input Field
        creationName: {
          label: 'Creation Name',
          description: "The name of the resource to create, required when operation = 'create'",
          type: 'string',
          required: {
            // This field is required only when the 'operation' field has the value 'create'
            match: 'all',
            conditions: [
              {
                fieldKey: 'operation',
                operator: 'is',
                value: 'create'
              }
            ]
          }
        },
        // The name of the Input Field
        email: {
          label: 'Customer Email',
          description: "The customer's email address",
          type: 'string',
          format: 'email',
          // This field is not required. This is the same as not including the 'required' property at all
          required: false
        },
        // The name of the Input Field
        userIdentifiers: {
          label: 'User Identifiers',
          description: 'User identifiers',
          type: 'object',
          properties: {
            phone: {
              label: 'Phone Number',
              description: 'The customer phone number',
              type: 'string',
              required: {
                // If email is not provided then a phone number is required
                conditions: [{ fieldKey: 'email', operator: 'is', value: undefined }]
              }
            },
            countryCode: {
              label: 'Country Code',
              description: 'The country code for the customer phone number',
              type: 'string',
              required: {
                // If a userIdentifiers.phone is provided then the country code is also required
                conditions: [
                  {
                    fieldKey: 'userIdentifiers.phone', // Dot notation may be used to address sub fields withing an object field.
                    operator: 'is_not',
                    value: undefined
                  }
                ]
              }
            }
          }
        }
      }
    }
  }
}
```

**Examples of valid and invalid payloads for the fields above**

```json
// This payload is valid since the only required field, 'operation', is defined.
{
  "operation": "update",
  "email": "read@me.com"
}
```

```json
// This payload is invalid since 'creationName' is required because 'operation' is 'create'
{
  "operation": "create",
  "email": "read@me.com"
}
// The entire Segment input event will be dropped, with this message
"message": "The root value is missing the required field 'creationName'. The root value must match \"then\" schema."
```

```json
// This payload is valid since the two required fields, 'operation' and 'creationName' are defined.
{
  "operation": "create",
  "creationName": "readme",
  "email": "read@me.com"
}
```

```json
// This payload is invalid since 'phone' is required when 'email' is missing.
{
  "operation": "update",
}
// The entire Segment input event will be dropped, with this message
"message": "The root value is missing the required field 'phone'. The root value must match \"then\" schema."
```

```json
// This payload is invalid since 'countryCode' is required when 'phone' is defined
{
  "operation": "update",
  "userIdentifiers": { "phone": "619-555-5555" }
}
// The entire Segment input event will be dropped, with this message
"message": "The root value is missing the required field 'countryCode'. The root value must match \"then\" schema."
```

```json
// This payload is valid since all conditionally required fields are included
{
  "operation": "update",
  "userIdentifiers": {
    "phone": "619-555-5555",
    "countryCode": "+1"
  }
}
```

## Choices

Input Fields can be set render as a dropdown list in the Segment user interface. The dropdown list will populate with the items from the choices array.

The Input Field will then fail validation if the customer passes any value other than an allowable choice item's value

### Valid example Input Fields with choices attribute set

In the example below the customer can only pass a value to the region field if the value is `US`, `Ireland` or `UK`. The default option is set to `Ireland`.

```typescript
// The name of the field
region: {
  label: 'Region',
  description: "The region to send data to"
  type: 'string',
  // The choices array
  choices: [
    {
      // The label displays in the Segment user interface
      label: 'US',
      // The value is passed to the field if the customer selects US
      value: 'https://us.some-service.com'
    },
    {
      // The label displays in the Segment user interface
      label: 'Ireland',
      // The value is passed to the field if the customer selects Ireland
      value: 'https://ie.some-service.com'
    },
    {
      // The label displays in the Segment user interface
      label: 'UK',
      // The value is passed to the field if the customer selects UK
      value: 'https://uk.some-service.com'
    }
  ],
  // In this example a default mapping is set to Ireland. This will be passed to the field if the customer doesn't select anything.
  default: 'Ireland',
  // allowNull also specifies that a null value can be passed to the field
  allowNull: true
}
```

In this example the customer is restricted to setting the field value to a number.

```typescript
// The name of the field
numberChildren: {
  label: 'Number of Children',
  description: "The number of children"
  type: 'integer',
  // The choices array
  choices: [
    {
      // The label displays in the Segment user interface
      label: 'No children',
      // The value is passed to the field if the customer selects 'No children'
      value: 0
    },
    {
      // The label displays in the Segment user interface
      label: '1 child',
      // The value is passed to the field if the customer selects '1 child'
      value: 1
    },
    {
      // The label displays in the Segment user interface
      label: '2 children',
      // The value is passed to the field if the customer selects '2 children'
      value: 2
    }
  ],
  // In this example a default mapping is set to 0. This will be passed to the field if the customer doesn't select anything.
  default: 0,

  // allowNull also specifies that a null value can not be passed to the field
  allowNull: false
}
```

### Invalid example Input Fields with choices attribute set

//TODO

## The defaultSubscription attribute

In addition to default values for input fields, you can also specify the defaultSubscription for a given action – this is the FQL query that will be automatically populated when a customer configures a new subscription triggering a given action.

A Segment input event that matches the subscription value will trigger the Action.

Triggering the Action means that the Segment input payload gets validated by the Action's InputFields, then the resolved payload gets passed to the Action's perform() or performBatch() functions for processing.

Some examples are:

```typescript
// Only input Segment events where the type of the event is = 'track' will trigger the Action
defaultSubscription: 'type = "track"'
```

```typescript
// Only input Segment events where the type of the event is = 'track' or 'identify' or 'page' or 'group' will trigger the Action
defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group"'
```

```typescript
// Only input Segment events where the type of the event is = 'track' and the event name is not "Order Completed" will trigger the Action
defaultSubscription: 'type = "track" and event != "Order Completed"'
```

```typescript
// Only input Segment events where the type of the event is = 'track' and the event name = "Signed Out" will trigger the Action
defaultSubscription: 'type = "track" and event = "Signed Out"'
```

## Mapping Kit Directives for default mappings

Mapping Kit Directives are used to point to locations within a Segment input event. They allow the Developer to set default mappings for a field, and they also allow the customer to set mappings themselves. Any mapping set by the customer overrides the default mapping set by the Developer.

The use of the $ symbol indicates the root of the Segment input event.

### Valid Mapping Kit Directive examples

```typescript
// A valid mapping pointing to the root location of a Segment input event payload. This will select the entire payload for the field.
default: { '@path': '$'}
```

```typescript
// A valid mapping pointing to the root.userId location of a Segment input event payload
default: { '@path': '$.userId'}
```

```typescript
// A valid mapping pointing to the root.traits location of a Segment input event payload
default: { '@path': '$.traits'}
```

```typescript
// A valid mapping pointing to the root.properties location of a Segment input event payload
default: { '@path': '$.properties'}
```

```typescript
// A valid mapping pointing to the root.type location of a Segment input event payload
default: { '@path': '$.type'}
```

```typescript
// A valid mapping pointing to the root.messageId location of a Segment input event payload
default: { '@path': '$.messageId'}
```

```typescript
// A valid mapping pointing to the root.traits.first_name location of a Segment input event payload
default: { '@path': '$.traits.first_name'}
```

```typescript
// A valid mapping pointing to the root.traits.age location of a Segment input event payload
default: { '@path': '$.traits.age'}
```

```typescript
// A valid mapping pointing to the root.properties.price location of a Segment input event payload
default: { '@path': '$.properties.price'}
```

```typescript
// A valid mapping setting the default value of the field to true
default: true
```

```typescript
// A valid mapping setting the default value of the field to false
default: false
```

```typescript
// A valid mapping setting the default value of the field to 100
default: 100
```

It's also possible, and often useful, to define more complex Mapping Kit Directives which can look at 2 different locations withing a Segment input event payload.

This is done using the '@if' directive.

```typescript
// A valid mapping pointing to the root.properties location of a Segment input event payload. If a value is not present at this location, the value at root.trait will be selected. If neither are present the field value will be undefined.
default: {
  '@if': {
    exists: { '@path': '$.properties' },
    then: { '@path': '$.properties' },
    else: { '@path': '$.traits' }
  }
}
```

```typescript
/*
A valid mapping looks at the root.context.traits.email location of a Segment input event payload. If a value is not present at this location, the value at root.properties.email will be selected. If neither are present the field value will be undefined.
This is useful, as user traits such as email addresses in track() event payloads can often be located at either of these 2 locations.
*/
default: {
  '@if': {
    exists: { '@path': '$.context.traits.email' },
    then: { '@path': '$.context.email' },
    else: { '@path': '$.properties.email' }
  }
}
```

```typescript
/*
A valid mapping looks at the root.context.traits.phone location of a Segment input event payload. If a value is not present at this location, the value at root.properties.phone will be selected. If neither are present the field value will be undefined.
This is useful, as user traits such as phone numbers in track() event payloads can often be located at either of these 2 locations.
*/
default: {
  '@if': {
    exists: { '@path': '$.context.traits.phone' },
    then: { '@path': '$.context.phone' },
    else: { '@path': '$.properties.phone' }
  }
}
```

```typescript
/*
A valid mapping looks at the root.properties.email_subscription_preference location of a Segment input event payload. If a value is not present at this location, the value of the field will be set to the string literal 'NOT SUBSCRIBED'.
This is useful as it allows for default values to be set it there is not value at the first location.
*/
default: {
  '@if': {
    exists: { '@path': '$.properties.email_subscription_preference' },
    then: { '@path': '$.properties.email_subscription_preference' },
    else: 'NOT SUBSCRIBED'
  }
}
```

The following example illustrate an Input Field of type = object. The object has 2 sub fields named phone and email.
Notice how the default Mapping Kit Directive is located at the object field (the parent field) level, and not at the level of the sub fields. The default mapping includes separate mappings for each sub field, phone and email.

```typescript
// The name of the Input Field
userIdentifiers: {
  label: 'User Identifiers',
  description: 'User identifiers',
  // This is an object field
  type: 'object',
  // The object field has 2 defined sub fields. phone and email.
  properties: {
    phone: {
      label: 'Phone Number',
      description: 'The customer phone number',
      type: 'string'
    },
    email: {
      label: 'Country Code',
      description: 'The country code for the customer phone number',
      type: 'string'
    }
  },
  /*
   A valid mapping includes mappings for each of the 2 sub fields, phome and email.
   In this example, each of these mappings use the '@if' Directive.
  */
  default: {
    phone: {
      '@if': {
        exists: { '@path': '$.context.traits.phone' },
        then: { '@path': '$.context.traits.phone' },
        else: { '@path': '$.properties.phone' },
      }
    },
    email: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' },
      }
    }
  }
}
```

### Invalid Mapping Kit Directive examples

```typescript
// An invalid mapping attempting to set the default value of the field to a JSON value
default: { someJSON: 'hello'}
```

```typescript
// An invalid mapping attempting to set the default value of the field to a JSON array value
default: ["some value", "another value"]
```

```typescript
/*
An invalid mapping attempting to nest an '@if' Directive. It's not possible to nest '@if' Directives.
*/
default: {
  '@if': {
    exists: { '@path': '$.properties.email_subscription_preference' },
    then: { '@path': '$.properties.email_subscription_preference' },
    else: {
      '@if': {
        exists: { '@path': '$.traits.email_subscription_preference' },
        then: { '@path': '$.traits.email_subscription_preference' },
        else: 'NOT SUBSCRIBED'
      }
    }
  }
}
```

The following illustrates an invalid use of the default mapping in an object field which has 2 sub fields named phone and email.
The Mapping Kit Directives are incorrectly located at the sub field level instead of at the object (the parent field) level.

```typescript
// The name of the Input Field
userIdentifiers: {
  label: 'User Identifiers',
  description: 'User identifiers',
  // This is an object field
  type: 'object',
  // The object field has 2 defined sub fields. phone and email.
  properties: {
    phone: {
      label: 'Phone Number',
      description: 'The customer phone number',
      type: 'string',
      // An invalid mapping. Sub Fields should not have their mappings defined at the sub field level. They should be defined at the level of the parent field.
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.properties.phone' },
        }
      }
    },
    email: {
      label: 'Country Code',
      description: 'The country code for the customer phone number',
      type: 'string',
      // An invalid mapping. Sub Fields should not have their mappings defined at the sub field level. They should be defined at the level of the parent field.
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' },
        }
      }
    }
  }
}
```

## Valid and invalid Field Definitions

The following examples demonstrate valid and invalid Input Field defintitions
Where the definition is invalid, the a reson is given.

### Valid Input Field Definitions

```typescript
/*
  Valid Field Definintion for a field named message_id
  The defintion includes all 3 of the required attrinutes, label, description and type.
  The default Mapping Kit Directive points to the root.messageId location in a Segment payload, which is always a string
  The field is optional, as there is no required attribute
*/
message_id: {
  label: 'Message ID',
  description: 'Message ID',
  type: 'string',
  default: {
    '@path': '$.messageId'
  }
}
```

```typescript
/*
  Valid Field Definintion for a field named known_user_identifier
  The defintion includes all 3 of the required attrinutes, label, description and type.
  The default Mapping Kit Directive points to the root.userId location in a Segment payload, which is always a string
  The field is not a required field
*/
known_user_identifier: {
  label: 'User Identifier',
  description: 'The unique user identifier for a known user',
  type: 'string',
  required: false,
  default: { '@path': '$.userId'}
}
```

```typescript
/*
  This is a valid Input Field Definition.
  The defintion includes all 3 of the required attrinutes, label, description and type.
  placeholder is an allowable attribute.
  format: 'ipv4' is a valid format value
  The default mapping is valid, and includes an '@if' directive
  allowNull is a valid attribute
*/
ip: {
  label: 'IP Address',
  description: "The contact's IP address",
  placeholder: '180.1.12.125',
  type: 'string',
  format: 'ipv4',
  default: {
    '@if': {
      exists: { '@path': '$.traits.ip' },
      then: { '@path': '$.traits.ip' },
      else: { '@path': '$.properties.ip' }
    }
  },
  allowNull: true
}
```

```typescript
location: {
  label: 'Location',
  description: "The contact's location. Will take priority over the IP address.",
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  additionalProperties: false,
  allowNull: true,
  properties: {
    country: {
      label: 'Country',
      type: 'string',
      allowNull: true
    },
    state: {
      label: 'State',
      type: 'string',
      allowNull: true
    },
    city: {
      label: 'City',
      type: 'string',
      allowNull: true
    },
    post_code: {
      label: 'Postcode',
      type: 'string',
      allowNull: true
    }
  },
  default: {
    country: {
      '@if': {
        exists: { '@path': '$.traits.country' },
        then: { '@path': '$.traits.country' },
        else: { '@path': '$.properties.country' }
      }
    },
    state: {
      '@if': {
        exists: { '@path': '$.traits.state' },
        then: { '@path': '$.traits.state' },
        else: { '@path': '$.properties.state' }
      }
    },
    city: {
      '@if': {
        exists: { '@path': '$.traits.city' },
        then: { '@path': '$.traits.city' },
        else: { '@path': '$.properties.city' }
      }
    },
    post_code: {
      '@if': {
        exists: { '@path': '$.traits.postal_code' },
        then: { '@path': '$.traits.postal_code' },
        else: { '@path': '$.properties.postal_code' }
      }
    }
  }
},
```
