"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function getExchanges(responses) {
    const requests = [];
    for (const response of responses) {
        requests.push({
            request: await summarizeRequest(response),
            response: summarizeResponse(response)
        });
    }
    return requests;
}
exports.default = getExchanges;
async function summarizeRequest(response) {
    const request = response.request.clone();
    const data = await request.text();
    return {
        url: request.url,
        method: request.method,
        headers: request.headers,
        body: data !== null && data !== void 0 ? data : ''
    };
}
function summarizeResponse(response) {
    var _a;
    return {
        statusCode: response.status,
        statusMessage: response.statusText,
        headers: response.headers,
        body: (_a = response.data) !== null && _a !== void 0 ? _a : response
    };
}
//# sourceMappingURL=summarize-http.js.map