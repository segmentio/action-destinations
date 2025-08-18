# Actions

Every Destination needs at least one Action.
An Action contains zero or more Fields. Fields server multiple purposes:

1. **Deliberately select only important attributes for processing**: In generaly, only part of a Segment payload is of importance to any particular Destination. Fields allow for only the important attributes from a Segment payload to be referenced in code. The rest is ignored.
2. **User can override mappings in the UI**When an Action is displayed in the Segment user interface, Fields are displayed to the end user. The user can see the field label and description, as well as the default mapping value. Users can override the default mappings if they like.
3. Fields can perform basic validation. For example, if a required field is missing a value, the entire payload will be dropped before getting passed to the perform() or performBatch() functions. An error message will then be displayed to the end user explaining why the event was rejected by Segment.

# Action Fields

Fields are the main building block of an Action. They allow for parts of track(), page(), screen(), identify() or group() events to be extracted into a JSON object called a `resolved payload`. The `resolved payload` contains only the parts of the Segment event which will be processed, transformed and then sent to the Destination platform.

The `resolved payload` is passed into the perform() and performBatch() functions in the second parameter.

A field implements this interface

```ts
interface InputField {
  /** A short, human-friendly label for the field */
  label: string

  /** A human-friendly description of the field */
  description: string

  /** The data type for the field */
  type: 'string' | 'text' | 'number' | 'integer' | 'datetime' | 'boolean' | 'password' | 'object'

  /** Whether null is allowed or not */
  allowNull?: boolean

  /** Whether or not the field accepts multiple values (an array of `type`) */
  multiple?: boolean

  /** An optional default value for the field */
  default?: string | number | boolean | object | Directive

  /** A placeholder display value that suggests what to input */
  placeholder?: string

  /** Whether or not the field supports dynamically fetching options */
  dynamic?: boolean

  /** Whether or not the field is required */
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
}
```

# Perform() and performBatch() functions

These 2 functions are where the transformation logic happens. The `resolved payload` is converted into a JSON payload which is then sent to the Destination platform.

The method signitures are as follows:

`perform`: async (request, {payload, settings})
`performBatch`: async (request, {payload, settings})

The `request` parameter is an object that allows for HTTPS request to be made. This client is a thin wrapper around the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

`payload` corresponds to the `resolved payload` in the perform() fuction, and to an array of `resolved payload` items in the performBatch function.

`settings` corresponds to the global settings object which contains values for setting and authorization fields.

# Field examples

In the examples below, let's assume we're building an Action containing some Fields for a platform called `MegaCorp`

## Example 1 - a User ID field

- Captures a unique identifier from the Segment payload. In this case, the userId value.
- userId is always going to be a string. If any other value is passed, the payload will be rejected before reaching the perform() function
- The label and description details get displayed in the UI of the Field. So these need to be descriptive but not too long.
- the default mapping points to the location of the value to pull from the Segment payload. In this case it points to the userId value, which is always found at the root of the payload.
- The value from this field will be accessed in the perform() and performBatch() functions as `payload.uniqueUserId`.

```typescript
uniqueUserId: {
    label: 'Unique User Identifier',
    type: 'string',
    description: 'A unique identifier for a user known to MegaCorp.',
    default: {'@path': '$.userId'}
}
```

This field will get added to the generated-types.ts file as

```typescript
// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identifier for a user known to MegaCorp.
   */
  uniqueUserId?: string
}
```

# Example 1 - an AnonymousId field

- Captures a unique identifier from the Segment payload. In this case, the anonymousId value.
- anonymousId is always going to be a string. If any other value is passed, the payload will be rejected before reaching the perform() function
- The default mapping points to the location where anonymousId

```typescript
anonUserId: {
    label: 'Anonymous User Identifier',
    type: 'string',
    description: 'A unique identifier for a known user. The User ID is the ID assigned by <YOUR COMPANY> to the user.',
    default: {'@path': '$.userId'}
}
```
