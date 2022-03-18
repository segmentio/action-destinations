"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthToken = exports.createMapiRequest = exports.getMapiBaseUrl = exports.defaultMapiBaseUrl = void 0;
exports.defaultMapiBaseUrl = `https://mapi.fbot.me`;
function getMapiBaseUrl(authSecret) {
    const colonPos = authSecret.indexOf(':');
    if (colonPos <= 0) {
        return [authSecret, exports.defaultMapiBaseUrl];
    }
    else {
        const realAuthSecret = authSecret.substring(colonPos + 1);
        const environment = authSecret.substring(0, colonPos);
        const mapiBaseUrl = `https://mapi.fbot-${environment}.me`;
        return [realAuthSecret, mapiBaseUrl];
    }
}
exports.getMapiBaseUrl = getMapiBaseUrl;
async function createMapiRequest(path, request, settings, friendbuyPayload) {
    const [authSecret, mapiBaseUrl] = getMapiBaseUrl(settings.authSecret);
    const authToken = await getAuthToken(request, mapiBaseUrl, settings.authKey, authSecret);
    return [
        `${mapiBaseUrl}/${path}`,
        {
            method: 'POST',
            json: friendbuyPayload,
            headers: {
                Authorization: authToken
            }
        }
    ];
}
exports.createMapiRequest = createMapiRequest;
const AUTH_PADDING_MS = 10000;
let friendbuyAuth;
async function getAuthToken(request, mapiBaseUrl, authKey, authSecret) {
    if (!friendbuyAuth || Date.now() >= friendbuyAuth.expiresEpoch) {
        const r = await request(`${mapiBaseUrl}/v1/authorization`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            json: { key: authKey, secret: authSecret }
        });
        if (r.data) {
            const data = r.data;
            friendbuyAuth = {
                token: data.token,
                expiresEpoch: Date.parse(data.expires) - AUTH_PADDING_MS
            };
        }
    }
    return friendbuyAuth.token;
}
exports.getAuthToken = getAuthToken;
//# sourceMappingURL=cloudUtil.js.map