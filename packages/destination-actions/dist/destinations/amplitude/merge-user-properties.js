"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeUserProperties = void 0;
function mergeUserProperties(...properties) {
    return properties.reduce((prev, current) => {
        const hasSet = prev.$set || current.$set;
        const hasSetOnce = prev.$setOnce || current.$setOnce;
        return {
            ...prev,
            ...current,
            ...(hasSet && { $set: { ...prev.$set, ...current.$set } }),
            ...(hasSetOnce && { $setOnce: { ...prev.$setOnce, ...current.$setOnce } })
        };
    }, {});
}
exports.mergeUserProperties = mergeUserProperties;
//# sourceMappingURL=merge-user-properties.js.map