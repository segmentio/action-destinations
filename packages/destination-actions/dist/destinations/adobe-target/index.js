"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const updateProfile_1 = __importDefault(require("./updateProfile"));
const destination = {
    name: 'Adobe Target Cloud Mode',
    slug: 'actions-adobe-target-cloud',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            client_code: {
                label: 'Client Code',
                description: 'Your Adobe Target client code. To find your client code in Adobe Target, navigate to **Administration > Implementation**. The client code is shown at the top under Account Details.',
                type: 'string',
                required: true
            }
        }
    },
    actions: {
        updateProfile: updateProfile_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map