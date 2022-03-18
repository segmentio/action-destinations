"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidAuthenticationError = exports.RetryableError = exports.IntegrationError = void 0;
const ts_custom_error_1 = require("ts-custom-error");
class IntegrationError extends ts_custom_error_1.CustomError {
    constructor(message = '', code, status) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.IntegrationError = IntegrationError;
class RetryableError extends ts_custom_error_1.CustomError {
    constructor(message = '', status = 500) {
        super(message);
        this.status = status;
    }
}
exports.RetryableError = RetryableError;
class InvalidAuthenticationError extends ts_custom_error_1.CustomError {
    constructor(message = '') {
        super(message);
        this.status = 401;
        this.code = 'invalid_authentication';
    }
}
exports.InvalidAuthenticationError = InvalidAuthenticationError;
//# sourceMappingURL=errors.js.map