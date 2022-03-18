import { CustomError } from 'ts-custom-error';
export class IntegrationError extends CustomError {
    constructor(message = '', code, status) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
export class RetryableError extends CustomError {
    constructor(message = '', status = 500) {
        super(message);
        this.status = status;
    }
}
export class InvalidAuthenticationError extends CustomError {
    constructor(message = '') {
        super(message);
        this.status = 401;
        this.code = 'invalid_authentication';
    }
}
//# sourceMappingURL=errors.js.map