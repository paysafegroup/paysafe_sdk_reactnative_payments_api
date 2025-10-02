import { PaysafeSDK, PaysafeCardPayments } from '../src/sdk/index';

describe('PaysafeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the SDK', () => {
    expect(PaysafeSDK.getInstance().setup).toBeDefined();
  });

  it('provides card payment functionality', () => {
    const cardPayments = new PaysafeCardPayments();
    expect(cardPayments.makePayment).toBeDefined();
  });

  it('validates card information', () => {
    expect(PaysafeCardPayments.validation.validateCardNumber).toBeDefined();
    expect(PaysafeCardPayments.validation.validateExpiryDate).toBeDefined();
    expect(PaysafeCardPayments.validation.validateCVV).toBeDefined();
  });
});
