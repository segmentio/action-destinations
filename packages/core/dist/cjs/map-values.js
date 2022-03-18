"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapValues = void 0;
function mapValues(obj, key) {
    return Object.entries(obj).reduce((agg, [name, value]) => {
        agg[name] = value[key];
        return agg;
    }, {});
}
exports.mapValues = mapValues;
//# sourceMappingURL=map-values.js.map