"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cheapGuid = exports.getBrowserVersion = exports.getBrowser = void 0;
function getBrowser(userAgent, vendor) {
    vendor = vendor || '';
    if (userAgent.includes(' OPR/')) {
        if (userAgent.includes('Mini')) {
            return 'Opera Mini';
        }
        return 'Opera';
    }
    else if (/(BlackBerry|PlayBook|BB10)/i.test(userAgent)) {
        return 'BlackBerry';
    }
    else if (userAgent.includes('IEMobile') || userAgent.includes('WPDesktop')) {
        return 'Internet Explorer Mobile';
    }
    else if (userAgent.includes('SamsungBrowser/')) {
        return 'Samsung Internet';
    }
    else if (userAgent.includes('Edge') || userAgent.includes('Edg/')) {
        return 'Microsoft Edge';
    }
    else if (userAgent.includes('FBIOS')) {
        return 'Facebook Mobile';
    }
    else if (userAgent.includes('Chrome')) {
        return 'Chrome';
    }
    else if (userAgent.includes('CriOS')) {
        return 'Chrome iOS';
    }
    else if (userAgent.includes('UCWEB') || userAgent.includes('UCBrowser')) {
        return 'UC Browser';
    }
    else if (userAgent.includes('FxiOS')) {
        return 'Firefox iOS';
    }
    else if (vendor.includes('Apple')) {
        if (userAgent.includes('Mobile')) {
            return 'Mobile Safari';
        }
        return 'Safari';
    }
    else if (userAgent.includes('Android')) {
        return 'Android Mobile';
    }
    else if (userAgent.includes('Konqueror')) {
        return 'Konqueror';
    }
    else if (userAgent.includes('Firefox')) {
        return 'Firefox';
    }
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
        return 'Internet Explorer';
    }
    else if (userAgent.includes('Gecko')) {
        return 'Mozilla';
    }
    else {
        return '';
    }
}
exports.getBrowser = getBrowser;
function getBrowserVersion(userAgent, vendor) {
    const browser = getBrowser(userAgent, vendor);
    const versionRegexs = {
        'Internet Explorer Mobile': /rv:(\d+(\.\d+)?)/,
        'Microsoft Edge': /Edge?\/(\d+(\.\d+)?)/,
        Chrome: /Chrome\/(\d+(\.\d+)?)/,
        'Chrome iOS': /CriOS\/(\d+(\.\d+)?)/,
        'UC Browser': /(UCBrowser|UCWEB)\/(\d+(\.\d+)?)/,
        Safari: /Version\/(\d+(\.\d+)?)/,
        'Mobile Safari': /Version\/(\d+(\.\d+)?)/,
        Opera: /(Opera|OPR)\/(\d+(\.\d+)?)/,
        Firefox: /Firefox\/(\d+(\.\d+)?)/,
        'Firefox iOS': /FxiOS\/(\d+(\.\d+)?)/,
        Konqueror: /Konqueror:(\d+(\.\d+)?)/,
        BlackBerry: /BlackBerry (\d+(\.\d+)?)/,
        'Android Mobile': /android\s(\d+(\.\d+)?)/,
        'Samsung Internet': /SamsungBrowser\/(\d+(\.\d+)?)/,
        'Internet Explorer': /(rv:|MSIE )(\d+(\.\d+)?)/,
        Mozilla: /rv:(\d+(\.\d+)?)/
    };
    const regex = versionRegexs[browser];
    if (!regex)
        return regex;
    const matches = regex.exec(userAgent);
    if (!matches) {
        return undefined;
    }
    return matches[matches.length - 2];
}
exports.getBrowserVersion = getBrowserVersion;
function cheapGuid(maxlen) {
    const guid = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    return maxlen ? guid.substring(0, maxlen) : guid;
}
exports.cheapGuid = cheapGuid;
//# sourceMappingURL=utils.js.map