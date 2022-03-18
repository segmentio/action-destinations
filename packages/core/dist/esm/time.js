export function time() {
    return process.hrtime.bigint();
}
export function duration(start, stop) {
    return Number(stop - start) / 1000000;
}
//# sourceMappingURL=time.js.map