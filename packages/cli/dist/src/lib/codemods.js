"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addKeyToExport = exports.format = void 0;
const tslib_1 = require("tslib");
const jscodeshift_1 = tslib_1.__importDefault(require("jscodeshift"));
const jscodeshift_add_imports_1 = tslib_1.__importDefault(require("jscodeshift-add-imports"));
const prettier_1 = tslib_1.__importDefault(require("prettier"));
const j = jscodeshift_1.default.withParser('ts');
const { statement } = j.template;
const prettierOptions = prettier_1.default.resolveConfig.sync(process.cwd());
function format(code) {
    return prettier_1.default.format(code, { parser: 'typescript', ...prettierOptions });
}
exports.format = format;
function addKeyToExport(code, exportName, property, variableName) {
    var _a;
    const root = j(code);
    const newProperty = j.property.from({
        kind: 'init',
        key: j.identifier(variableName),
        value: j.identifier(variableName),
        shorthand: true
    });
    const defaultExport = root.find(j.ExportDefaultDeclaration);
    if (!defaultExport.length && exportName === 'default') {
        throw new Error('Could not parse "default" export.');
    }
    const namedExport = root.find(j.ExportNamedDeclaration, {
        declaration: {
            type: 'VariableDeclaration',
            declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: exportName } }]
        }
    });
    if (!namedExport.length && exportName !== 'default') {
        throw new Error(`Could not parse "${exportName}" export.`);
    }
    let objectToModify = (exportName === 'default' ? defaultExport : namedExport).get().node.declaration;
    if (objectToModify.type !== 'ObjectExpression') {
        const exportedVar = root.find(j.VariableDeclaration, {
            declarations: [{ id: { type: 'Identifier', name: (_a = objectToModify.name) !== null && _a !== void 0 ? _a : exportName } }]
        });
        if (!exportedVar.length) {
            throw new Error('Unable to find exported variable to modify.');
        }
        objectToModify = exportedVar.get().node.declarations[0].init;
    }
    if (objectToModify.type !== 'ObjectExpression') {
        throw new Error(`Invalid export type: "${objectToModify.type}"`);
    }
    const existingProperty = objectToModify.properties.find((props) => props.key.name === property);
    if (existingProperty) {
        if (!existingProperty.value.properties.find((props) => props.key.name === variableName)) {
            existingProperty.value.properties.push(newProperty);
        }
    }
    else {
        objectToModify.properties.push(j.property('init', j.identifier(property), j.objectExpression([newProperty])));
    }
    const importStatement = `import ${variableName} from './${variableName}'`;
    jscodeshift_add_imports_1.default(root, [statement([importStatement])]);
    return format(root.toSource());
}
exports.addKeyToExport = addKeyToExport;
//# sourceMappingURL=codemods.js.map