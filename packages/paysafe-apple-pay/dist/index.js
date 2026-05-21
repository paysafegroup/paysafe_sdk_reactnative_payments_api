import { __awaiter } from "tslib";
import { NativeModules, Platform } from 'react-native';
const LINKING_ERROR = [
    `The package '@paysafe/react-native-paysafe-apple-pay' doesn't seem to be linked. Make sure:`,
    '',
    Platform.select({ ios: "- You have run 'pod install'", default: '' }),
    '- You rebuilt the app after installing the package',
    '- You are not using Expo Go',
    '',
]
    .filter(Boolean)
    .join('\n');
const RNPaysafeApplePay = NativeModules.RNPaysafeApplePay
    ? NativeModules.RNPaysafeApplePay
    : new Proxy({}, {
        get() {
            throw new Error(LINKING_ERROR);
        },
    });
function validateMerchantRefNum(merchantRefNum) {
    const errors = [];
    if (!merchantRefNum || typeof merchantRefNum !== 'string') {
        errors.push('merchantRefNum is required and must be a string');
    }
    else if (merchantRefNum.trim().length === 0) {
        errors.push('merchantRefNum cannot be empty');
    }
    else if (merchantRefNum.length > 255) {
        errors.push('merchantRefNum cannot exceed 255 characters');
    }
    return errors;
}
function validateTransactionType(transactionType) {
    const errors = [];
    if (!transactionType) {
        errors.push('transactionType is required');
    }
    else if (!['PAYMENT', 'VERIFICATION', 'STANDALONE_CREDIT', 'ORIGINAL_CREDIT'].includes(transactionType)) {
        errors.push('transactionType must be PAYMENT, VERIFICATION, STANDALONE_CREDIT, or ORIGINAL_CREDIT');
    }
    return errors;
}
function validateProfile(profile) {
    const errors = [];
    if (!profile || typeof profile !== 'object') {
        errors.push('profile is required');
        return errors;
    }
    const p = profile;
    if (!p.firstName || typeof p.firstName !== 'string' || p.firstName.trim() === '') {
        errors.push('profile.firstName is required');
    }
    if (!p.lastName || typeof p.lastName !== 'string' || p.lastName.trim() === '') {
        errors.push('profile.lastName is required');
    }
    if (!p.email || typeof p.email !== 'string' || p.email.trim() === '') {
        errors.push('profile.email is required');
    }
    return errors;
}
function validatePsApplePay(ps) {
    const errors = [];
    if (!ps || typeof ps !== 'object') {
        errors.push('psApplePay is required');
        return errors;
    }
    const item = ps;
    if (!item.label || typeof item.label !== 'string' || item.label.trim() === '') {
        errors.push('psApplePay.label is required');
    }
    return errors;
}
function validateAmount(amount) {
    if (amount === null || amount === undefined) {
        return ['amount is required (integer minor units)'];
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
        return ['amount must be a non-negative integer (minor units)'];
    }
    return [];
}
function validateCurrencyCode(currencyCode) {
    if (!currencyCode || typeof currencyCode !== 'string') {
        return ['currencyCode is required and must be a string'];
    }
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
        return ['currencyCode must be a valid 3-letter ISO currency code'];
    }
    return [];
}
function validateAccountId(accountId) {
    if (!accountId || typeof accountId !== 'string') {
        return ['accountId is required and must be a string'];
    }
    if (!/^\d+$/.test(accountId)) {
        return ['accountId must contain only digits'];
    }
    return [];
}
/**
 * Validates tokenize options before calling native (mirrors core Paysafe checks where practical).
 */
export function validateTokenizeOptions(options) {
    const errors = [
        ...validateAmount(options.amount),
        ...validateCurrencyCode(options.currencyCode),
        ...validateMerchantRefNum(options.merchantRefNum),
        ...validateTransactionType(options.transactionType),
        ...validateAccountId(options.accountId),
        ...validateProfile(options.profile),
        ...validatePsApplePay(options.psApplePay),
    ];
    return {
        isValid: errors.length === 0,
        errors,
    };
}
export function validateInitializeContextOptions(options) {
    const errors = [];
    if (!options.currencyCode || typeof options.currencyCode !== 'string') {
        errors.push('currencyCode is required');
    }
    else if (!/^[A-Z]{3}$/.test(options.currencyCode)) {
        errors.push('currencyCode must be a valid 3-letter ISO currency code');
    }
    if (!options.accountId || typeof options.accountId !== 'string') {
        errors.push('accountId is required');
    }
    else if (!/^\d+$/.test(options.accountId)) {
        errors.push('accountId must contain only digits');
    }
    if (!options.merchantIdentifier || typeof options.merchantIdentifier !== 'string') {
        errors.push('merchantIdentifier is required');
    }
    else if (!options.merchantIdentifier.startsWith('merchant.')) {
        errors.push('merchantIdentifier must start with "merchant."');
    }
    if (!options.countryCode || typeof options.countryCode !== 'string') {
        errors.push('countryCode is required');
    }
    else if (!/^[A-Z]{2}$/.test(options.countryCode)) {
        errors.push('countryCode must be a valid 2-letter ISO country code');
    }
    return { isValid: errors.length === 0, errors };
}
function createErrorResult(code, message, details) {
    return {
        token: '',
        isSuccess: false,
        error: {
            code,
            message,
            details,
        },
    };
}
/**
 * Initialize Apple Pay for the given account (validates Apple Pay + card config server-side).
 * Call once after `PaysafeSDK.setup`. Required before `tokenize`.
 */
export function initializeApplePayContext(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (Platform.OS !== 'ios') {
            throw new Error('Apple Pay is only available on iOS devices');
        }
        const v = validateInitializeContextOptions(options);
        if (!v.isValid) {
            throw new Error(`Invalid initialize options: ${v.errors.join(', ')}`);
        }
        yield RNPaysafeApplePay.initializeContext({
            currencyCode: options.currencyCode,
            accountId: options.accountId,
            merchantIdentifier: options.merchantIdentifier,
            countryCode: options.countryCode,
        });
    });
}
/** Clears the native Apple Pay context (e.g. after logout). */
export function resetApplePayContext() {
    return __awaiter(this, void 0, void 0, function* () {
        if (Platform.OS !== 'ios') {
            return;
        }
        yield RNPaysafeApplePay.resetContext();
    });
}
/**
 * Presents the Apple Pay sheet and tokenizes via Paysafe (payment handle token).
 */
export function tokenize(options) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (Platform.OS !== 'ios') {
            throw new Error('Apple Pay is only available on iOS devices');
        }
        const validation = validateTokenizeOptions(options);
        if (!validation.isValid) {
            throw new Error(`Invalid tokenization options: ${validation.errors.join(', ')}`);
        }
        try {
            const payload = {
                amount: options.amount,
                currencyCode: options.currencyCode,
                transactionType: options.transactionType,
                merchantRefNum: options.merchantRefNum,
                accountId: options.accountId,
                profile: options.profile,
                psApplePay: options.psApplePay,
                requestBillingAddress: (_a = options.requestBillingAddress) !== null && _a !== void 0 ? _a : false,
                simulator: options.simulator,
                billingDetails: options.billingDetails,
                shippingDetails: options.shippingDetails,
                merchantDescriptor: options.merchantDescriptor,
            };
            const result = yield RNPaysafeApplePay.tokenize(payload);
            if (!result || typeof result !== 'object') {
                throw new Error('Invalid response from native module');
            }
            return {
                token: result.token || '',
                isSuccess: Boolean(result.isSuccess),
                error: result.error
                    ? {
                        code: result.error.code || 'UNKNOWN_ERROR',
                        message: result.error.message || 'An unknown error occurred',
                        details: result.error.details,
                    }
                    : undefined,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                return createErrorResult('TOKENIZATION_FAILED', error.message, 'Failed to tokenize with Apple Pay');
            }
            throw error;
        }
    });
}
/**
 * Device / wallet availability (PassKit). Optional networks refine `canMakePaymentsUsingNetworks`.
 */
export function isApplePayAvailable(request) {
    return __awaiter(this, void 0, void 0, function* () {
        if (Platform.OS !== 'ios') {
            return {
                isAvailable: false,
                canMakePayments: false,
                canMakePaymentsUsingNetworks: false,
            };
        }
        try {
            const nativeReq = (request === null || request === void 0 ? void 0 : request.supportedNetworks) && request.supportedNetworks.length > 0
                ? { supportedNetworks: request.supportedNetworks }
                : {};
            const result = yield RNPaysafeApplePay.isApplePayAvailable(nativeReq);
            return {
                isAvailable: Boolean(result === null || result === void 0 ? void 0 : result.isAvailable),
                canMakePayments: Boolean(result === null || result === void 0 ? void 0 : result.canMakePayments),
                canMakePaymentsUsingNetworks: Boolean(result === null || result === void 0 ? void 0 : result.canMakePaymentsUsingNetworks),
            };
        }
        catch (error) {
            console.info('Failed to check Apple Pay availability:', error);
            return {
                isAvailable: false,
                canMakePayments: false,
                canMakePaymentsUsingNetworks: false,
            };
        }
    });
}
//# sourceMappingURL=index.js.map