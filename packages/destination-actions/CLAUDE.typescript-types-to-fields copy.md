# Designing Field definitions based off of Typescript types

The best way to design Field definitions for an Action is to first understand what the JSON payload is going to look like for the Destination's API.

For example, if we knew that we wanted to send data to a Destination's API as follows:

```typescript
{
  uid?: string // this is the user identifier
  aid: string // this is an anonymous user identifier
  eventName: string // this is the name of the analytics event
  environmentInfo?: object // this contains information about the enfironment or platform where the the event was generated
  eventProperties?: object // this contains additional information about the specific analytics event
  userDetails?: object // this contains additional information about the user
}
```

A good first attempt would be to design the field definitions as follows:

```typescript
{
  uid: {
    label: 'User Identifier',
    description: 'Unique identifier for the known user',
    type: 'string',
    required: false,
    default: { '@path': '$.userId' }
  },
  aid: {
    label: 'Anonymous User Identifier',
    description: 'Unique identifier for anonymous users',
    type: 'string',
    required: true,
    default: { '@path': '$.anonymousId' }
  },
  eventName: {
    label: 'Event Name',
    description: 'Name of the analytics event',
    type: 'string',
    required: true,
    default: { '@path': '$.event' }
  },
  environmentInfo: {
    label: 'Environment Information',
    description: 'Details about the environment or platform where the event was generated',
    type: 'object',
    required: false,
    default: { '@path': '$.context' }
  },
  eventProperties: {
    label: 'Event Properties',
    description: 'Additional information about the specific analytics event',
    type: 'object',
    required: false,
    default: { '@path': '$.properties' }
  },
  userDetails: {
    label: 'User Details',
    description: 'Additional information about the user',
    type: 'object',
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.context.traits' },
        then: { '@path': '$.context.traits' },
        else: { '@path': '$.traits' }
      }
    }
  }
}
```

However we can then refine these fields. Notice how there is more than 1 identifier. It might make sense to place these 2 identifiers into a single object field.
In the perform() and performBatch() function we can deconstruct the object and then construct the actual JSON to send to the Destination.

```typescript
{
  identifiers: {
    label: 'User Identifiers',
    description: 'Unique identifiers for the user',
    type: 'object',
    required: true,
    properties: {
      uid: {
        label: 'User Identifier',
        description: 'Unique identifier for the known user',
        type: 'string'
      },
      aid: {
        label: 'Anonymous User Identifier',
        description: 'Unique identifier for anonymous users',
        type: 'string',
        required: true
      }
    },
    default: {
      uid: { '@path': '$.userId' },
      aid: {
        '@if': {
          exists: { '@path': '$.anonymousId' },
          then: { '@path': '$.anonymousId' },
          else: { '@path': '$.userId' }
        }
      }
    }
  },
  eventName: {
    label: 'Event Name',
    description: 'Name of the analytics event',
    type: 'string',
    required: true,
    default: { '@path': '$.event' }
  },
  environmentInfo: {
    label: 'Environment Information',
    description: 'Details about the environment or platform where the event was generated',
    type: 'object',
    required: false,
    default: { '@path': '$.context' }
  },
  eventProperties: {
    label: 'Event Properties',
    description: 'Additional information about the specific analytics event',
    type: 'object',
    required: false,
    default: { '@path': '$.properties' }
  },
  userDetails: {
    label: 'User Details',
    description: 'Additional information about the user',
    type: 'object',
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.context.traits' },
        then: { '@path': '$.context.traits' },
        else: { '@path': '$.traits' }
      }
    }
  }
}
```

Now let's assume that the Destination's API was a little more complex, as follows:

```typescript
{
  uid?: string // this is the user identifier
  aid: string // this is an anonymous user identifier
  eventName: string // this is the name of the analytics event
  environmentInfo?: object // this contains information about the enfironment or platform where the the event was generated
  eventProperties?: object // this contains additional information about the specific analytics event
  userDetails?: { // this contains additional information about the user. Only the 4 prefefined user details should be allowed.
    firstName?: string
    lastName?: string
    age?: number
    isSubscribed: boolean
  }
}
```

In this scenario we can see that the userDetails object can contain only 4 different sub fields. The best way to define the fields is as follows:

```typescript
{
  identifiers: {
    label: 'User Identifiers',
    description: 'Unique identifiers for the user',
    type: 'object',
    required: true,
    properties: {
      uid: {
        label: 'User Identifier',
        description: 'Unique identifier for the known user',
        type: 'string'
      },
      aid: {
        label: 'Anonymous User Identifier',
        description: 'Unique identifier for anonymous users',
        type: 'string',
        required: true
      }
    },
    default: {
      uid: { '@path': '$.userId' },
      aid: {
        '@if': {
          exists: { '@path': '$.anonymousId' },
          then: { '@path': '$.anonymousId' },
          else: { '@path': '$.userId' }
        }
      }
    }
  },
  eventName: {
    label: 'Event Name',
    description: 'Name of the analytics event',
    type: 'string',
    required: true,
    default: { '@path': '$.event' }
  },
  environmentInfo: {
    label: 'Environment Information',
    description: 'Details about the environment or platform where the event was generated',
    type: 'object',
    required: false,
    default: { '@path': '$.context' }
  },
  eventProperties: {
    label: 'Event Properties',
    description: 'Additional information about the specific analytics event',
    type: 'object',
    required: false,
    default: { '@path': '$.properties' }
  },
  userDetails: {
    label: 'User Details',
    description: 'Additional information about the user',
    type: 'object',
    required: false,
    additionalProperties: false,
    properties: {
      firstName: {
        label: 'First Name',
        description: "The user's first name",
        type: string
      }
      lastName: {
        label: 'Last Name',
        description: "The user's last name",
        type: string
      }
      age: {
        label: 'User age',
        description: "The user's age",
        type: integer
      }
      isSubscribed: {
        label: 'Subscribed',
        description: "Is the user subscribed? true for yes, false for no.",
        type: boolean
      }
    }
    default: {
      firstName: {'@path': '$.properties.first_name'},
      lastName: {'@path': '$.properties.last_name'},
      age: {'@path': '$.properties.age'},
      isSubscribed: {'@path': '$.properties.is_subscribed'},
    }
  }
}
```

Note that we know that age must be a whole number, so we set the type for age to be `integer`.
Note also, that `additionalProperties: false` indicates that only the 4 predefined sub properties can be passed into the userDetails field. Any other attributes passed in this object will be ignored.

Let's expand this further. Let's assume that we wanted to allow the customer to provide any additional user detail properties in the userDetails, beyond the 4 predefined ones. The typescript type would look something like this

```typescript
{
  uid?: string // this is the user identifier
  aid: string // this is an anonymous user identifier
  eventName: string // this is the name of the analytics event
  environmentInfo?: object // this contains information about the enfironment or platform where the the event was generated
  eventProperties?: object // this contains additional information about the specific analytics event
  userDetails?: { // this contains additional information about the user. Additional user details can be added.
    firstName?: string
    lastName?: string
    age?: number
    isSubscribed: boolean
    [k: string]: unknown
  }
}
```

With this typescript type we can see that `[k: string]: unknown` denotes that additional properties can be added by the customer.
The resulting userDetails field definition for this will need to have `additionalProperties: true`.

```typescript
{
  identifiers: {
    label: 'User Identifiers',
    description: 'Unique identifiers for the user',
    type: 'object',
    required: true,
    properties: {
      uid: {
        label: 'User Identifier',
        description: 'Unique identifier for the known user',
        type: 'string'
      },
      aid: {
        label: 'Anonymous User Identifier',
        description: 'Unique identifier for anonymous users',
        type: 'string',
        required: true
      }
    },
    default: {
      uid: { '@path': '$.userId' },
      aid: {
        '@if': {
          exists: { '@path': '$.anonymousId' },
          then: { '@path': '$.anonymousId' },
          else: { '@path': '$.userId' }
        }
      }
    }
  },
  eventName: {
    label: 'Event Name',
    description: 'Name of the analytics event',
    type: 'string',
    required: true,
    default: { '@path': '$.event' }
  },
  environmentInfo: {
    label: 'Environment Information',
    description: 'Details about the environment or platform where the event was generated',
    type: 'object',
    required: false,
    default: { '@path': '$.context' }
  },
  eventProperties: {
    label: 'Event Properties',
    description: 'Additional information about the specific analytics event',
    type: 'object',
    required: false,
    default: { '@path': '$.properties' }
  },
  userDetails: {
    label: 'User Details',
    description: 'Additional information about the user',
    type: 'object',
    required: false,
    additionalProperties: true,
    properties: {
      firstName: {
        label: 'First Name',
        description: "The user's first name",
        type: string
      }
      lastName: {
        label: 'Last Name',
        description: "The user's last name",
        type: string
      }
      age: {
        label: 'User age',
        description: "The user's age",
        type: integer
      }
      isSubscribed: {
        label: 'Subscribed',
        description: "Is the user subscribed? true for yes, false for no.",
        type: boolean
      }
    }
    default: {
      firstName: {'@path': '$.properties.first_name'},
      lastName: {'@path': '$.properties.last_name'},
      age: {'@path': '$.properties.age'},
      isSubscribed: {'@path': '$.properties.is_subscribed'},
    }
  }
}
```
