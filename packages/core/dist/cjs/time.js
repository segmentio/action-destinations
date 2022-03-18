"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duration = exports.time = void 0;
function time() {
    return process.hrtime.bigint();
}
exports.time = time;
function duration(start, stop) {
    return Number(stop - start) / 1000000;
}
exports.duration = duration;
//# sourceMappingURL=time.js.map