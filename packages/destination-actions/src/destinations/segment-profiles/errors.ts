import { HTTPError, IntegrationError } from '@segment/actions-core'

export class SegmentPublicAPIError extends HTTPError {
  response: Response & {
    errors: {
      type: string
      message?: string
      field?: string
      data?: string
      status?: number
    }
  }
}

export const MissingUserOrAnonymousIdThrowableError = new IntegrationError(
  'Either `Anonymous ID` or `User ID` must be defined.',
  'Missing Required Field',
  400
)

export const InvalidEndpointSelectedThrowableError = new IntegrationError(
  'A valid endpoint must be selected. Please check your Segment settings.',
  'Misconfigured Endpoint',
  400
)
