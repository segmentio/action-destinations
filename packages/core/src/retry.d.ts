interface RetryOptions {
    retries?: number;
    onFailedAttempt?: (error: any, attemptCount: number) => PromiseLike<void> | void;
}
export declare function retry<T>(input: (attemptCount: number) => PromiseLike<T> | T, options?: RetryOptions): Promise<T>;
export {};
