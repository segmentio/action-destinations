"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = void 0;
const DEFAULT_RETRY_ATTEMPTS = 2;
async function retry(input, options) {
    const retries = options?.retries ?? DEFAULT_RETRY_ATTEMPTS;
    for (let attemptCount = 1; attemptCount <= retries; attemptCount++) {
        try {
            return await input(attemptCount);
        }
        catch (error) {
            if (options?.onFailedAttempt) {
                await options.onFailedAttempt(error, attemptCount);
            }
            if (!error || attemptCount >= retries) {
                throw error;
            }
        }
    }
    throw new Error('Exhausted all retries.');
}
exports.retry = retry;
//# sourceMappingURL=retry.js.map