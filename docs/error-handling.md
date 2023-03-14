# Error handling

The built-in error handling functionality should assist you in dealing with the majority of error situations you encounter. However, if the validation capabilities of the framework are inadequate or if the error messages returned by the API you are working with are unhelpful, you may decide to capture and throw your own customized errors. To ensure that your errors are correctly structured and presented to your end users for appropriate action, it is essential to adhere to the following guidelines.

## Built-In error handling

The Action Destinations framework can capture and display following types of errors.

### Payload validation errors

Payload Validation Errors are errors due to the event payload not conforming to `ActionDefinition` defined. These errors are captured and the execution is halted before the `perform` and `performBatch` handlers in `ActionDefintion` are invoked. Payload validation errors are not **retried**.

Couple of examples are

- A field is marked as `required` in the `ActionDefinition` and the event payload doesn't contain the field.
- A field's type is marked as `datetime` in the `ActionDefinition` but the field has a value of different type in the event payload.

### Http errors

All Http Errors resulting from API calls are automatically captured by the framework. The `request` object used for making HTTP API calls has an option called `throwHttpErrors`. In its default state of `true`, the `request` object throws an `HttpError` which are captured and handled automatically by the framework. Http Errors are retried depending on the status code. Refer [error.ts](../packages/core/src/errors.ts) for retryable status codes.

In case you wish to override this behavior, you can set `throwHttpErrors` explicitly to `false`. The `request` object would then not throw HttpError and return the `response` along with status code. You can then choose to throw your own version of the error or proceed with your open implementation.

### Authentication errors

Errors due to invalid access tokens, refresh tokens or api keys are captured as `InvalidAuthenticationError`. If the API you are integrating with returns the standard Authentication error codes, they are handled as defined in [Http Errors](error-handling.md#http-errors) section.

## Custom error handling

The inbuilt error handling should help you with most of the error scenarios you face. In cases where the validation capabilities provided by the framework are not sufficient or the error messages returned by the API you are interacting with are not helpful, you can chose to capture and throw your own custom errors. It is important to adhere to the following guidelines to ensure your errors are structured properly and displayed to your destination users for appropriate action.

- DO NOT throw Javascript `Error` objects. Any error thrown from an action MUST contain a `message` describing the error, an `error code` indicating the type of error and a `status code` indicating the http status of the action. You MUST use predefined error classes defined in [error.ts](../packages/core/src/errors.ts). These classes help in capturing the necessary information in appropriate format. For example, assume that your action needs one of product id or product name. This kind of validation is not currently supported in `Action Definition`. Instead of `throw new Error('One of product id or name is required')`, use `throw new PayloadValidationError('One of product id or name is required')`.

  - Use `PayloadValidationError` for any custom validations. These errors won't be retried.
  - Use `InvalidAuthenticationError` for any authentication related errors. These errors won't be retried.
  - Use `RetryableError` in case you want to signal Segment to retry the events. Use this error only for transient errors.
  - For all other scenarios, use the `IntegrationError`.

- Use appropriate Error Codes. Error Codes are short representation of the error type and they are shown in [Event Delivery](error-handling.md/#where-are-the-errors-from-destinations-displayed) pane. It is RECOMMENDED to use the predefined error codes as Segment adds additional contexual information for debugging in Event Delivery for these error cdoes.

- Provide clear actionable error messages for your destination customers.

## Where are the Errors from destinations displayed?

The errors thrown from Action Destinations are displayed in Event Delivery pane of the destinations. The Event Delivery pane helps you understand if data is reaching your destinations, and also helps you to see if Segment encountered any issues delivering your source data. See [here](https://segment.com/docs/connections/event-delivery/) to learn more about Event Delivery pane in Segment.
