export function getPageParams() {
    return window.pageParams;
}
export function setPageParams(params) {
    return (window.pageParams = { ...window.pageParams, ...params });
}
export function setMbox3rdPartyId(id) {
    setPageParams({ mbox3rdPartyId: id });
}
export function serializeProperties(props) {
    if (props === undefined) {
        return {};
    }
    const serialized = {};
    for (const key in props) {
        serialized[key] = props[key];
        if (Array.isArray(props[key])) {
            serialized[key] = JSON.stringify(props[key]);
        }
    }
    return serialized;
}
//# sourceMappingURL=utils.js.map