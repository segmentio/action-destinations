import addBasicAuthHeader from './middleware/before-request/add-basic-auth-header';
import prepareHeaders from './middleware/after-response/prepare-headers';
import prepareResponse from './middleware/after-response/prepare-response';
import createInstance from './request-client';
const baseClient = createInstance({
    timeout: 10000,
    headers: {
        'user-agent': 'Segment (Actions)'
    },
    beforeRequest: [
        addBasicAuthHeader
    ],
    afterResponse: [prepareResponse, prepareHeaders]
});
export default function createRequestClient(...requestOptions) {
    let client = baseClient;
    for (const options of requestOptions ?? []) {
        client = client.extend(options);
    }
    return (url, options) => {
        return client(url, options);
    };
}
//# sourceMappingURL=create-request-client.js.map