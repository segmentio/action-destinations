# Destination Kit

<!-- ./node_modules/.bin/markdown-toc -i ./lib/destination-kit/README.md -->

<!-- toc -->

- [Overview](#overview)
- [Destination Definition](#destination-definition)
- [Action Definition](#action-definition)
  - [perform](#perform)

<!-- tocstop -->

## Overview

Destination Kit is an experimental interface for building destinations that are composed of
discrete actions that users want to perform when using an destination (e.g. "create or update
company", "track user", "trigger campaign").

```js
// Create or update a customer record in Customer.io
export default {
  fields: {
    id: { ... },
    custom_attributes: { ... },
    created_at: { ... },
    // ... more
  },
  perform: (request, { payload, settings }) => {
    const { id, custom_attributes: customAttrs, created_at, ...body } = payload

    return request(`https://example.com/customers/${id}`, {
      method: 'put',
      json: { ...customAttrs, ...body }
    })
  }
}
```

The goals of Destination Kit are to minimize the amount of work it takes to build a destination (to
make them easy to build) and to standardize the most common patterns of destinations (to make them
easy to build correctly). Through this standard definition and dependency injection, we can use the same destination code to generate multiple things:

- JSON Schema validation

- Lambda functions to handle transformation and delivery of events.

- Documentation that outlines what a destination can do, what information it needs to perform each
  action, and how the destination behaves.

- Centrifuge GX job configuration to move logic and work out of Lambda piecemeal.

## Destination Definition

A Destination definition is the entrypoint for a destination. It holds the configuration for how a destination should be presented to customers, and how it sends incoming events to partner APIs via actions.

The definition of a `Destination` will look something like this, and should be the default export from your `destinations/<destination>/index.ts`:

```ts
const destination: DestinationDefinition = {
  // The human-readable name of the destination
  name: 'Your Destination Name',

  // The authentication scheme and fields
  authentication: {},

  // Extends the instance of the `fetch` client with request options
  extendRequest: ({ settings }) => {},

  // See "Actions" section below
  actions: {}
}
```

#### extendRequest(function(Data))

extendRequest() adds a callback function that can set default
`fetch` request options for all requests made by actions
registered with this destination. It returns the base destination object.

```ts
const destination: DestinationDefinition = {
  name: 'Authorization Header Example',

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`
      }
    }
  }
}
```

## Action Definition

Actions are the discrete units that represent an interaction with the partner API.
An action is composed of a sequence of steps that are created based on the definition,
like mapping the event to a payload defined in the action, validating that payload, and
performing the action (aka talking to the partner API). Actions will look like this:

```ts
const action: ActionDefinition = {
  // The action-specific fields that can be configured by the customer
  // Ideally these fields will match what the partner API expects
  fields: {},

  // The set of fields that support UI-triggered interaction with the partner API to fetch choices (using the authenticated account)
  // For example: fetching a list of Slack channels the user can select
  dynamicFields: {}

  // The operation that an action performs when executed to send the mapped payload to the partner API
  // This is the core function of an action.
  perform: (request, data) => {}
}
```

#### perform

`perform()` accepts a callback function that receives a `fetch`-based request client and the [Data](#the-data-object)
object and returns the value that should be associated with the key.

```ts
const action = {
  // ...

  perform: (request, { payload, settings }) => {
    return request(`http://example.com/users/${payload.userId}`, {
      method: 'put',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`
      },
      json: payload.userProperties
    })
  }
}
```

### The Data Object

The Data object is an object passed to many of the callbacks that you'll define when adding steps
to an Action object. The Data object is used to propagate the incoming payload, settings, and
other values created at runtime among the various steps:

| Field      | Type     | Description                                         |
| ---------- | -------- | --------------------------------------------------- |
| `payload`  | `object` | Incoming Segment event-mapped payload.              |
| `settings` | `object` | Top-level destination setting values. E.g. `apiKey` |
