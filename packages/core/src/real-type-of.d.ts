export declare function realTypeOf(obj: unknown): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "null" | "array" | "regexp";
export interface Dictionary<T = unknown> {
    [key: string]: T;
}
export declare function isObject(value: unknown): value is Dictionary;
export declare function isArray(value: unknown): value is unknown[];
export declare function isString(value: unknown): value is string;
