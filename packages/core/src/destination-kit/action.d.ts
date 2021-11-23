/// <reference types="node" />
import { EventEmitter } from 'events';
import createRequestClient from '../create-request-client';
import { JSONLikeObject, JSONObject } from '../json-object';
import { InputData } from '../mapping-kit';
import type { DynamicFieldResponse, InputField, RequestExtension, ExecuteInput, Result } from './types';
import type { JSONSchema4 } from 'json-schema';
import { AuthTokens } from './parse-settings';
declare type MaybePromise<T> = T | Promise<T>;
declare type RequestClient = ReturnType<typeof createRequestClient>;
export declare type RequestFn<Settings, Payload, Return = any> = (request: RequestClient, data: ExecuteInput<Settings, Payload>) => MaybePromise<Return>;
export interface BaseActionDefinition {
    title: string;
    description: string;
    platform?: 'cloud' | 'web';
    defaultSubscription?: string;
    hidden?: boolean;
    fields: Record<string, InputField>;
}
export interface ActionDefinition<Settings, Payload = any> extends BaseActionDefinition {
    dynamicFields?: {
        [K in keyof Payload]?: RequestFn<Settings, Payload, DynamicFieldResponse>;
    };
    perform: RequestFn<Settings, Payload>;
    performBatch?: RequestFn<Settings, Payload[]>;
}
interface ExecuteDynamicFieldInput<Settings, Payload> {
    settings: Settings;
    payload: Payload;
    page?: string;
}
interface ExecuteBundle<T = unknown, Data = unknown> {
    data: Data;
    settings: T;
    mapping: JSONObject;
    auth: AuthTokens | undefined;
}
export declare class Action<Settings, Payload extends JSONLikeObject> extends EventEmitter {
    readonly definition: ActionDefinition<Settings, Payload>;
    readonly destinationName: string;
    readonly schema?: JSONSchema4;
    readonly hasBatchSupport: boolean;
    private extendRequest;
    constructor(destinationName: string, definition: ActionDefinition<Settings, Payload>, extendRequest?: RequestExtension<Settings>);
    execute(bundle: ExecuteBundle<Settings, InputData | undefined>): Promise<Result[]>;
    executeBatch(bundle: ExecuteBundle<Settings, InputData[]>): Promise<void>;
    executeDynamicField(field: string, data: ExecuteDynamicFieldInput<Settings, Payload>): unknown;
    private performRequest;
    private createRequestClient;
    private afterResponse;
    private parseResponse;
}
export {};
