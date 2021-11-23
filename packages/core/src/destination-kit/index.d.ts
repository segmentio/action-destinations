import type { JSONSchema4 } from 'json-schema';
import { Action, ActionDefinition, BaseActionDefinition, RequestFn } from './action';
import { JSONLikeObject, JSONObject } from '../json-object';
import { SegmentEvent } from '../segment-event';
import { fieldsToJsonSchema, MinimalInputField } from './fields-to-jsonschema';
import { RequestClient } from '../create-request-client';
import type { ModifiedResponse } from '../types';
import type { GlobalSetting, RequestExtension, ExecuteInput, Result, Deletion } from './types';
import type { AllRequestOptions } from '../request-client';
import { AuthTokens } from './parse-settings';
export type { BaseActionDefinition, ActionDefinition, ExecuteInput, RequestFn };
export type { MinimalInputField };
export { fieldsToJsonSchema };
export interface SubscriptionStats {
    duration: number;
    destination: string;
    action: string;
    subscribe: string;
    input: JSONLikeObject;
    output: Result[] | null;
}
interface PartnerActions<Settings, Payload extends JSONLikeObject> {
    [key: string]: Action<Settings, Payload>;
}
export interface BaseDefinition {
    name: string;
    mode: 'cloud' | 'device';
    description?: string;
    slug?: string;
    actions: Record<string, BaseActionDefinition>;
    presets?: Subscription[];
}
export interface DestinationDefinition<Settings = unknown> extends BaseDefinition {
    mode: 'cloud';
    actions: Record<string, ActionDefinition<Settings>>;
    extendRequest?: RequestExtension<Settings>;
    authentication?: AuthenticationScheme<Settings>;
    onDelete?: Deletion<Settings>;
}
export interface Subscription {
    name?: string;
    partnerAction: string;
    subscribe: string;
    mapping?: JSONObject;
}
export interface OAuth2ClientCredentials extends AuthTokens {
    clientId: string;
    clientSecret: string;
}
export interface RefreshAccessTokenResult {
    accessToken: string;
    refreshToken?: string;
}
interface AuthSettings<Settings> {
    settings: Settings;
    auth: AuthTokens;
}
interface RefreshAuthSettings<Settings> {
    settings: Settings;
    auth: OAuth2ClientCredentials;
}
interface Authentication<Settings> {
    scheme: 'basic' | 'custom' | 'oauth2';
    fields: Record<string, GlobalSetting>;
    testAuthentication?: (request: RequestClient, input: AuthSettings<Settings>) => Promise<unknown> | unknown;
}
export interface CustomAuthentication<Settings> extends Authentication<Settings> {
    scheme: 'custom';
}
export interface BasicAuthentication<Settings> extends Authentication<Settings> {
    scheme: 'basic';
}
export interface OAuth2Authentication<Settings> extends Authentication<Settings> {
    scheme: 'oauth2';
    refreshAccessToken?: (request: RequestClient, input: RefreshAuthSettings<Settings>) => Promise<RefreshAccessTokenResult>;
}
export declare type AuthenticationScheme<Settings = any> = BasicAuthentication<Settings> | CustomAuthentication<Settings> | OAuth2Authentication<Settings>;
interface EventInput<Settings> {
    readonly event: SegmentEvent;
    readonly mapping: JSONObject;
    readonly settings: Settings;
    readonly auth?: AuthTokens;
}
interface BatchEventInput<Settings> {
    readonly events: SegmentEvent[];
    readonly mapping: JSONObject;
    readonly settings: Settings;
    readonly auth?: AuthTokens;
}
export interface DecoratedResponse extends ModifiedResponse {
    request: Request;
    options: AllRequestOptions;
}
interface OnEventOptions {
    onTokenRefresh?: (tokens: RefreshAccessTokenResult) => void;
    onComplete?: (stats: SubscriptionStats) => void;
}
export declare class Destination<Settings = JSONObject> {
    readonly definition: DestinationDefinition<Settings>;
    readonly name: string;
    readonly authentication?: AuthenticationScheme<Settings>;
    readonly extendRequest?: RequestExtension<Settings>;
    readonly actions: PartnerActions<Settings, any>;
    readonly responses: DecoratedResponse[];
    readonly settingsSchema?: JSONSchema4;
    onDelete?: (event: SegmentEvent, settings: JSONObject, options?: OnEventOptions) => Promise<Result>;
    constructor(destination: DestinationDefinition<Settings>);
    validateSettings(settings: Settings): void;
    testAuthentication(settings: Settings): Promise<void>;
    refreshAccessToken(settings: Settings, oauthData: OAuth2ClientCredentials): Promise<RefreshAccessTokenResult> | undefined;
    private partnerAction;
    protected executeAction(actionSlug: string, { event, mapping, settings, auth }: EventInput<Settings>): Promise<Result[]>;
    executeBatch(actionSlug: string, { events, mapping, settings, auth }: BatchEventInput<Settings>): Promise<{
        output: string;
    }[]>;
    private onSubscription;
    onEvent(event: SegmentEvent, settings: JSONObject, options?: OnEventOptions): Promise<Result[]>;
    onBatch(events: SegmentEvent[], settings: JSONObject, options?: OnEventOptions): Promise<Result[]>;
    private _onDelete;
    private onSubscriptions;
    private getSubscriptions;
    private getDestinationSettings;
}
