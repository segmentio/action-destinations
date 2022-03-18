import { AggregateAjvError } from '@segment/ajv-human-errors';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import dayjs from 'dayjs';
import { arrifyFields } from './arrify';
const ajv = addFormats(new Ajv({
    coerceTypes: 'array',
    allErrors: true,
    allowUnionTypes: true,
    verbose: true,
    removeAdditional: true
}));
ajv.addFormat('text', true);
ajv.addFormat('date-like', (data) => {
    let date = dayjs(data);
    if (String(Number(data)) === data) {
        if (data.length === 13) {
            date = dayjs(Number(data));
        }
        date = dayjs.unix(Number(data));
    }
    return date.isValid();
});
export function validateSchema(obj, schema, options) {
    const { schemaKey, throwIfInvalid = true } = options ?? {};
    let validate;
    if (schemaKey) {
        validate = ajv.getSchema(schemaKey) || ajv.addSchema(schema, schemaKey).getSchema(schemaKey);
    }
    else {
        validate = ajv.compile(schema);
    }
    arrifyFields(obj, schema);
    const isValid = validate(obj);
    if (throwIfInvalid && !isValid && validate.errors) {
        throw new AggregateAjvError(validate.errors);
    }
    return isValid;
}
//# sourceMappingURL=schema-validation.js.map