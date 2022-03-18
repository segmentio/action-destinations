"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestData = void 0;
const chance_1 = __importDefault(require("chance"));
function setTestData(seedName, type, fieldName, format, choices) {
    const chance = new chance_1.default(seedName);
    if (Array.isArray(choices)) {
        const choice = chance.pickone(choices);
        if (choice.value) {
            return choice.value;
        }
        return choice;
    }
    let val;
    switch (type) {
        case 'boolean':
            val = chance.bool();
            break;
        case 'datetime':
            val = '2021-02-01T00:00:00.000Z';
            break;
        case 'integer':
            val = chance.integer();
            break;
        case 'number':
            val = chance.floating({ fixed: 2 });
            break;
        case 'text':
            val = chance.sentence();
            break;
        case 'object':
            val = { testType: chance.string() };
            break;
        default:
            switch (format) {
                case 'date': {
                    const d = chance.date();
                    val = [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((v) => String(v).padStart(2, '0')).join('-');
                    break;
                }
                case 'date-time':
                    val = chance.date().toISOString();
                    break;
                case 'email':
                    val = chance.email();
                    break;
                case 'hostname':
                    val = chance.domain();
                    break;
                case 'ipv4':
                    val = chance.ip();
                    break;
                case 'ipv6':
                    val = chance.ipv6();
                    break;
                case 'time': {
                    const d = chance.date();
                    val = [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, '0')).join(':');
                    break;
                }
                case 'uri':
                    val = chance.url();
                    break;
                case 'uuid':
                    val = chance.guid();
                    break;
                default:
                    val = chance.string();
                    break;
            }
            break;
    }
    if (fieldName === 'email')
        val = chance.email();
    if (fieldName === 'currency')
        val = chance.currency().code;
    return val;
}
function setData(eventData, chanceName, fieldName, field, data) {
    const { format, multiple, type } = field;
    if (!data) {
        data = setTestData(chanceName, type, fieldName, format, field.choices);
    }
    eventData[fieldName] = multiple ? [data] : data;
    return eventData;
}
function generateTestData(seedName, destination, action, isRequiredOnly) {
    let eventData = {};
    const settingsData = {};
    const authentication = destination.authentication;
    if (authentication) {
        for (const settingKey in authentication.fields) {
            const { format, type } = authentication.fields[settingKey];
            settingsData[settingKey] = setTestData(seedName, type, undefined, format);
        }
    }
    for (const [name, field] of Object.entries(action.fields)) {
        if (isRequiredOnly && !(field.required || name.includes('id'))) {
            continue;
        }
        const { properties } = field;
        if (properties) {
            let subData = {};
            let propertyFields = Object.keys(properties);
            if (isRequiredOnly) {
                propertyFields = propertyFields.filter((name) => properties[name].required);
            }
            for (const propertyName of propertyFields) {
                const property = properties[propertyName];
                subData = setData(subData, seedName, propertyName, property);
            }
            eventData = setData(eventData, seedName, name, field, subData);
            continue;
        }
        eventData = setData(eventData, seedName, name, field);
    }
    return [eventData, settingsData];
}
exports.generateTestData = generateTestData;
//# sourceMappingURL=test-data.js.map