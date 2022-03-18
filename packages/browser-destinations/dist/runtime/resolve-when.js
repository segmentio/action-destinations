export async function resolveWhen(condition, timeout) {
    return new Promise((resolve, _reject) => {
        if (condition()) {
            resolve();
            return;
        }
        const check = () => setTimeout(() => {
            if (condition()) {
                resolve();
            }
            else {
                check();
            }
        }, timeout);
        check();
    });
}
//# sourceMappingURL=resolve-when.js.map