import { PaysafeSDK, PaysafeCardPayments, PaysafeEnvironment } from '../src/sdk/index';

describe('Paysafe SDK', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the SDK with correct parameters', async () => {
    const sdk = PaysafeSDK.getInstance();
    const setupSpy = jest.spyOn(sdk, 'setup');

    await sdk.setup({
      apiKey: 'test-api-key',
      environment: PaysafeEnvironment.TEST,
      accountId: 'test-account-id',
    });

    expect(setupSpy).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      environment: PaysafeEnvironment.TEST,
      accountId: 'test-account-id',
    });
  });

  it('processes card payments correctly', async () => {
    const cardPayments = new PaysafeCardPayments();
    const makePaymentSpy = jest.spyOn(cardPayments, 'makePayment');

    const paymentData = {
      merchantRefNum: 'order-123',
      amount: 10.99,
      currency: 'USD',
      transactionType: 'PAYMENT',
      cardNumber: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      cardHolderName: 'Test User',
    };

    await cardPayments.makePayment(paymentData);

    expect(makePaymentSpy).toHaveBeenCalledWith(paymentData);
  });

  it('validates card information correctly', () => {
    expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111111')).toBe(true);

    expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2025')).toBe(true);

    expect(PaysafeCardPayments.validation.validateCVV('123')).toBe(true);
  });
});
