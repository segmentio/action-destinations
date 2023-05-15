/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Logger } from '@segment/actions-core/src/destination-kit'

export class MessagingLogger {
  private readonly logDetails: Record<string, unknown> = {}

  constructor(readonly logger?: Logger) {}

  /**
   * populate the logDetails object with the data that should be logged for every message
   */
  appendLogDetails(details: Record<string, unknown>) {
    Object.assign(this.logDetails, details)
  }

  redactPii(pii: string | undefined) {
    if (!pii) {
      return pii
    }

    if (pii.length <= 8) {
      return '***'
    }
    return pii.substring(0, 3) + '***' + pii.substring(pii.length - 3)
  }

  logInfo(...msgs: string[]) {
    const [firstMsg, ...rest] = msgs
    this.logger?.info(`TE Messaging: ${firstMsg}`, ...rest, JSON.stringify(this.logDetails))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logError(error?: any, ...msgs: string[]) {
    const [firstMsg, ...rest] = msgs
    if (typeof error === 'string') {
      this.logger?.error(`TE Messaging: ${error}`, ...msgs, JSON.stringify(this.logDetails))
    } else {
      this.logger?.error(
        `TE Messaging: ${firstMsg}`,
        ...rest,
        error instanceof Error ? error.message : error?.toString(),
        JSON.stringify(this.logDetails)
      )
    }
  }

  logWrap<R = void>(messages: string[], fn: () => R): R {
    this.logInfo('Starting: ', ...messages)
    try {
      const res = fn()
      if (this.isPromise(res)) {
        return (async () => {
          try {
            const promisedRes = await res
            this.logInfo('Success: ', ...messages)
            return promisedRes
          } catch (error: unknown) {
            this.logError(error, 'Failed: ', ...messages)
            throw error
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })() as any as R // cast to R otherwise ts is not happy
      }
      this.logInfo('Success: ', ...messages)
      return res
    } catch (error: unknown) {
      this.logError(error, 'Failed: ', ...messages)
      throw error
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isPromise<T = unknown>(obj: unknown): obj is Promise<T> {
    // `obj instanceof Promise` is not reliable since it can be a custom promise object from fetch lib
    //https://stackoverflow.com/questions/27746304/how-to-check-if-an-object-is-a-promise

    // for whatever reason it gave me error "Property 'then' does not exist on type 'never'." so i have to use ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return obj instanceof Object && 'then' in obj && typeof obj.then === 'function'
  }
}
