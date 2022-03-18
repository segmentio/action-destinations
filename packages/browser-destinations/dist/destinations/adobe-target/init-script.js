import { getPageParams } from './utils';
export function initScript(settings) {
    window.pageParams = {};
    window.targetGlobalSettings = {
        cookieDomain: settings.cookie_domain,
        enabled: true
    };
    window.targetPageParams = function () {
        return getPageParams();
    };
}
//# sourceMappingURL=init-script.js.map