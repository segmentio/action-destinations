"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOAuthSettings = exports.getOAuth2Data = exports.getAuthData = void 0;
function getAuthData(settings) {
    const oauthData = getOAuth2Data(settings);
    return { accessToken: oauthData.accessToken, refreshToken: oauthData.refreshToken };
}
exports.getAuthData = getAuthData;
function getOAuth2Data(settings) {
    const { oauth } = settings;
    return {
        accessToken: oauth?.access_token,
        refreshToken: oauth?.refresh_token,
        clientId: oauth?.clientId,
        clientSecret: oauth?.clientSecret
    };
}
exports.getOAuth2Data = getOAuth2Data;
function updateOAuthSettings(settings, oauthData) {
    const { oauth, ...otherSettings } = settings;
    if (oauth) {
        const newOauth = oauth;
        newOauth.access_token = oauthData.accessToken;
        if (oauthData.refreshToken) {
            newOauth.refresh_token = oauthData.refreshToken;
        }
        otherSettings['oauth'] = newOauth;
    }
    return otherSettings;
}
exports.updateOAuthSettings = updateOAuthSettings;
//# sourceMappingURL=parse-settings.js.map