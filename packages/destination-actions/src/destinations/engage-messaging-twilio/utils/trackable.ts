/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MessageSender } from './message-sender'

export interface TrackableArgs {
  operation?: string
  log?: boolean
  stats?: boolean
  onError?: (this: MessageSender<any>, error: unknown) => { error?: unknown; tags?: string[] }
}

type GenericMethodDecorator<This = unknown, TFunc extends (...args: any[]) => any = (...args: any) => any> = (
  target: This,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<TFunc>
) => TypedPropertyDescriptor<TFunc> | void

export function trackable(_trackableArgs?: TrackableArgs): GenericMethodDecorator<MessageSender<any>> {
  return function (_targetProto, _propertyKey, descriptor) {
    const originalMethod = descriptor.value
    if (!originalMethod) throw new Error('trackable decorator can only be applied to methods')
    descriptor.value = function (...args: any[]) {
      const targetInstance = this as MessageSender<any>
      return _targetProto.trackWrap.apply(targetInstance, [
        () => {
          const result = originalMethod.apply(targetInstance, args)
          return result
        },
        _trackableArgs?.operation || _propertyKey,
        _trackableArgs,
        args
      ])
    }
  }
}
