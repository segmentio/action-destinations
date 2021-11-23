import type { JSONSchema4 } from 'json-schema';
interface ValidationOptions {
    schemaKey?: string;
    throwIfInvalid?: boolean;
}
export declare function validateSchema(obj: unknown, schema: JSONSchema4, options?: ValidationOptions): boolean;
export {};
