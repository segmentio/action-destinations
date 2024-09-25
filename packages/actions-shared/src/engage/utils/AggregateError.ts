import { IntegrationError } from '@segment/actions-core'
import { getErrorDetails } from './ResponseError'

export class AggregateError extends IntegrationError {
  static create(args: {
    errors: any[]
    code?: string
    status?: number
    takeCodeAndStatusFromError?: any
    message?: (msg: string) => string
  }) {
    const firstErrorInfo = getErrorDetails(
      args.takeCodeAndStatusFromError ? args.takeCodeAndStatusFromError : args.errors[0]
    )

    if (!args.code) args.code = firstErrorInfo.code
    if (!args.status) args.status = firstErrorInfo.status
    let message = `Multiple errors (${args.errors.length}): ${args.errors
      .map((e) => getErrorDetails(e).message)
      .join(', ')}`
    message = args.message?.(message) || message
    return new AggregateError(args.errors, args.code, args.status, undefined, message)
  }

  constructor(public errors: any[], code?: string, status?: number, public data?: any, message?: string) {
    super(message || 'Multiple errors', code!, status!)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
