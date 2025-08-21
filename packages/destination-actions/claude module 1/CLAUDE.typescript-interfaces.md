# Segment sends data to Destinations over HTTPS

Segment uses a wrapper around the Javascript fetch library to send data to Destination APIs.
If asked to design and build a Segment Destination, it can be assumed that the Destination's API will accept JSON data over HTTPS.
Let's call the shape of this data sent to the Destination API the `JSON Request Interface`.
Let's call the shape of the response the `JSON Response Interface`.

# Destination JSON

Each Action must define `JSON Request Interface` and `JSON Response Interface` formats in a file nameed types.ts.
The format is expressed as Typescript interfaces or Typescript types.
The current repository doesn't follow these rules, but when designing and building a new Destination the rules should be followed.
These Interfaces will be used for 2 things:

1. To inform how Actions Fields are designed. These fields select out parts of the Segment track(), identify(), page(), screen() or group() JSON payloads for use in the perform() and perfomrBatch() functions.
2. To inform how the transformation logic in the perform() and performBatch() code should work, as it needs to construct JSON data to send using the `JSON Request Interface`, and it needs to handle the response as defined by the `JSON Response Interface`.

# Example 1: Destination JSON Request

The following is a Destination JSON Request format used when triggering emails on an Emailing platform.

```typescript
interface EmailDetails {
  email: string
  name: string | undefined
}

interface StringObject {
  [key: string]: string
}

export interface SendEmailReq {
  domain?: string
  personalizations: [
    {
      to: EmailDetails[]
      cc?: EmailDetails[]
      bcc?: EmailDetails[]
      headers?: StringObject
      dynamic_template_data?: {
        [k: string]: unknown
      }
      custom_args?: StringObject
      send_at?: number
    }
  ]
  from: EmailDetails
  reply_to?: EmailDetails
  template_id: string
  categories?: string[]
  asm?: {
    group_id: number
  }
  ip_pool_name?: string
}
```

This interface should be understood as follows:

## EmailDetails Interface

An object which has the following attributes:

- A required string attribute named `email`.
- A required string or undefined attribute named `name`.

## StringObject Interface

An object which has the following attribute:

- A string index signature attribute `[key: string]`.

## SendEmailReq Interface

An object which has the following attributes:

- An optional string attribute named `domain`.
- A required array attribute named `personalizations` containing objects with:
  - A required `EmailDetails[]` attribute named `to`.
  - An optional `EmailDetails[]` attribute named `cc`.
  - An optional `EmailDetails[]` attribute named `bcc`.
  - An optional `StringObject` attribute named `headers`.
  - An optional object attribute named `dynamic_template_data` with keys of type string and values of type unknown.
  - An optional `StringObject` attribute named `custom_args`.
  - An optional number attribute named `send_at`.
- A required `EmailDetails` attribute named `from`.
- An optional `EmailDetails` attribute named `reply_to`.
- A required string attribute named `template_id`.
- An optional string array attribute named `categories`.
- An optional object attribute named `asm` with:
  - A required number attribute named `group_id`.
- An optional string attribute named `ip_pool_name`.

# Example 2: Another Destination JSON Request

The following is a Destination JSON Request format used when sending analytics events to a multipurpose analytics and communications plaform.

```typescript
export interface TrackPageEventJSON {
  url: string
  title?: string
  referrer?: string
  userId?: string
  anonymousId?: string
  email?: string
  listId: string
  properties?: {
    [key: string]: unknown
  }
  timestamp?: string | number
}
```

### TrackPageEventJSON Interface

An object which contains the following attributes:

- A required string attribute named `url`.
- An optional string attribute named `title`.
- An optional string attribute named `referrer`.
- An optional string attribute named `userId`.
- An optional string attribute named `anonymousId`.
- An optional string attribute named `email`.
- A required string attribute named `listId`.
- An optional object attribute named `properties` with keys of type string and values of type unknown.
- An optional string or number attribute named `timestamp`.
