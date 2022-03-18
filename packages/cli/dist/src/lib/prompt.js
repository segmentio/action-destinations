"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoPrompt = exports.prompt = void 0;
const tslib_1 = require("tslib");
const prompts_1 = tslib_1.__importDefault(require("prompts"));
const onCancel = () => {
    process.exit(0);
};
async function prompt(questions, options = {}) {
    return prompts_1.default(questions, { onCancel, ...options });
}
exports.prompt = prompt;
async function autoPrompt(flags, questions) {
    if (!Array.isArray(questions)) {
        questions = [questions];
    }
    for (const question of questions) {
        const name = question.name;
        if (typeof flags[name] !== 'undefined') {
            question.type = null;
            question.initial = flags[name];
        }
    }
    const answers = await prompt(questions);
    return {
        ...flags,
        ...answers
    };
}
exports.autoPrompt = autoPrompt;
//# sourceMappingURL=prompt.js.map