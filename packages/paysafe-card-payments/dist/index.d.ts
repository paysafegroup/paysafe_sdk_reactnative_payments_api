import CardNumberView from './CardNumberView';
import CardholderNameView from './CardholderNameView';
import ExpiryDatePickerView from './ExpiryDatePickerView';
import CvvView from './CvvView';
export declare function initialize(currencyCode: string, accountId: string, cardNumberViewTag?: number, cardHolderNameViewTag?: number, expiryDateViewTag?: number, cvvViewTag?: number): void;
export declare function tokenize(readableCardPaymentsTokenizeOptions: unknown): void;
export declare function setupPaysafeSdk(apiKey: string, environment?: 'TEST' | 'PROD'): any;
export declare function isPaysafeSdkInitialized(): Promise<boolean>;
export declare function getMerchantReferenceNumber(): Promise<string>;
export { CardNumberView, CardholderNameView, CvvView, ExpiryDatePickerView };
declare const _default: {
    initialize: typeof initialize;
    tokenize: typeof tokenize;
    CardNumberView: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & import("react").RefAttributes<import("react").Component<import("react-native").ViewProps, {}, any> & import("react-native").NativeMethods>>;
    CardholderNameView: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & import("react").RefAttributes<import("react").Component<import("react-native").ViewProps, {}, any> & import("react-native").NativeMethods>>;
    CvvView: import("react").ForwardRefExoticComponent<import("./CvvView").CvvViewProps & import("react").RefAttributes<import("react").Component<import("./CvvView").CvvViewProps, {}, any> & import("react-native").NativeMethods>>;
    ExpiryDatePickerView: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & import("react").RefAttributes<import("react").Component<import("react-native").ViewProps, {}, any> & import("react-native").NativeMethods>>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map