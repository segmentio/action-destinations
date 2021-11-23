import { AllRequestOptions, RequestOptions } from './request-client';
import type { ModifiedResponse } from './types';
export interface ResponseError extends Error {
    status?: number;
}
export declare type RequestClient = ReturnType<typeof createRequestClient>;
export default function createRequestClient(...requestOptions: AllRequestOptions[]): <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>;
