# MultiStatus Documentation

## Table of Contents:

- [What is MultiStatus?](#what-is-multistatus)
- [Advantages of MultiStatus response](#advantages-of-multistatus-response)
- [Internal Types and Classes](#internal-types-and-classes)
  - [`ErrorCodes`](#errorcodes)
  - [`ActionDestinationSuccessResponseType`](#actiondestinationsuccessresponsetype)
  - [`ActionDestinationErrorResponseType`](#actiondestinationerrorresponsetype)
  - [`ActionDestinationSuccessResponse`](#actiondestinationsuccessresponse)
  - [`ActionDestinationErrorResponse`](#actiondestinationerrorresponse)
- [The MultiStatusResponse Class](#the-multistatusresponse-class)
  - [Importing and Initializing](#importing-and-initializing)
  - [`pushResponseObject`](#pushresponseobject)
  - [`pushSuccessResponse`](#pushsuccessresponse)
  - [`pushErrorResponse`](#pusherrorresponse)
  - [`pushResponseObjectAtIndex`](#pushresponseobjectatindex)
  - [`setSuccessResponseAtIndex`](#setsuccessresponseatindex)
  - [`setErrorResponseAtIndex`](#seterrorresponseatindex)
  - [`unsetResponseAtIndex`](#unsetresponseatindex)
  - [`isSuccessResponseAtIndex`](#issuccessresponseatindex)
  - [`isErrorResponseAtIndex`](#iserrorresponseatindex)
  - [`getResponseAtIndex`](#getresponseatindex)
  - [`getAllResponses`](#getallresponses)
  - [`length`](#length)
- [Common usage patterns](#common-usage-patterns)
  - [1. MultiStatus without pre-validation](#1-multistatus-without-pre-validation)
    - [Sending the payload to the destination](#sending-the-payload-to-the-destination)
    - [Handling the response](#handling-the-response)
    - [Returning the response](#returning-the-response)
  - [2. MultiStatus with pre-validation](#2-multistatus-with-pre-validation)
    - [Pre-validation](#pre-validation)
    - [Sending the payload to the destination](#sending-the-payload-to-the-destination-1)
    - [Handling the response](#handling-the-response-1)
    - [Returning the response](#returning-the-response-1)

## What is MultiStatus?

When delivering a batch of events to a destination from the `performBatch` block, Segment’s traditional behavior has been to treat the entire batch as either a **success** or a **failure**. This works well for some use cases, but it has limitations:

- If one event in the batch fails (e.g., due to a transient network error or invalid data), **none of the events** are retried or marked as failed individually.
- This can lead to incorrect observability metrics being generated.

**MultiStatus** support introduces the ability for destination handlers to return **per-event statuses**, enabling more granular control over delivery and retry behavior.

## Advantages of MultiStatus response

- **Improved Reliability**: Segment can now retry only the failed events instead of the entire batch.
- **Better Debugging**: Helps identify which specific events failed and why.
- **Fine-grained Control**: Enables partial success reporting in destination implementations that handle many events at once (e.g., bulk APIs).
- **Optimized Retries**: Only the failed events with retryable error codes are re-tried.

## Internal Types and Classes

### `ErrorCodes`

A union type that represents the possible error codes that can be returned by the API. [[Reference](https://github.com/segmentio/action-destinations/blob/main/packages/core/src/errors.ts#L276)]

<br/>

### `ActionDestinationSuccessResponseType`

A type that represents the success response from the API.

```ts
type ActionDestinationSuccessResponseType = {
  status: number
  sent: JSONLikeObject | string
  body: JSONLikeObject | string
}
```

It contains the following properties:

- `status`: The HTTP status code of the response.
- `sent`: The payload that was sent to the API.
- `body`: The response body from the API.

<br/>

### `ActionDestinationErrorResponseType`

A type that represents the error response from the API.

```ts
type ActionDestinationErrorResponseType = {
  status: number
  errortype?: keyof typeof ErrorCodes
  errormessage: string
  sent?: JSONLikeObject | string
  body?: JSONLikeObject | string
}
```

It contains the following properties:

- `status`: The HTTP status code of the response.
- `errortype`: The error type. This is optional and can be inferred from the status code.
- `errormessage`: The error message.
- `sent`: The payload that was sent to the API. This is optional.
- `body`: The response body from the API. This is optional.

<br/>

### `ActionDestinationSuccessResponse`

A class that represents a success response from the API.
Example usage:

```ts
 const actionDestinationSuccessResponse = new ActionDestinationSuccessResponse(data: ActionDestinationSuccessResponseType)
```

<br/>

### `ActionDestinationErrorResponse`

A class that represents an error response from the API.

Example usage:

```ts
 const actionDestinationErrorResponse = new ActionDestinationErrorResponse(data: ActionDestinationErrorResponseType)
```

Note: The `errortype` is optional and can be inferred from the status code.

<br/>

## The MultiStatusResponse Class

### Importing and Initializing

To use the `MultiStatusResponse` class, you need to import it from the `@segment/actions-core` package and initialize it as follows:

```ts
import { MultiStatusResponse } from '@segment/actions-core'

const multiStatusResponse = new MultiStatusResponse()
```

<br/>

### `pushResponseObject`

Pushes a response object of type success or error at the end of the internal array.

```ts
pushResponseObject(response: ActionDestinationSuccessResponse | ActionDestinationErrorResponse): void
```

<br/>

### `pushSuccessResponse`

Appends a success response to the end of the list. If a plain object is passed, it will be wrapped in `ActionDestinationSuccessResponse`.

```ts
pushSuccessResponse(response: ActionDestinationSuccessResponse | ActionDestinationSuccessResponseType): void
```

<br/>

### `pushErrorResponse`

Appends an error response to the end of the list. If a plain object is passed, it will be wrapped in `ActionDestinationErrorResponse`.

```ts
pushErrorResponse(response: ActionDestinationErrorResponse | ActionDestinationErrorResponseType): void
```

<br/>

### `pushResponseObjectAtIndex`

Pushes a response object of type success or error at the specified index in the internal array.

```ts
pushResponseObjectAtIndex(index: number, response: ActionDestinationSuccessResponse | ActionDestinationErrorResponse): void
```

<br/>

### `setSuccessResponseAtIndex`

Sets a success response at the specified index in the internal array. Useful for mapping responses to their original batch index. If a plain object is passed, it will be wrapped in `ActionDestinationSuccessResponse`.

```ts
setSuccessResponseAtIndex(index: number, response: ActionDestinationSuccessResponse | ActionDestinationSuccessResponseType): void
```

<br/>

### `setErrorResponseAtIndex`

Sets an error response at the specified index in the internal array. Useful for mapping responses to their original batch index. If a plain object is passed, it will be wrapped in `ActionDestinationErrorResponse`.

```ts
setErrorResponseAtIndex(index: number, response: ActionDestinationErrorResponse | ActionDestinationErrorResponseType): void
```

<br/>

### `unsetResponseAtIndex`

Sets a response at the specified index in the internal array to `undefined`. This is useful for marking a response as unset.

```ts
unsetResponseAtIndex(index: number): void
```

<br/>

### `isSuccessResponseAtIndex`

Returns `true` if the response at the specified index in the internal array is a success.

```ts
isSuccessResponseAtIndex(index: number): boolean
```

<br/>

### `isErrorResponseAtIndex`

Returns `true` if the response at the specified index in the internal array is an error.

```ts
isErrorResponseAtIndex(index: number): boolean
```

<br/>

### `getResponseAtIndex`

Returns the response (success or error) at the specified index.

```ts
getResponseAtIndex(index: number): ActionDestinationSuccessResponse | ActionDestinationErrorResponse
```

<br/>

### `getAllResponses`

Returns all the responses (success or error) in the internal array.

```ts
getAllResponses(): (ActionDestinationSuccessResponse | ActionDestinationErrorResponse)[]
```

<br/>

### `length`

Returns the number of responses in the internal array. This will also include indexes that are set to `undefined`.

```ts
length(): number
```

## Common usage patterns

### 1. MultiStatus without pre-validation

#### Sending the payload to the destination

```ts
const response = request<APIResponseType>(`https://example-api.com/api/v1/track`, {
  method: 'post',
  json: {
    events: payloads
  }
})
```

#### Handling the response

Assuming the API returns an HTTP 207 `MultiStatus` response as follows:

```json
{
  "itemsProcessed": 5,
  "success": 3,
  "error": 2,
  "errorResponses": [
    {
      "status": 400,
      "message": "Invalid zip code",
      "index": 0
    },
    {
      "status": 400,
      "message": "Invalid zip code",
      "index": 1
    }
  ]
}
```

We can then handle the response as follows:

```ts
// Assuming all responses to success by default
for (let i = 0; i < payloads.length; i++) {
  multiStatusResponse.setSuccessResponseAtIndex(i, {
    status: 200,
    sent: payloads[i],
    // Since the API doesn't return the response body, we can set it manually
    body: 'Processed successfully'
  })
}

// Overwriting errored indexes with error responses from the API
if (response.body.errorResponses) {
  errorResponses.forEach((errorResponse) => {
    const { status, message, index } = errorResponse

    multiStatusResponse.setErrorResponseAtIndex(index, {
      status,
      // errortype is optional, if removed, it will be inferred from the status code
      errortype: ErrorCodes.BAD_REQUEST,
      errormessage: message,
      // Note: the index returned by the API is the index of the payload in the filtered list
      sent: payloads[index],
      // In our case, the error is returned with a message
      body: message
    })
  })
}
```

#### Returning the response

Finally, we can return the `MultiStatusResponse` object to Segment:

```ts
return multiStatusResponse
```

<br/>

### 2. MultiStatus with pre-validation

#### Pre-validation

Depending on the use case, we can optionally pre-validate the events before sending them to the destination. Eg: A required combination of fields are missing or invalid.

```ts
const multiStatusResponse = new MultiStatusResponse()

const filteredPayloads: JSONLikeObject[] = []

// A bitmap data structure that stores arr[new_index] = original_batch_payload_index
const validPayloadIndicesBitmap: number[] = []

// Iterate over the payloads and validate them
payloads.forEach((payload, originalBatchIndex) => {
  const { email, phone } = payload

  // Either email or phone number is required
  if (!email && !phone) {
    multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'Either "email" or "phone" is required.'
    })

    return
  }

  // Add the payload to the filtered list
  filteredPayloads.push(payload)
  // Add the original index to the bitmap
  validPayloadIndicesBitmap.push(originalBatchIndex)
})
```

#### Sending the payload to the destination

```ts
const response = request<APIResponseType>(`https://example-api.com/api/v1/track`, {
  method: 'post',
  json: {
    events: filteredPayloads
  }
})
```

#### Handling the response

Assuming the API returns an HTTP 207 `MultiStatus` response as follows:

```json
{
  "itemsProcessed": 5,
  "success": 3,
  "error": 2,
  "errorResponses": [
    {
      "status": 400,
      "message": "Invalid zip code",
      "index": 0
    },
    {
      "status": 400,
      "message": "Invalid zip code",
      "index": 1
    }
  ]
}
```

We can then handle the response as follows:

```ts
// Assuming all responses to success by default
for (let i = 0; i < filteredPayloads; i++) {
  const originalBatchIndex = validPayloadIndicesBitmap[i]

  multiStatusResponse.setSuccessResponseAtIndex(originalBatchIndex, {
    status: 200,
    sent: filteredPayloads[i],
    // Since the API doesn't return the response body, we can set it manually
    body: 'Processed successfully'
  })
}

// Overwriting errored indexes with error responses from the API
if (response.body.errorResponses) {
  errorResponses.forEach((errorResponse) => {
    const { status, message, index } = errorResponse
    const originalBatchIndex = validPayloadIndicesBitmap[index]

    multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
      status,
      // errortype is optional, if removed, it will be inferred from the status code
      errortype: ErrorCodes.BAD_REQUEST,
      errormessage: message,
      // Note: the index returned by the API is the index of the payload in the filtered list
      sent: filteredPayloads[index],
      // In our case, the error is returned with a message
      body: message
    })
  })
}
```

#### Returning the response

Finally, we can return the `MultiStatusResponse` object to Segment:

```ts
return multiStatusResponse
```
