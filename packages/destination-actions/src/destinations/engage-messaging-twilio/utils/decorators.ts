import { IntegrationError } from "@segment/actions-core";
import type { MessageSender } from "./message-sender";
import { StatsArgs } from "./wrapUtils";

export type MessageSenderMethodDecorator<TMessageSender extends MessageSender<any> = MessageSender<any>, TFunc extends (...args:any[]) => any = (...args:any[]) => any> = (target:TMessageSender, propertyKey: string, descriptor: TypedPropertyDescriptor<TFunc>)=>TypedPropertyDescriptor<TFunc>|void;


export interface TrackableArgs { 
  operation?: string//default is method name - used for metric name, and log message
  description?: string //used for log message
  log?:boolean,//default true
  stats?:boolean,//default true
  onError?:(this:MessageSender<any>, e:unknown)=>IntegrationError,
  errorReason?:(this:MessageSender<any>, e:unknown)=>string,
  integrationError?:(this:MessageSender<any>, e:unknown)=>ConstructorParameters<typeof IntegrationError>,
  [key:string]:any
}

export function trackable<TFunc extends (...args:any[])=>any>(_trackableArgs: TrackableArgs, funcToWrap: TFunc, canStatsAndLogs: MessageSender<any>): TFunc
export function trackable(_trackableArgs?: TrackableArgs ): MessageSenderMethodDecorator 
export function trackable(): any
{
  throw new Error('Not implemented');
  // return (_target, _methodName, _descr) => {
  // }
}

export function loggable(_logArgs?:{ [handler in "onTry"|"onCatch"|"onFinally"]?:boolean|string[]|((this:MessageSender<any>, res:{result?:unknown, error?: unknown, duration?: number})=>string[]) }):MessageSenderMethodDecorator
{
  return (_target, _methodName, _descr)=>{
    throw new Error('Not implemented');
  }
}
export function statsable(_statsArgs?: { [handler in "onTry"|"onCatch"|"onFinally"]?: (boolean|StatsArgs[]|((this:MessageSender<any>, res:{result?:unknown, error?: unknown, duration?: number})=>StatsArgs[])) } & {metric?:string}):MessageSenderMethodDecorator
{
  return (_target)=>{
    throw new Error('Not implemented');
  }
}

export function rethrowable(_rethrowArgs?:(e:unknown)=>unknown):MessageSenderMethodDecorator
{
  return (_target)=>{
    throw new Error('Not implemented');
  }
}
