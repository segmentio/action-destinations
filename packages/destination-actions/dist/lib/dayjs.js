"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const advancedFormat_1 = __importDefault(require("dayjs/plugin/advancedFormat"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(advancedFormat_1.default);
exports.default = dayjs_1.default;
//# sourceMappingURL=dayjs.js.map