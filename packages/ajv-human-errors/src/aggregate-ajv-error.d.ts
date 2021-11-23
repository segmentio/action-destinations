import { ErrorObject } from 'ajv';
import type { HumanError, Options } from './entities';
export declare class AjvError extends Error {
    private options;
    pointer: ErrorObject['instancePath'];
    path: string;
    redundant: boolean;
    data: ErrorObject['data'];
    original?: ErrorObject;
    constructor(ajvErr: ErrorObject, options?: Options);
    toJSON(): HumanError;
}
export declare class AggregateAjvError extends Error {
    private errors;
    constructor(ajvErrors: ErrorObject[], opts?: Options);
    toJSON(): HumanError[];
    [Symbol.iterator](): Generator<AjvError, void, unknown>;
}
