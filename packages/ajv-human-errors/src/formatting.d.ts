import { ErrorObject } from 'ajv';
import type { Options } from './entities';
export declare const fieldPreamble: ({ instancePath, parentSchema }: Pick<ErrorObject, 'instancePath' | 'parentSchema'>, { fieldLabels }: Pick<Options, 'fieldLabels'>) => any;
export declare const getMessage: ({ data, keyword, message, params, parentSchema, schemaPath, instancePath }: ErrorObject, { fieldLabels }: Options) => string | null;
