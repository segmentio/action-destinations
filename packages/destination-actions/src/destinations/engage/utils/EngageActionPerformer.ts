import { RequestClient } from '@segment/actions-core/create-request-client'
import { ExecuteInput } from '@segment/actions-core/destination-kit'
import { MaybePromise } from '@segment/actions-core/destination-kittypes'

export abstract class EngageActionPerformer<TSettings, TPayload, TReturn = any> {
  constructor(
    protected readonly requestClient: RequestClient,
    protected readonly executeInput: ExecuteInput<TSettings, TPayload>
  ) {}

  perform() {
    return this.doPerform()
  }

  abstract doPerform(): MaybePromise<TReturn>
}
