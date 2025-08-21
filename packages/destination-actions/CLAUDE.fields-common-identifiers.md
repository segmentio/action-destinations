# Action Field common identifier examples

This document covers common ways to define fields for capturing identifier style information.

# Example 1 - Known user identifier field

The field definition below could be used to capture a unique identifier for a known user from a Segment event payload.
Most of the time the unique identifier for a user profile will require mapping to the Segment `$.userId` path.

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

# Example 2 - Unknown / anonymous user identifier field

The field definition below could be used to capture a unique identifier for an anonymous user from a Segment event payload.
Most of the time the unique identifier for an anonymous user profile will require mapping to the Segment `$.anonymousId` path.

```typescript
uniqueAnonUserId: {
    label: 'Anonymous User Identifier',
    type: 'string',
    description: 'A unique identifier for an anonymous user.',
    default: {'@path': '$.anonymousId'}
}
```

This field will get added to the generated-types.ts file as

```typescript
// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identifier for an anonymous user.
   */
  uniqueAnonUserId?: string
}
```

# Example 3 - Email identifier field

When capturing an email address it's important to understand if the Segment event being referenced is a track() or identify(), as the default mappings will be different for both.
The field definition below could be used to capture an email address from a Segment track() event payload.
Remember that with track() events, the recommended location to add user traits is in the `context.traits` location in the payload. However many customers ignore this and simply add traits to the `properties` location in the payload. For this reason we ise the `@if` conditional mapping to look in both locations.
Note that we should use `format:'email'` to denote that only valid emails addresses will be accepted. Segment's platform will drop the entire event if an invalid email address is passed.

```typescript
email: {
    label: 'Email address',
    type: 'string',
    format: 'email',
    description: "The user's email address.",
    default: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    }
}
```

If we know that the Segment payload being referenced will be an identify() call, then we can simply set a default mapping to the `$.traits` location.

```typescript
email: {
    label: 'Email address',
    type: 'string',
    format: 'email',
    description: "The user's email address.",
    default: {
      '@if': { '@path': '$.traits.email' }
    }
}
```

This field will get added to the generated-types.ts file as

```typescript
// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's email address.
   */
  email?: string
}
```

# Example 4 - Phone number field

Similar to email, when capturing an email address it's important to understand if the Segment event being referenced is a track() or identify(), as the default mappings will be different for both.
The field definition below could be used to capture a phone number address from a Segment track() event payload.
Not that for phone we don't set a format, as there is no automatic phone number validation in Segment.

```typescript
phone: {
    label: 'Phone number',
    type: 'string',
    description: "The user's phone number.",
    default: {
      '@if': {
        exists: { '@path': '$.context.traits.phone' },
        then: { '@path': '$.context.traits.phone' },
        else: { '@path': '$.properties.phone' }
      }
    }
}
```

If we know that the Segment payload being referenced will be an identify() call, then we can simply set a default mapping to the `$.traits` location.

```typescript
email: {
    label: 'Phone number',
    type: 'string',
    description: "The user's phone number.",
    default: {
      '@if': { '@path': '$.traits.phone' }
    }
}
```

This field will get added to the generated-types.ts file as

```typescript
// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's phone number.
   */
  phone?: string
}
```

# Example 4 - Device ID field

Some Destinations, specially those which are designed to process events from Mobile Apps, might need to capture the user's Mobile Device ID.
The Device ID for iOS is the IDFV, and for Android it's the Android ID.
If customers are using a Segment mobile SDK then the Device ID is automatically captured and placed in the `$.context.device.id` location in Segment event payloads.

```typescript
mobileDeviceId: {
  label: 'Mobile Device ID',
  description: "The user's mobile device ID.",
  type: 'string',
  default: { '@path': '$.context.device.id'}
},
```

This field will get added to the generated-types.ts file as

```typescript
// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's mobile device ID.
   */
  mobileDeviceId?: string
}
```

# Example 5 - Advertising ID field

Some Destinations, specially those which are designed to process events from Mobile Apps, might need to capture the user's Mobile Advertising ID.
The Advertising ID for iOS is the IDFA, and for Android it's the Ad ID.
If customers are using a Segment Android mobile SDK then the Advertising ID is automatically captured and placed in the `$.context.device.advertisingId` location in Segment event payloads. Advertising Ids are not generally captured aas frequently any more from iOS apps, but when they are captured they are placed at the same location.

```typescript
mobileAdId: {
  label: 'Mobile Advertising ID',
  description: "The user's mobile advertising ID.",
  type: 'string',
  default: { '@path': '$.context.device.advertisingId'}
},
```

This field will get added to the generated-types.ts file as

```typescript
// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's mobile advertising ID.
   */
  mobileAdId?: string
}
```

# Example 6 - Any other identifier field

The first 5 examples above cover fields the most commonly used identifier types.
However, many Destination platforms will require an identifier specific to their platform. For example, Google Ads has an identifier called a `Google Click ID`, or `gclid`. If we wanted to collect the `gclid` we could do something like this:

```typescript
gclid: {
  label: 'Google Click ID',
  description: 'The Google Click ID (gclid) associated with the event.',
  type: 'string'
},,
```

There isn't a standard location in a Segment payload for a `gclid`, however we could follow the same rule we defined for email and phone numbers above:

If working with a track() event:

```typescript
gclid: {
    label: 'Google Click ID',
    type: 'string',
    description: "The Google Click ID or GCLID.",
    default: {
      '@if': {
        exists: { '@path': '$.context.traits.gclid' },
        then: { '@path': '$.context.traits.gclid' },
        else: { '@path': '$.properties.gclid' }
      }
    }
}
```

If working with an identify() event:

```typescript
gclid: {
    label: 'Google Click ID',
    type: 'string',
    description: "The Google Click ID or GCLID.",
    default: {
      '@if': { '@path': '$.traits.gclid' }
    }
}
```

# Example 6 - Combining multiple identifier fields together

It's often necessary to allow for the collection of multiple identifiers. In these scenarios it can be useful to combine multiple identifier fields together into a single `object` field.
Object fields are perfect for this use-case as all of the sub fields (the properties) within the object field get rendered together in the UI, which is a better experience for the customer.
Notice the following:

1. For object fields, the default mappings are all together in a single `default` attribute. Sub fields should not have the default mapping defined in the sub field itself - it should be defined in the default attribute for the main object field.
2. In the example below we specify that the identifiers object is required (`required: true`), but we only specified that the sub field named `email` is required. The other sub fields are optional.This makes it easy to configure if a sub field is required or optional

```typescript
identifiers: {
  label: 'User identifiers',
  description: 'User identifiers',
  type: 'object',
  required: true,
  properties: {
    gclid: {
      label: 'Google Click ID',
      description: 'The Google Click ID (gclid) associated with the event.',
      type: 'string'
    },
    dclid: {
      label: 'Display Click ID',
      description: 'The Display Click ID (dclid) associated with the event.',
      type: 'string'
    },
    mobileDeviceId: {
      label: 'Mobile Device ID',
      description: 'The mobile device ID associated with the event.',
      type: 'string'
    },
    phone: {
      label: 'Phone number',
      description: "The user's mobile phone number.",
      type: 'string'
    },
    email: {
      label: 'Email address',
      description: "The user's email address.",
      type: 'string',
      format: 'email',
      required: true
    }
  },
  default: {
    gclid: {
      '@if': {
        exists: { '@path': '$.context.traits.gclid' },
        then: { '@path': '$.context.traits.gclid' },
        else: { '@path': '$.properties.gclid' }
      }
    },
    dclid: {
      '@if': {
        exists: { '@path': '$.context.traits.dclid' },
        then: { '@path': '$.context.traits.dclid' },
        else: { '@path': '$.properties.dclid' }
      }
    },
    mobileDeviceId: { '@path': '$.context.device.id' },
    phone: {
      '@if': {
        exists: { '@path': '$.context.traits.phone' },
        then: { '@path': '$.context.traits.phone' },
        else: { '@path': '$.properties.phone' }
      }
    }
    email: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    }
  }
}
```
