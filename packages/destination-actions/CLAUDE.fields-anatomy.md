# Action Field example

The field definition below could be used to capture a unique identifier for a known user from a Segment event payload.
Most of the time the unique identifier for a user profile will require mapping to the Segment `$.userId` path.
In this example, the field is named `uniqueUserId`. The field name, label and description values should relate to the Destination's API and not necessary according to Segment's event API.
The label and description details get displayed in the UI of the Field. So these need to be descriptive but not too long.
Thehe default mapping points to the location of the value to pull from the Segment payload. In this case it points to the userId value, which is always found at the root of the payload.

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

# Example 2 - an AnonymousId field

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
