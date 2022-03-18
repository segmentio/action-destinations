"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplates = exports.renderTemplate = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const mustache_1 = tslib_1.__importDefault(require("mustache"));
const path_1 = tslib_1.__importDefault(require("path"));
function renderTemplate(template, data) {
    return mustache_1.default.render(template, data);
}
exports.renderTemplate = renderTemplate;
function renderTemplates(templatePath, targetDir, data = {}, force) {
    if (fs_extra_1.default.existsSync(targetDir)) {
        if (!force && fs_extra_1.default.readdirSync(targetDir).length > 0) {
            throw new Error(`There's already content in ${targetDir}. Exiting.`);
        }
    }
    let target = targetDir;
    if (fs_extra_1.default.statSync(templatePath).isFile()) {
        target = path_1.default.join(targetDir, templatePath);
    }
    fs_extra_1.default.copySync(templatePath, target);
    const files = globby_1.default.sync(targetDir);
    for (const file of files) {
        const template = fs_extra_1.default.readFileSync(file, 'utf8');
        const contents = renderTemplate(template, data);
        fs_extra_1.default.writeFileSync(file, contents, 'utf8');
        const renderedFile = renderTemplate(file, data);
        if (file !== renderedFile) {
            fs_extra_1.default.renameSync(file, renderedFile);
        }
    }
}
exports.renderTemplates = renderTemplates;
//# sourceMappingURL=templates.js.map