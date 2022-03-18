"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserAgentProperties = void 0;
const ua_parser_js_1 = __importDefault(require("@amplitude/ua-parser-js"));
function parseUserAgentProperties(userAgent) {
    if (!userAgent) {
        return {};
    }
    const parser = new ua_parser_js_1.default(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();
    return {
        os_name: browser.name ?? os.name,
        os_version: browser.major ?? os.version,
        device_model: device.model ?? os.name,
        device_type: device.type
    };
}
exports.parseUserAgentProperties = parseUserAgentProperties;
//# sourceMappingURL=user-agent.js.map