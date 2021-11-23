import { OAuth2ClientCredentials, RefreshAccessTokenResult } from '.';
import { JSONObject } from '../json-object';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export declare function getAuthData(settings: JSONObject): AuthTokens;
export declare function getOAuth2Data(settings: JSONObject): OAuth2ClientCredentials;
export declare function updateOAuthSettings(settings: JSONObject, oauthData: RefreshAccessTokenResult): JSONObject;
