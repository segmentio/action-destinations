import type { JSONSchema4 } from 'json-schema'
export declare function arrify<T>(value: T | T[] | undefined | null, treatNullAsEmpty?: true): T[]
export declare function arrify<T>(value: T | T[] | undefined | null, treatNullAsEmpty: false): T[] | undefined | null
export declare function arrifyFields(obj: unknown, schema?: JSONSchema4): unknown
