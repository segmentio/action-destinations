export function getAuthData(settings) {
    const oauthData = getOAuth2Data(settings);
    return { accessToken: oauthData.accessToken, refreshToken: oauthData.refreshToken };
}
export function getOAuth2Data(settings) {
    const { oauth } = settings;
    return {
        accessToken: oauth?.access_token,
        refreshToken: oauth?.refresh_token,
        clientId: oauth?.clientId,
        clientSecret: oauth?.clientSecret
    };
}
export function updateOAuthSettings(settings, oauthData) {
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
//# sourceMappingURL=parse-settings.js.map