# What is the perform() function?

The perform() function in a Typescript function in an Action which is responsible for composing and sending data to a Destination platform.

# perform() function parameters

When an Action is invoked, the perform() function gets passed 2 parameters.

```typescript
perform: (request, data) => {}
```

However you'll often see the function defined like this, with the data parameter deconstructed into `settings` and `payload`:

```typescript
perform: (request, { settings, payload }) => {}
```

## The `request` parameter

The first parameter is a `request` client object, which implements the `RequestClient` interface. `RequestClient` is a wrapper around the `fetch` library.
The request object can be used to send data to the Destination platform using HTTPS.

## The `data` parameter

The second parameter is the `data` object. This parameter contains multiple objects within it, most importantly the `settings` and `payload` objects.

### The `settings` object

The `settings` object is a JSON object containing values for any fields defined in the Destination Defintion's authentication schema.

For example given the following authentication schema:

```typescript
authentication: {
  region: {
    label: "Region",
    description: "Region to send data to.",
    type: "string",
    required: true
  },
  api_key: {
    label: "API Key",
    description: "The API key for your <destination_name> platform.",
    type: "string",
    required: true
  }
}
```

The settings object passed in `data.settings` could look something like this:

```json
"settings": {
  "region": "US",
  "api_key": "RTYUT$%^&*(IUHGF%%$RTYG)UTYU"
}
```

#### The `settings` Typescript type

A Typescript type is defined in the generated-types file at the root of the Destination folder. A utility is used to generate this based off of the Destination Definition's field schema.

Here's what the generated-types file would look like for the authentication / settings fields we defined earlier.

```typescript
// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Region to send data to.
   */
  region: string
  /**
   * The API key for your <destination_name> platform.
   */
  api_key: string
}
```

### The `payload` object

The `payload` object is a JSON object containing values for any fields defined in the Action's fields.

For example given the following Action fields:

```typescript
fields: {
  properties: {
    label: "Properties",
    description: "Properties to send with the event.",
    type: "object",
    required: false,
    default: {'@path': '$.properties'}
  },
  event_name: {
    label: "Event Name",
    description: "The name of the event.",
    type: "string",
    required: true,
    default: {'@path': '$.event'}
  },
  user_identifier: {
    label: "User identifier",
    description: "A unique identifier for the user.",
    type: "string",
    required: true,
    default: {'@path': '$.userId'}
  }
}
```

The payload object passed in `data.payload` could look something like this:

```json
"payload": {
  "properties": {
    "product_id": "1234dsdsf",
    "name": "Chess set",
    "price": 99.9
  },
  "event_name": "Product Viewed",
  "userId": "uid234"
}
```

#### The `payload` Typescript type

A Typescript type for the `payload` object for the Action is defined in the generated-types in the Action folder. A utility is used to generate this based off of the Action's Field Definition.

Here's what the generated-types file would look like for the payload fields we defined earlier.

```typescript
// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Properties to send with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The name of the event.
   */
  event_name: string
  /**
   * A unique identifier for the user.
   */
  user_identifier: string
}
```

# perform() function code

Individual field values should be decomposed from the payload object as needed. For example

```typescript
const { properties, event_name, user_identifier } = payload
```

A payload to send to the Destination platform can now be constructed. It's best practice to define a Typescript interface for the shape of this payload.
We can call this Typescript type the `RequestJSON` type.

## the RequestJSON Typescript interface example

The RequestJSON Typescript type should define the full structure of the payload the Destination expects.
