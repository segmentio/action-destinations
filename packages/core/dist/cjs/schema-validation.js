"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = void 0;
const ajv_human_errors_1 = require("@segment/ajv-human-errors");
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const dayjs_1 = __importDefault(require("dayjs"));
const arrify_1 = require("./arrify");
const ajv = ajv_formats_1.default(new ajv_1.default({
    coerceTypes: 'array',
    allErrors: true,
    allowUnionTypes: true,
    verbose: true,
    removeAdditional: true
}));
ajv.addFormat('text', true);
ajv.addFormat('date-like', (data) => {
    let date = dayjs_1.default(data);
    if (String(Number(data)) === data) {
        if (data.length === 13) {
            date = dayjs_1.default(Number(data));
        }
        date = dayjs_1.default.unix(Number(data));
    }
    return date.isValid();
});
function validateSchema(obj, schema, options) {
    const { schemaKey, throwIfInvalid = true } = options ?? {};
    let validate;
    if (schemaKey) {
        validate = ajv.getSchema(schemaKey) || ajv.addSchema(schema, schemaKey).getSchema(schemaKey);
    }
    else {
        validate = ajv.compile(schema);
    }
    arrify_1.arrifyFields(obj, schema);
    const isValid = validate(obj);
    if (throwIfInvalid && !isValid && validate.errors) {
        throw new ajv_human_errors_1.AggregateAjvError(validate.errors);
    }
    return isValid;
}
exports.validateSchema = validateSchema;
//# sourceMappingURL=schema-validation.js.map