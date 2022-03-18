"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const add_basic_auth_header_1 = __importDefault(require("./middleware/before-request/add-basic-auth-header"));
const prepare_headers_1 = __importDefault(require("./middleware/after-response/prepare-headers"));
const prepare_response_1 = __importDefault(require("./middleware/after-response/prepare-response"));
const request_client_1 = __importDefault(require("./request-client"));
const baseClient = request_client_1.default({
    timeout: 10000,
    headers: {
        'user-agent': 'Segment (Actions)'
    },
    beforeRequest: [
        add_basic_auth_header_1.default
    ],
    afterResponse: [prepare_response_1.default, prepare_headers_1.default]
});
function createRequestClient(...requestOptions) {
    let client = baseClient;
    for (const options of requestOptions ?? []) {
        client = client.extend(options);
    }
    return (url, options) => {
        return client(url, options);
    };
}
exports.default = createRequestClient;
//# sourceMappingURL=create-request-client.js.map