// Global Privacy Control (GPC) detection and policy.
//
// GPC is a browser-emitted opt-out signal aligned with the CCPA/CPRA "Do Not
// Sell or Share" right. When detected, services that fall under the
// "sale or share" of personal information must be opted out without requiring
// further user action.
//
// Spec: https://globalprivacycontrol.github.io/gpc-spec/

export function gpcSignalDetected() {
    if (typeof navigator === 'undefined') return false;
    return navigator.globalPrivacyControl === true;
}

// Returns the resolved GPC config (with defaults applied) or null when GPC
// handling is not enabled in the site config.
export function gpcConfig(config) {
    const gpc = config.gpc;
    if (!gpc || gpc.enabled === false) return null;
    return {
        enabled: true,
        // Purposes whose services are forced opted-out when GPC is detected.
        // Defaults to the categories that constitute "sale or share" under
        // CCPA/CPRA. Sites can override per their own taxonomy.
        optOutPurposes: gpc.optOutPurposes || ['advertising', 'marketing'],
        // Whether to render a visible acknowledgment that the GPC signal was
        // received and honored. Required by CCPA/CPRA when responding to a
        // universal opt-out signal. Defaults to true.
        showAcknowledgment: gpc.showAcknowledgment !== false,
    };
}

// True when GPC is detected AND the site has GPC handling configured.
export function gpcActive(config) {
    return gpcSignalDetected() && gpcConfig(config) !== null;
}

// True when the given service should be forced to opt-out under GPC.
// A service is GPC-affected when:
//   - it has `respectGPC: true` set explicitly, OR
//   - it belongs to one of the configured `optOutPurposes`.
// Services marked `required: true` are not affected (they are essential and
// fall outside the sale/share scope).
export function serviceAffectedByGPC(service, config) {
    if (service.required) return false;
    const gpc = gpcConfig(config);
    if (!gpc) return false;
    if (service.respectGPC === true) return true;
    if (service.respectGPC === false) return false;
    const servicePurposes = service.purposes || [];
    for (let i = 0; i < servicePurposes.length; i++) {
        if (gpc.optOutPurposes.indexOf(servicePurposes[i]) !== -1) return true;
    }
    return false;
}
