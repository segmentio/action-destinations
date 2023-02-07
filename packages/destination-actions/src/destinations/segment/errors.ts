import { MisconfiguredFieldError } from '@segment/actions-core'

export const MissingUserOrAnonymousIdThrowableError = new MisconfiguredFieldError(
  'Either `Anonymous ID` or `User ID` must be defined.'
)

export const InvalidEndpointSelectedThrowableError = new MisconfiguredFieldError(
  'A valid endpoint must be selected. Please check your Segment settings.'
)
