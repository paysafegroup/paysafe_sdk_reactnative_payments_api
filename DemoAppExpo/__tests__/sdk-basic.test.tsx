import * as sdk from '../src/sdk/index';

interface PaysafeSDK {
  getInstance: () => unknown;
}

interface PaysafeCardPayments {
  validation: {
    validateCardNumber: (cardNumber: string) => boolean;
    validateExpiryDate: (month: string, year: string) => boolean;
    validateCVV: (cvv: string) => boolean;
  };
}

interface PaysafeEnvironment {
  TEST: string;
  PROD: string;
}

describe('SDK Basic Tests', () => {
  test('SDK exports expected objects', () => {
    expect(sdk.PaysafeSDK).toBeDefined();
    expect(sdk.PaysafeCardPayments).toBeDefined();
    expect(sdk.PaysafeEnvironment).toBeDefined();
  });

  test('PaysafeSDK has getInstance method', () => {
    const paysafeSDK = sdk.PaysafeSDK as PaysafeSDK;
    expect(typeof paysafeSDK.getInstance).toBe('function');
  });

  test('PaysafeCardPayments has validation methods', () => {
    const paysafeCardPayments = sdk.PaysafeCardPayments as PaysafeCardPayments;
    expect(paysafeCardPayments.validation).toBeDefined();
    expect(typeof paysafeCardPayments.validation.validateCardNumber).toBe('function');
    expect(typeof paysafeCardPayments.validation.validateExpiryDate).toBe('function');
    expect(typeof paysafeCardPayments.validation.validateCVV).toBe('function');
  });

  test('PaysafeEnvironment has TEST and PROD values', () => {
    const paysafeEnvironment = sdk.PaysafeEnvironment as PaysafeEnvironment;
    expect(paysafeEnvironment.TEST).toBe('TEST');
    expect(paysafeEnvironment.PROD).toBe('PROD');
  });
});
