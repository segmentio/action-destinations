import btoa from 'btoa-lite';
const addBasicAuthHeader = (options) => {
    if (options.username || options.password) {
        const username = options.username || '';
        const password = options.password || '';
        const encoded = btoa(`${username}:${password}`);
        const authorization = `Basic ${encoded}`;
        return {
            headers: {
                Authorization: authorization
            }
        };
    }
};
export default addBasicAuthHeader;
//# sourceMappingURL=add-basic-auth-header.js.map