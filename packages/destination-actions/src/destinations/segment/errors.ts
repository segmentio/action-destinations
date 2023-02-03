import { ValidationError } from '@segment/actions-core'

export const MissingUserOrAnonymousIdThrowableError = new ValidationError(
  'Either `Anonymous ID` or `User ID` must be defined.'
)

export const InvalidEndpointSelectedThrowableError = new ValidationError(
  'A valid endpoint must be selected. Please check your Segment settings.'
)
