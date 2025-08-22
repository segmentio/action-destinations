# What is a Destination?

A Destination is a package of code that accepts Segment track(), identify(), page(), screen() or group() event payloads as inputs, and transforms them and sends them on to a Destination platform.

The Destination platform can be any type of Marketing tool, email or communications tool, database, CRM or nearly any other type of platform that can store user profile data and user analytics data.

# Some definitions

1. Action - TODO
2. Field - TODO
3. DestinationJSON - TODO
4. Segment Input Payload - TODO

# Destination folder and file structure

All the code for a Destination is stored in a folder under the destination-actions folder.

The file structure of a Destination is as follows:
The root `index.ts` file (with the asterisk) is the entry point to your destination. It contains global settings.
The transformation logic and sending of data to the Destination platform happens in `Actions`. A Destination can have multiple Actions, each responsible for sending different payloads to the Destination platform.
In the file structure example below there are 2 Actions defined, action1 and action2.
geneerate-types.ts are files that contain typescript definitions for Settings and Payload objects. These files are generated using a utility after Input Fields have been defined in the index.ts files (both the root index.ts and Action index.ts files).

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

# The Destination Definition

The Destination Definition is an object named destination which implements the `DestinationDefinition` interface.
The Definition Definition is defined in the root index.ts file, and should look like this:

```typescript
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
/*
  There is an import for each Action in the Destination
*/
import action1 from './action1'
import action2 from './action2'

const destination: DestinationDefinition<Settings, AudienceSettings> = {
  /*
    A human-friendly short name for the Destination which that gets displayed to users. Should include the name of the Destination platform.
  */
  name: '',

  /*
    A human ffriendly programmatic name for the Destination. Should be lower case, alpha characters and - characters only. The word actions should be included.
  */
  slug: '',

  /*
    A human-friendly description that gets displayed to users.
  */
  description: '',

  /*
    Contains details for authenticating to the Destination platform.
  */
  authentication: {},

  /*
    Contains details for adding common headers into all HTTPS requests.
  */
  extendRequest: () => {}

  /*
    Actions are where the transformation logic lives.
  */
  actions: {
    action1,
    action2
  }
}

/*
  Every Destination Definition needs to be exported so that it can be registered in Segment's platform.
*/
export default destination
```

# The Action Definition

```typescript
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  /* 
    A human-friendly short name for the Action which that gets displayed to users. Should convey the purpose of the Action. e.g. Send Event, or Upsert User, or Sync Audience
  */
  title: '',

  /* 
    A human-friendly longer name for the Action which that gets displayed to users. Should convey the purpose of the Action in more detail. e.g. Send analytics events Event to <destination platform name>
  */
  description: '',

  /* 
    An expression indicating which Segment events will trigger the code in this Action as inputs. e.g. 'type = track' or 'type = identify'
  */
  defaultSubscription: '',

  /*
    An object containing InputField Destinitions. InputFields select parts of the input Segment event payload for processing in the perform() and performBatch() functions. The data from the InputFields gets passed into these functions via the payload parameter. We refer to this payload as the resolved payload, as it's only a subset of the original input payload.
  */
  fields: {},

  /* 
    A function which gets invoked when a Segment payload matches the subscription or defaultSubscription. The function transforms the data passed in the `payload` and `settings` parameter, and sends the data to the Destination using the `request` parameter.
  */
  perform: async (request, { settings, payload }) => {},

  /* 
    The same as the perform() function, except that the payload parameter represends an array of payload objects.
  */
  performBatch: async (request, { settings, payload }) => {}
}

/*
  Every Action must be exported so that it can be imported to the Destination Definition.
*/
export default action
```

# Input Fields

## What are Input Fields?

All Actions contain a `fields` object, which itself contains one or more Input Fields. We'll call these fields from now on.

Fields are a mechanism for selecting parts of a Segment input payload. The selected field values get validated and then passed into the `perform()` and `performBatch()` functions for furhter validation, before being composed into a `DestinationJSON` payload which gets sent to the Destination platform.

The Developer who designs the Destination can set a default field mapping for each field. These default mappings point to a location in the Segment input event payload.
Each field renders in the Action user interface, allowing the end user (the customer) to override the detault mappings to provide mappings of their own. This is a powerful configuration feature which allows customers to reconfigure how Segment handles their data.

Fields also have various properties that help define how they are rendered, how their values are parsed and more.

## The Input Field Interface

Each field implements the `InputField` interface. Here's the full `InputField` interface:

```typescript
interface InputField {
  /*
   A short, human-friendly label for the field. This gets displayed in the Segment UI
  */
  label: string

  /*
    A human-friendly description of the field.  This gets displayed in the Segment UI 
  */
  description: string

  /* 
    The data type for the field 
  */
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
    It indicates if the customer can pass additional properties into the object field if those properties are not defined as child fields the Input Field Destination.
    This is useful when the Developer want to restrict the customer from sending additional data into an object above what we want to allow.
  */
  additionalProperties: boolean

  /*
    Inidicates if the Input Field should be hidden in the user interface.
    Setting this to false can be helpful when the Developer wants to select part of the payload without the customer needing to know about it. This is often used when the Developer doesn't want to expose internal Segment processing mechanics to the customer.
  */
  unsafe_hidden: boolean

  /* 
    Whether null is allowed or not 
  */
  allowNull?: boolean

  /* 
    Whether or not the field accepts multiple values (an array of `type`). Setting to true means that an array must be passed to the field 
  */
  multiple?: boolean

  /* 
    An optional default value for the field. This can be a static value like a string or number, or it can be a Mapping Kit Directive. Mapping Kit Directives specify a location in the Segment input payload to select the value from.
  */
  default?: string | number | boolean | object | Directive

  /* 
    A placeholder display value that suggests what to input 
  */
  placeholder?: string

  /* 
    Whether or not the field supports dynamically fetching options 
  */
  dynamic?: boolean

  /* 
    Whether or not the field is required. A DependsOnCondition allows for more complex rules above a basic boolean value. 
  */
  required?: boolean | DependsOnConditions

  /*
   Optional definition for the properties of `type: 'object'` fields
   (also arrays of objects when using `multiple: true`)
   Note: this part of the schema is not persisted outside the code
   but is used for validation and typedefs
  */
  properties?: Record<string, InputField>

  /*
   Format option to specify more nuanced 'string' types
   @see {@link https://github.com/ajv-validator/ajv/tree/v6#formats}
   The Input Field will reject a the entire Segment input event if the value passed to the field doesn't meet the specified format.
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

  /*
   Minimum value for a field of type 'number'
   When applied to a string field the minimum length of the string
  */
  minimum?: number
  /*
   Maximum value for a field of type 'number'
   When applied to a string field the maximum length of the string
  */
  maximum?: number

  /*
   A predefined set of options for the Input Field.
   Only relevant for `type: 'string'` or `type: 'number'`.
   If this attribute is set, only values which match one of the choice values will pass validation.
  */
  choices: Array<{
    /*
      The value of the option 
    */
    value: string | number
    /* 
      A human-friendly label for the option 
    */
    label: string
  }>
}
```

## The `default` attribute of an Input Field

Fields have a `default` attribute. These `default` attribute pre-populate the initial value of the field when users first set up an action. The user can then override these default values.

Default values can be literal values that match the `type` of the field (e.g. a literal string: ` "``hello``" `) or they can be mapping-kit directives just like the values from Segment’s rich input in the app. Mapping Kit Directives specify a location in the Segment input payload to select the value from. It’s likely that you’ll want to use directives to the default value.

We often refer to the `default` field values as default mappings.

### Mapping Kit Directives for the `default` attribute

`Mapping Kit Directives` are used to point to locations within a Segment input event. They allow the Developer to set default mappings for a field, and they also allow the customer to set mappings themselves. Any mapping set by the customer overrides the default mapping set by the Developer.

The use of the `$` symbol indicates the root of the Segment input event.

#### Correct Mapping Kit Directive usage examples

```typescript
/*
  A valid mapping pointing to the root location of a Segment input event payload. This will select the entire payload for the field.
*/
default: { '@path': '$'}
```

```typescript
/*
A valid mapping pointing to the root.userId location of a Segment input event payload
*/
default: { '@path': '$.userId'}
```

```typescript
/*
  A valid mapping pointing to the root.traits location of a Segment input event payload
*/
default: { '@path': '$.traits'}
```

```typescript
/*
  A valid mapping pointing to the root.properties location of a Segment input event payload
*/
default: { '@path': '$.properties'}
```

```typescript
/*
  A valid mapping pointing to the root.type location of a Segment input event payload
*/
default: { '@path': '$.type'}
```

```typescript
/*
  A valid mapping pointing to the root.messageId location of a Segment input event payload
*/
default: { '@path': '$.messageId'}
```

```typescript
/*
  A valid mapping pointing to the root.traits.first_name location of a Segment input event payload
*/
default: { '@path': '$.traits.first_name'}
```

```typescript
/*
  A valid mapping pointing to the root.traits.age location of a Segment input event payload
*/
default: { '@path': '$.traits.age'}
```

```typescript
/*
  A valid mapping pointing to the root.properties.price location of a Segment input event payload
*/
default: { '@path': '$.properties.price'}
```

```typescript
/*
  A valid mapping setting the default value of the field to true
*/
default: true
```

```typescript
/*
  A valid mapping setting the default value of the field to false
*/
default: false
```

```typescript
/*
  A valid mapping setting the default value of the field to 100
*/
default: 100
```

It's also possible, and often useful, to define more complex Mapping Kit Directives which can look at 2 different locations withing a Segment input event payload.

This is done using the '@if' directive.

```typescript
/*
  A valid mapping pointing to the root.properties location of a Segment input event payload. If a value is not present at this location, the value at root.trait will be selected. If neither are present the field value will be undefined.
*/
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

The following example illustrate an Input Field of type = object. The object has 2 child fields named phone and email.
Notice how the default Mapping Kit Directive is located at the object field (the parent field) level, and not at the level of the child fields. The default mapping includes separate mappings for each child field, phone and email.

```typescript
/*
  The name of the Input Field
*/
userIdentifiers: {
  label: 'User Identifiers',
  description: 'User identifiers',
  /*
    This is an object field
  */
  type: 'object',
  /*
    The object field has 2 defined child fields. phone and email.
  */
  properties: {
    phone: {
      label: 'Phone Number',
      description: 'The customer phone number',
      type: 'string'
      /*
        The default attribute for phone is not located here
      */
    },
    email: {
      label: 'Country Code',
      description: 'The country code for the customer phone number',
      type: 'string',
      /*
        The default attribute for email is not located here
      */
    }
  },
  /*
    The default attribute mapping is located here, in the root level of the field definision and not at the child field level. The default attribute mapping contains mappings for each of the 2 child fields, phome and email.
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

#### Incorrect Mapping Kit Directive usage examples

```typescript
/*
  An invalid mapping attempting to set the default value of the field to a JSON value
*/
default: { someJSON: 'hello'}
```

```typescript
/*
  An invalid mapping attempting to set the default value of the field to a JSON array value
*/
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

The following example illustrates an invalid use of the default attribute mapping in an object field which has 2 child fields named phone and email.
The Mapping Kit Directives are incorrectly located at the child field level instead of at the tool level of the object field.

```typescript
/*
  The name of the Input Field
*/
userIdentifiers: {
  label: 'User Identifiers',
  description: 'User identifiers',
  /*
    This is an object field
  */
  type: 'object',
  /*
    The object field has 2 defined child fields. phone and email.
  */
  properties: {
    phone: {
      label: 'Phone Number',
      description: 'The customer phone number',
      type: 'string',
      /*
        An invalid mapping. Child Fields should not have their mappings defined at the child field level. They should be defined at the level of the parent field.
      */
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
      /*
        An invalid mapping. Child Fields should not have their mappings defined at the child field level. They should be defined at the level of the parent field.
      */
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

Here is another example of an invalid use of the default attribute.

```typescript
page_context: {
  label: 'Page Context',
  description: 'Context for web page-related events',
  /*
    This is an ojbect field
  */
  type: 'object',
  required: false,
  properties: {
    path: {
      label: 'Page Path',
      description: 'Path of the current page',
      type: 'string',
      required: false,
      /*
        The default attribute for the `path` child field should not be located in the `path` child field. It should be located in the parent `page_context` object field
      */
      default: { '@path': '$.context.page.path' }
    },
    referrer: {
      label: 'Page Referrer',
      description: 'Previous page\'s full URL',
      type: 'string',
      required: false,
      /*
        The default attribute for the `referrer` child field should not be located in the `referrer` child field. It should be located in the parent `page_context` object field
      */
      default: { '@path': '$.context.page.referrer' }
    }
  },
  /*
    The default attribute should be located here, at the root level of the field definition. It should include mappings for both child fields, path and referrer
  */
  }
```

### Correct `default` attribute usage example

The following example of an Action contains multiple fields that each make correct use of the `detault` attribute.
Note that the `$` sybmbol simply means the root level.

```typescript
const destination = {
  /*
    ...other properties
  */
  actions: {
    /*
      The Action name
    */
    doSomething: {
      /*
        ...
      */
      fields: {
        /*
          An Input Field named 'name'
        */
        name: {
          label: 'Name',
          description: "The person's name",
          /*
            The field type is string. Any value other than string will result in the entire payload being dropped before the perform() or performBatch() function gets called
          */
          type: 'string',
          /*
            The default mapping is set to a Mapping Kit Directive pointing to the root.traits.name location in the Segment input event payload
          */
          default: { '@path': '$.context.traits.name' },
          required: true
        },
        email: {
          label: 'Email',
          description: "The person's email address",
          type: 'string',
          /*
            The default mapping is set to a Mapping Kit Directive pointing to the root.properties.email_address location in the Segment input event payload
          */
          default: { '@path': '$.context.traits.email_address' }
        },
        /*
          An object field example. Defaults should be specified on the top level.
        */
        value: {
          label: 'Conversion Value',
          description:
            'The monetary value for a conversion. This is an object with shape: {"currencyCode": "USD", "amount": "100"}',
          type: 'object',
          properties: {
            currencyCode: {
              label: 'Currency Code',
              type: 'string',
              required: true,
              description: 'ISO format'
              /*
                Note that the default attribute for currencyCode is not located within the currencyCode child field. It should be located within the parent object field, value. 
              */
            },
            amount: {
              label: 'Amount',
              type: 'string',
              required: true,
              description: 'Value of the conversion in decimal string. Can be dynamically set up or have a fixed value.'
              /*
                Note that the default attribute for amount is not located within the amount child field. It should be located within the parent object field, value. 
              */
            }
          },
          /*
            For object fields, the default mapping should be specified at the parent object level and not at the child field level.
            There can still be separate default mappings for currencyCode and amount, but they need to be included in the parent object's default attribute.
          */
          default: {
            currencyCode: { '@path': '$.properties.currency' },
            amount: { '@path': '$.properties.revenue' }
          }
        }
      }
    }
  }
}
```

### Incorrect `default` attribute usage example

The following examples illustrate incorrect usage of the `detault` attribute in fields.

```typescript
const destination = {
  /*
    ...other properties
  */
  actions: {
    /*
      The Action name
    */
    doSomething: {
      /*
        ...
      */
      fields: {
        /*
          The name of this field is value. 
        */
        value: {
          label: 'Conversion Value',
          description:
            'The monetary value for a conversion. This is an object with shape: {"currencyCode": "USD", "amount": "100"}',
          /*
            value is an object field. 
          */
          type: 'object',
          properties: {
            currencyCode: {
              label: 'Currency Code',
              type: 'string',
              required: true,
              description: 'ISO format',
              /*
                The default attribute for the child field 'currencyCode' should not be defined in the child field. It should be defined at the parent field level.  
              */
              default: { '@path': '$.properties.currency' }
            },
            amount: {
              label: 'Amount',
              type: 'string',
              required: true,
              description:
                'Value of the conversion in decimal string. Can be dynamically set up or have a fixed value.',
              /*
                The default attribute for a child field 'amount' should not be defined in the child field. It should be defined at the parent field level.  
              */
              default: { '@path': '$.properties.revenue' }
            }
          }
          /*
            For object fields the default mapping should be specified here, at the parent object level and not at the child field level.
          */
        }
      }
    }
  }
}
```

## the `required` attribute of an Input Field

You may configure a field to either be always required, not required, or conditionally required. Validation for required fields is performed both when a user is configuring a mapping in the UI and when an event payload is delivered to the perform() or performBatch functions.

### Correct `required` attribute usage example

This Action defines fields which make use of the `required` attribute.
There are examples of required: true, required: false and conditional required fields.
Following this we'll look at payloads which could pass or fail validation for this Action.

```typescript
const destination = {
  actions: {
    /*
      The name of the Action
    */
    readmeAction: {
      fields: {
        /*
          The name of the Input Field
        */
        operation: {
          label: 'Operation',
          description: 'An operation for the readme action',
          type: 'string',
          /*
            This field is always required and any payloads omitting it will fail
          */
          required: true
        },
        /*
          The name of the Input Field
        */
        creationName: {
          label: 'Creation Name',
          description: "The name of the resource to create, required when operation = 'create'",
          type: 'string',
          required: {
            /*
              This field is required only when the 'operation' field has the value 'create'
            */
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
        /*
          The name of the Input Field
        */
        email: {
          label: 'Customer Email',
          description: "The customer's email address",
          type: 'string',
          format: 'email',
          /*
            This field is not required. This is the same as not including the 'required' property at all
          */
          required: false
        },
        /*
          The name of the Input Field
        */
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
                /*
                  If email is not provided then a phone number is required
                */
                conditions: [{ fieldKey: 'email', operator: 'is', value: undefined }]
              }
            },
            countryCode: {
              label: 'Country Code',
              description: 'The country code for the customer phone number',
              type: 'string',
              required: {
                /*
                  If a userIdentifiers.phone is provided then the country code is also required
                */
                conditions: [
                  {
                    /* 
                      Dot notation may be used to address child fields withing an object field.
                    */
                    fieldKey: 'userIdentifiers.phone',
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

#### Example payloads which would pass this field validation

The below example payloads would pass validation for the Action defined above

```json
/*
  This payload is valid since the only required field, 'operation', is defined.
*/
{
  "operation": "update",
  "email": "read@me.com"
}
```

```json
/* 
  This payload is valid since the two required fields, 'operation' and 'creationName' are defined.
  creationName is required because the value of operation is "create", so it fulfills a require condition. 
*/
{
  "operation": "create",
  "creationName": "readme",
  "email": "read@me.com"
}
```

```json
/* 
  This payload is valid since all conditionally required fields are included. 
  email is undefined so the child field phone becomes required. The countryCode field then also becomes required as phone is populated.
*/
{
  "operation": "update",
  "userIdentifiers": {
    "phone": "619-555-5555",
    "countryCode": "+1"
  }
}
```

#### Example payloads which would fail this field validation

The below example payloads would fail validation for the Action defined above

```json
/*
  This payload is invalid since 'creationName' is required because 'operation' is 'create'
*/
{
  "operation": "create",
  "email": "read@me.com"
}
/*
  The entire Segment input event will be dropped, with this message
*/
"message": "The root value is missing the required field 'creationName'. The root value must match \"then\" schema."
```

```json
/*
  This payload is invalid since 'phone' is required when 'email' is missing.
*/
{
  "operation": "update",
}
/*
  The entire Segment input event will be dropped, with this message
*/
"message": "The root value is missing the required field 'phone'. The root value must match \"then\" schema."
```

```json
/*
  This payload is invalid since 'countryCode' is required when 'phone' is defined
*/
{
  "operation": "update",
  "userIdentifiers": { "phone": "619-555-5555" }
}
/*
  The entire Segment input event will be dropped, with this message
*/
"message": "The root value is missing the required field 'countryCode'. The root value must match \"then\" schema."
```

## The `choices` attribute of an Input Field

Input Fields can be set render as a dropdown list in the Segment user interface. The dropdown list will populate with the items from the `choices` array.

The Input Field will then fail validation if the customer passes any value other than an allowable choice item's value

The type for the `choices` attribute is defined as:

```typescript
choices?:
  | Array<string>
  | Array<{
      /*
        The value of the option
      */
      value: string | number
      /*
        A human-friendly label for the option
      */
      label: string
    }>
```

### Correct `choices` attribute usage examples

In the example below the customer can only pass a value to the region field if the value is `US`, `Ireland` or `UK`. The default option is set to `Ireland`.

```typescript
/*
  The name of the field
*/
region: {
  label: 'Region',
  description: "The region to send data to"
  type: 'string',
  /*
    The choices array
  */
  choices: [
    {
      /*
        The label displays in the Segment user interface
      */
      label: 'US',
      /*
        The value is passed to the field if the customer selects US
      */
      value: 'https://us.some-service.com'
    },
    {
      /*
        The label displays in the Segment user interface
      */
      label: 'Ireland',
      /*
        The value is passed to the field if the customer selects Ireland
      */
      value: 'https://ie.some-service.com'
    },
    {
      /*
        The label displays in the Segment user interface
      */
      label: 'UK',
      /*
        The value is passed to the field if the customer selects UK
      */
      value: 'https://uk.some-service.com'
    }
  ],
  /*
    In this example a default mapping is set to Ireland. This will be passed to the field if the customer doesn't select anything.
  */
  default: 'Ireland',
  /*
    allowNull also specifies that a null value can be passed to the field
  */
  allowNull: true
}
```

In this example the customer is restricted to setting the field value to a number.

```typescript
/*
  The name of the field
*/
numberChildren: {
  label: 'Number of Children',
  description: "The number of children"
  type: 'integer',
  /*
    The choices array
  */
  choices: [
    {
      /*
        The label displays in the Segment user interface
      */
      label: 'No children',
      /*
        The value is passed to the field if the customer selects 'No children'
      */
      value: 0
    },
    {
      /*
        The label displays in the Segment user interface
      */
      label: '1 child',
      /*
        The value is passed to the field if the customer selects '1 child'
      */
      value: 1
    },
    {
      /*
        The label displays in the Segment user interface
      */
      label: '2 children',
      /*
        The value is passed to the field if the customer selects '2 children'
      *
      value: 2
    }
  ],
  /*
    In this example a default mapping is set to 0. This will be passed to the field if the customer doesn't select anything.
  */
  default: 0,

  /*
    allowNull also specifies that a null value can not be passed to the field
  */
  allowNull: false
}
```

#### Incorrect `choices` attribute usage example

The following example is incorrect because it attempts to set `choices` array value as boolean.
The correct way to handle a boolean scenario is to just remove the `choices` array. Segment will reject any non boolean value sent to a boolean Input Field anyway.

```typescript
/*
  The name of the field
*/
hasChildren: {
  label: 'Has Children',
  description: "Does the user have children?"
  type: 'boolean',
  /*
    The choices array
  */
  choices: [
    {
      /*
        The label displays in the Segment user interface
      */
      label: 'NO',
      /*
        boolean false is an invalid value for a choice
      */
      value: false
    },
    {
      /*
        The label displays in the Segment user interface
      */
      label: 'YES',
      /*
        boolean true is an invalid value for a choice
      */
      value: true
    }
  ],
  /*
    In this example a default mapping is set to false. This will be passed to the field if the customer doesn't select anything.
  */
  default: false
}
```

## The `defaultSubscription` attribute of an Input Field

In addition to default values for input fields, you can also specify the `defaultSubscription` for a given action – this is the `FQL` query that will be automatically populated when a customer configures a new `subscription` triggering a given action.

A Segment input event that matches the `subscription` value will trigger the Action.

Triggering the Action means that the Segment input payload gets validated by the Action's InputFields, then the resolved payload gets passed to the Action's `perform()` or `performBatch()` functions for processing.

Some examples are:

```typescript
/* 
  Only input Segment events where the type of the event is = 'track' will trigger the Action
*/
defaultSubscription: 'type = "track"'
```

```typescript
/* 
  Only input Segment events where the type of the event is = 'track' or 'identify' or 'page' or 'group' will trigger the Action
*/
defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group"'
```

```typescript
/* 
  Only input Segment events where the type of the event is = 'track' and the event name is not "Order Completed" will trigger the Action
*/
defaultSubscription: 'type = "track" and event != "Order Completed"'
```

```typescript
/* 
  Only input Segment events where the type of the event is = 'track' and the event name = "Signed Out" will trigger the Action
*/
defaultSubscription: 'type = "track" and event = "Signed Out"'
```

## The `multiple` Input Field attribute

The multiple Input Field attribute turns a field into an array.

1. string turns into an array of strings
2. number turns into an array of numbers
3. boolean turns into an array of booleans
4. object turns into an array of objects

### Correct `multiple` attribute usage example

#### Example 1 - a valid string array field

```typescript
/*
  This is an Input Field that accepts an array of strings
*/
email_addresses: {
  label: 'Email Addresses',
  description: "The customer's email address",
  type: 'string',
  format: 'email',
  multiple: true,
  required: false,
  default: {'@path': '$.traits.emails'}
}
```

```json
/* 
  This is an example value which could be successfully passed to the email_addresses Input Field above
*/
{
  "traits": {
    "emails": ["email1@gmail.com", "email2@gmail.com", "email3@gmail.com"]
  }
}
```

#### Example 2 - a valid number array field

```typescript
/*
  This is an Input Field that accepts an array of numbers
*/
product_prices: {
  label: 'Prices',
  description: "A list of product prices",
  type: 'number',
  multiple: true,
  required: false,
  default: {'@path': '$.properties.prices'}
}
```

```json
/* 
  This is an example value which could be successfully passed to the product_prices Input Field above
*/
{
  "properties": {
    "prices": [100, 199.99, 2]
  }
}
```

#### Example 3 - a valid object field with a string array child field

```typescript
/*
  This is an object Input Field that containing a child field that accepts an array of strings.
  It's OK to have objects Input Fields that have child fields which are arrays of strings, arrays of booleans or arrays of numbers
*/
identifiers: {
  label: 'User Identifiers',
  description: "Unique identifers for the user",
  type: 'object',
  multiple: true,
  required: false,
  properties: {
    userId: {
      label: 'User Id',
      description: "The user's main identifier",
      type: "string"
    },
    email_addresses: {
      label: 'Email Addresses',
      description: "Email addresses associated with the user",
      type: "string",
      multiple: true
    }
  },
  default: {
    userId: {'@path': '$.userId'},
    email_addresses: {
      '@if': {
        exists: { '@path': '$.traits.email_addresses' },
        then: { '@path': '$.traits.email_addresses' },
        else: { '@path': '$.context.traits.email_addresses' }
      }
    }
  }
}
```

```json
/* 
  This is an example value which could be successfully passed to the identifiers Input Field above
*/
{
  "userid": "uid_12345",
  "traits": {
    "email_addresses": ["email1@gmail.com", "email2@gmail.com", "email3@gmail.com"]
  }
}
```

#### Example 4 - a valid object array field

```typescript
/*
  This is an object Input Field which accepts an array of objects.
*/
products: {
  label: 'Products',
  description: "A list of product items",
  type: 'object',
  multiple: true,
  required: false,
  /*
    additionalProperties set to true allows the customer to add additional values into the items
  */
  additionalProperties: true,
  properties: {
    id: {
      label: 'Product ID',
      description: "Unique identifier for the product",
      type: "string"
    },
    name: {
      label: 'Product Name',
      description: "The product's name",
      type: "string"
    },
    price: {
      label: 'Price',
      description: "The product's price",
      type: "number"
    },
    category: {
      label: 'Cagegory',
      description: "The product's category",
      type: "string"
    }
  },
  default: {
    /*
      The default mapping for an array of objects should use the @arrayPath directive.
    */
    '@arrayPath': [
      /*
        '$.products' refers to the location of the array in the Segment input event payload. In this case it's called products, and is located at root.properties.products.
      */
      '$.properties.products',
      /*
        Individual mappings are then provided for every child field in the object.
      */
      {
        id: { '@path': '$.id' },
        price: { '@path': '$.price' },
        name: { '@path': '$.name' },
        quantity: { '@path': '$.quantity' }
      }
    ]
  }
}
```

```json
/*
  This is an example value which could be successfully passed to the products Input Field above.
  The child fields are all optional, so not all the values need to be popuated in the product array items
*/
{
  "products": [
    { "id": "product_id_1", "price": 100, "name": "Soft toy", "quantity": 1 },
    { "price": 21, "name": "Chess set", "quantity": 3 }
    { "id": "product_id_3", "price": 99.99, "name": "expensive chocolate bar" }
    /*
      The category and variant attributes in the following item will be accepted, as the Input Field has additionalProperties set to true.
    */
    { "id": "product_id_4", "price": 2, "name": "expensive chocolate bar", "category": "Candy", "variant": "sugary sweets" }
  ]
}
```

### Incorrect `multiple` attribute usage example

Object fields should not have object array child fields.

```typescript
/*
  Object fields cannot have child object fields, which also means that they cannot have child object array fields.
  The correct way to model this use-case would be to have 3 fields.
  1. products (object array),
  2. order_id
  3. total
  It would also be acceptable to merge the order_id and total fields into a single object field.
*/
order_details: {
  label: 'Order Details',
  description: "Details of what was purchased in the order",
  type: 'object',
  required: false,
  additionalProperties: false,
  properties: {
    products: {
      label: "Product details",
      description: "List of product details",
      type: "order"
      properties: {
        id: {
          label: 'Product ID',
          description: "Unique identifier for the product",
          type: "string"
        },
        name: {
          label: 'Product Name',
          description: "The product's name",
          type: "string"
        },
        price: {
          label: 'Price',
          description: "The product's price",
          type: "number"
        },
        categories: {
          label: 'Cagegory',
          description: "The product's category",
          type: "string"
        }
      }
    },
    order_id: {
      label: "Order ID",
      description: "A unique ID for the order",
      type: "string"
    },
    total: {
      label: "Total",
      description: "Total amount paid for the order",
      type: "number"
    }
  },
  /*
    The default attribute has been removed for brevity
  */
}
```

## Input Field Definition examples

### Example 1 - a valid string field

```typescript
/*
  Valid Field Definintion for a field named message_id
  The definition includes all 3 of the required attrinutes, label, description and type.
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

### Example 2 - a valid string field

```typescript
/*
  Valid Field Definintion for a field named known_user_identifier
  The definition includes all 3 of the required attrinutes, label, description and type.
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

### Example 3 - a valid string field

```typescript
/*
  This is a valid Input Field Definition.
  The definition includes all 3 of the required attrinutes, label, description and type.
  placeholder is an allowable attribute.
  format: 'ipv4' is a valid format value
  The default mapping is valid
  allowNull is a valid attribute
*/
ip: {
  label: 'IP Address',
  description: "The contact's IP address",
  placeholder: '180.1.12.125',
  type: 'string',
  format: 'ipv4',
  default: { '@path': '$.context.ip' },
  allowNull: true
}
```

### Example 4 - a valid object field

```typescript
/*
  This is a valid Input Field Definition.
  The field is optional as it doesn't have the required attribute set.
*/
location: {
  /*
    The definition includes all 3 of the required attrinutes, label, description and type. the type of the field is object.
  */
  label: 'Location',
  description: "The contact's location. Will take priority over the IP address.",
  type: 'object',
  /*
    defaultObjectUI is a valid attribute, and it's set to 'keyvalue:only' which is a valid value.
  */
  defaultObjectUI: 'keyvalue:only',
  /*
    The additionalProperties is set to true, which allows the customer to send additional attributes in the object (apart from country, state, city and postal_code). This is valid.
  */
  additionalProperties: false,
  /*
    The field has defined 4 properties or child fields, country, state, city and postal_code.
  */
  properties: {
    /*
      Each child field has all 3 of the required attributes label, description and type.
      While not technically a problem, it's good that each child field relates to the parent object field. country, city, state and postal_code are all relevant to a user location.
      If there was a child field named age, it would be bad field design, but not a technical issue.
    */
    country: {
      label: 'Country',
      type: 'string',
      description: "the user's country"
    },
    state: {
      label: 'State',
      type: 'string',
      description: "The user's state"
    },
    city: {
      label: 'City',
      type: 'string',
      description: "The user's city"
    },
    post_code: {
      label: 'Postcode',
      type: 'string',
      description: "The user's post code"
    }
  },
  /*
    The default attribute valid and is defined in the correct location of the field, which is at the object field level (the parent field level), and not the child field level.
    The default attribute also uses the '@if' directive correctly.
    The default attribute sets default for all the child fields.
  */
  default: {
    country: {
      '@if': {
        exists: { '@path': '$.context.traits.country' },
        then: { '@path': '$.context.traits.country' },
        else: { '@path': '$.properties.country' }
      }
    },
    state: {
      '@if': {
        exists: { '@path': '$.context.traits.state' },
        then: { '@path': '$.context.traits.state' },
        else: { '@path': '$.properties.state' }
      }
    },
    city: {
      '@if': {
        exists: { '@path': '$.context.traits.city' },
        then: { '@path': '$.context.traits.city' },
        else: { '@path': '$.properties.city' }
      }
    },
    post_code: {
      '@if': {
        exists: { '@path': '$.context.traits.postal_code' },
        then: { '@path': '$.context.traits.postal_code' },
        else: { '@path': '$.properties.postal_code' }
      }
    }
  }
}
```

### Example 3 - Object fields cannot contain child object fields

Object fields should not contain child object fields.

```typescript
/*
  The field name is user_traits
*/
user_traits: {
  label: 'User Traits',
  description: 'Additional user profile information',
  /*
    The user_traits field is an object field
  */
  type: 'object',
  required: false,
  additionalProperties: true,
  /*
    The user_traits field contains child fields
  */
  properties: {
    /*
      first_name is a valid child field as it is of type string
    */
    first_name: {
      label: 'First Name',
      description: 'User\'s first name',
      type: 'string',
      required: false
    },
    /*
      last_name is a valid child field as it is of type string
    */
    last_name: {
      label: 'Last Name',
      description: 'User\'s last name',
      type: 'string',
      required: false
    },
    /*
      age is a valid child field as it is of type number
    */
    age: {
      label: 'Age',
      description: 'User\'s age',
      type: 'integer',
      minimum: 0,
      required: false
    },
    /*
      company is a invalid child field as it is of type object
    */
    company: {
      label: 'Company',
      description: 'User\'s company information',
      type: 'object',
      required: false,
      properties: {
        name: {
          label: 'Company Name',
          description: 'Name of the user\'s company',
          type: 'string',
          required: false
        },
        title: {
          label: 'Job Title',
          description: 'User\'s job title',
          type: 'string',
          required: false
        }
      }
    }
  },
  /*
    The default attribute has been deliberately omitted from this example for brevity.
  */
}
```

The correct way to design the above field would be to split it into 2 fields

```typescript
user_traits: {
  label: 'User Traits',
  description: 'Additional user profile information',
  type: 'object',
  required: false,
  additionalProperties: true,
  properties: {
    first_name: {
      label: 'First Name',
      description: 'User\'s first name',
      type: 'string',
      required: false
    },
    last_name: {
      label: 'Last Name',
      description: 'User\'s last name',
      type: 'string',
      required: false
    },
    age: {
      label: 'Age',
      description: 'User\'s age',
      type: 'integer',
      minimum: 0,
      required: false
    }
  },
  /*
    The default attribute has been deliberately omitted from this example for brevity.
  */
},
/*
  company becomes its own object field
*/
company: {
  label: 'Company',
  description: 'User\'s company information',
  type: 'object',
  required: false,
  properties: {
    name: {
      label: 'Company Name',
      description: 'Name of the user\'s company',
      type: 'string',
      required: false
    },
    title: {
      label: 'Job Title',
      description: 'User\'s job title',
      type: 'string',
      required: false
    }
  },
  /*
    The default attribute has been deliberately omitted from this example for brevity.
  */
}
```

## Input Field design considerations

1. Don't define too many fields as it will result in a cluttered user interface. Instead, try to group individual simple type fields (string, number, integer, boolean) together into object fields.
2. When grouping fields into object fields, make sure there is a commonality between the fields that get added to each object field. For example, don't group user identifiers, user traits, product details into the same object field.
3. Design fields with the Segment Identify and Ecommerce specs in mind. For example, if the Destination's API requires a phone number, make sure to add a default mapping to phone trait (which is documented in the Segment identify Spec). The phone trait should be located at `$.context.traits.phone` or `$.properties.phone` in track() event payloads, or `$.traits.phone` in identify() event payloads.
4. Always specify if a field is required or optional, or specify a required condition.
5. Always specify if a child field is required of optional, or specify a required condition.
6. For numeric fields, figure out if the field should have a type of `integer` or `number`, depending on what the field is called. For example a field named `age` should be of type `integer`, while a field named `price` should be of type `number`.
7. When collecting user profile traits from an Action that has a `defaultMapping` to a track() event, always use the `@if` conditional statement to set two default paths, one to `$.context.traits.<field_name>` and the other to `$.properties.<field_name>`. If the Action is designed to handle identify() payloads then just map the user trait to `$.traits.field_name`.
