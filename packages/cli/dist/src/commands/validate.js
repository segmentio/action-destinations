"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const destination_subscriptions_1 = require("@segment/destination-subscriptions");
const ora_1 = tslib_1.__importDefault(require("ora"));
const destinations_1 = require("../lib/destinations");
class Validate extends command_1.Command {
    constructor() {
        super(...arguments);
        this.spinner = ora_1.default();
        this.isInvalid = false;
    }
    async run() {
        const destinations = Object.values(destinations_1.getManifest());
        for (const destination of destinations) {
            this.spinner.start(`Validating definition for ${destination.definition.name}`);
            const errors = [...this.validatePresets(destination.definition), ...this.validateActions(destination.definition)];
            if (errors.length) {
                this.spinner.fail(`Validating definition for ${destination.definition.name}: \n    ${errors
                    .map((e) => e.message)
                    .join('\n    ')}`);
            }
            else {
                this.spinner.succeed();
            }
        }
        if (this.isInvalid) {
            this.error(new Error('One or more validation errors were found.'));
        }
    }
    validateActions(destination) {
        const errors = [];
        if (!Object.keys(destination.actions).length) {
            this.isInvalid = true;
            errors.push(new Error(`The destination "${destination.name}" does not define any actions.`));
        }
        for (const [actionKey, def] of Object.entries(destination.actions)) {
            const action = def;
            if (action.defaultSubscription) {
                const fqlError = this.validateFQL(action.defaultSubscription);
                if (fqlError) {
                    this.isInvalid = true;
                    errors.push(new Error(`The action "${actionKey}" has an invalid \`defaultSubscription\` query: ${fqlError.message}`));
                }
            }
            if (!action.description) {
                errors.push(new Error(`The action "${actionKey}" is missing a description.`));
            }
            for (const [fieldKey, field] of Object.entries(action.fields)) {
                if (!field.description) {
                    errors.push(new Error(`The action "${actionKey}" is missing a description for the field "${fieldKey}".`));
                }
            }
        }
        return errors;
    }
    validatePresets(destination) {
        var _a, _b;
        if (!destination.presets)
            return [];
        const errors = [];
        for (const preset of destination.presets) {
            if (!Object.keys(destination.actions).includes(preset.partnerAction)) {
                this.isInvalid = true;
                errors.push(new Error(`The preset "${preset.name}" references an action key that does not exist.`));
            }
            const presetFields = Object.keys((_a = preset.mapping) !== null && _a !== void 0 ? _a : {});
            const actionFields = Object.keys((_b = destination.actions[preset.partnerAction].fields) !== null && _b !== void 0 ? _b : {});
            const fqlError = this.validateFQL(preset.subscribe);
            if (fqlError) {
                this.isInvalid = true;
                errors.push(new Error(`The preset "${preset.name}" has an invalid \`subscribe\` query: ${fqlError.message}`));
            }
            for (const field of presetFields) {
                if (!actionFields.includes(field)) {
                    this.isInvalid = true;
                    errors.push(new Error(`The preset "${preset.name}" references a field "${field}" that the "${preset.partnerAction}" action does not define.`));
                }
            }
        }
        return errors;
    }
    validateFQL(fql) {
        const trigger = destination_subscriptions_1.parseFql(fql);
        return trigger.error || null;
    }
    async catch(error) {
        var _a;
        if ((_a = this.spinner) === null || _a === void 0 ? void 0 : _a.isSpinning) {
            this.spinner.fail();
        }
        throw error;
    }
}
exports.default = Validate;
Validate.description = `Validate an integration by statically analyzing the integration’s definition files.`;
Validate.examples = [`$ ./bin/run validate`];
Validate.flags = {
    help: command_1.flags.help({ char: 'h' })
};
Validate.args = [];
//# sourceMappingURL=validate.js.map