const headersToObject = (headers) => {
    const obj = {};
    for (const [key, value] of headers.entries()) {
        obj[key] = value;
    }
    return obj;
};
const prepareHeaders = async (_request, _options, response) => {
    Object.defineProperty(response.headers, 'toJSON', {
        enumerable: false,
        value: () => headersToObject(response.headers)
    });
    return response;
};
export default prepareHeaders;
//# sourceMappingURL=prepare-headers.js.map