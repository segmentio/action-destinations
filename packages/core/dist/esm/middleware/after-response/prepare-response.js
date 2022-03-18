const prepareResponse = async (_request, _options, response) => {
    const modifiedResponse = response;
    const clone = response.clone();
    const content = await clone.text();
    let data;
    try {
        if (modifiedResponse.headers.get('content-type')?.includes('application/json')) {
            data = JSON.parse(content);
        }
        else {
            data = content;
        }
    }
    catch (_error) {
    }
    modifiedResponse.content = content;
    modifiedResponse.data = data;
    return modifiedResponse;
};
export default prepareResponse;
//# sourceMappingURL=prepare-response.js.map