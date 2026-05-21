import {
  validateInitializeContextOptions,
  validateTokenizeOptions,
} from '../src/index';
import type {
  ApplePayInitializeContextOptions,
  PaysafeApplePayTokenizeOptions,
} from '../src/types';

describe('validateTokenizeOptions', () => {
  const validOptions: PaysafeApplePayTokenizeOptions = {
    amount: 100,
    currencyCode: 'USD',
    transactionType: 'PAYMENT',
    merchantRefNum: 'ref-1',
    accountId: '89999999',
    profile: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
    psApplePay: { label: 'Total' },
  };

  it('should validate valid options', () => {
    const result = validateTokenizeOptions(validOptions);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept VERIFICATION', () => {
    const result = validateTokenizeOptions({ ...validOptions, transactionType: 'VERIFICATION' });
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid transactionType', () => {
    const result = validateTokenizeOptions({ ...validOptions, transactionType: 'FOO' as any });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'transactionType must be PAYMENT, VERIFICATION, STANDALONE_CREDIT, or ORIGINAL_CREDIT'
    );
  });

  it('should reject invalid amount', () => {
    expect(validateTokenizeOptions({ ...validOptions, amount: 1.5 }).isValid).toBe(false);
    expect(validateTokenizeOptions({ ...validOptions, amount: -1 }).isValid).toBe(false);
    expect(validateTokenizeOptions({ ...validOptions, amount: NaN }).errors).toContain(
      'amount must be a non-negative integer (minor units)'
    );
    expect(validateTokenizeOptions({ ...validOptions, amount: Number.POSITIVE_INFINITY }).errors).toContain(
      'amount must be a non-negative integer (minor units)'
    );
  });

  it('should reject invalid currency', () => {
    expect(validateTokenizeOptions({ ...validOptions, currencyCode: 'US' }).isValid).toBe(false);
  });

  it('should reject invalid accountId', () => {
    expect(validateTokenizeOptions({ ...validOptions, accountId: 'abc' }).isValid).toBe(false);
  });

  it('should reject missing or non-string merchantRefNum', () => {
    expect(validateTokenizeOptions({ ...validOptions, merchantRefNum: '' }).errors).toContain(
      'merchantRefNum is required and must be a string'
    );
    expect(validateTokenizeOptions({ ...validOptions, merchantRefNum: '   ' }).errors).toContain(
      'merchantRefNum cannot be empty'
    );
    expect(
      validateTokenizeOptions({ ...validOptions, merchantRefNum: 'x'.repeat(256) }).errors
    ).toContain('merchantRefNum cannot exceed 255 characters');
    expect(validateTokenizeOptions({ ...validOptions, merchantRefNum: 1 as unknown as string }).errors).toContain(
      'merchantRefNum is required and must be a string'
    );
  });

  it('should reject missing transactionType', () => {
    expect(
      validateTokenizeOptions({
        ...validOptions,
        transactionType: undefined as unknown as PaysafeApplePayTokenizeOptions['transactionType'],
      }).errors
    ).toContain('transactionType is required');
  });

  it('should accept STANDALONE_CREDIT and ORIGINAL_CREDIT', () => {
    expect(validateTokenizeOptions({ ...validOptions, transactionType: 'STANDALONE_CREDIT' }).isValid).toBe(true);
    expect(validateTokenizeOptions({ ...validOptions, transactionType: 'ORIGINAL_CREDIT' }).isValid).toBe(true);
  });

  it('should reject invalid profile', () => {
    expect(validateTokenizeOptions({ ...validOptions, profile: null as unknown as PaysafeApplePayTokenizeOptions['profile'] }).errors[0]).toBe(
      'profile is required'
    );
    expect(validateTokenizeOptions({ ...validOptions, profile: 'bad' as unknown as PaysafeApplePayTokenizeOptions['profile'] }).errors[0]).toBe(
      'profile is required'
    );
    expect(
      validateTokenizeOptions({
        ...validOptions,
        profile: { lastName: 'B', email: 'a@b.com' } as PaysafeApplePayTokenizeOptions['profile'],
      }).errors
    ).toContain('profile.firstName is required');
    expect(
      validateTokenizeOptions({
        ...validOptions,
        profile: { firstName: 'A', lastName: '', email: 'a@b.com' },
      }).errors
    ).toContain('profile.lastName is required');
    expect(
      validateTokenizeOptions({
        ...validOptions,
        profile: { firstName: 'A', lastName: 'B', email: '  ' },
      }).errors
    ).toContain('profile.email is required');
  });

  it('should reject invalid psApplePay', () => {
    expect(validateTokenizeOptions({ ...validOptions, psApplePay: null as unknown as PaysafeApplePayTokenizeOptions['psApplePay'] }).errors[0]).toBe(
      'psApplePay is required'
    );
    expect(
      validateTokenizeOptions({ ...validOptions, psApplePay: 'x' as unknown as PaysafeApplePayTokenizeOptions['psApplePay'] }).errors[0]
    ).toBe('psApplePay is required');
    expect(
      validateTokenizeOptions({ ...validOptions, psApplePay: { label: '  ' } }).errors
    ).toContain('psApplePay.label is required');
  });

  it('should reject missing amount', () => {
    expect(validateTokenizeOptions({ ...validOptions, amount: undefined as unknown as number }).errors).toContain(
      'amount is required (integer minor units)'
    );
    expect(validateTokenizeOptions({ ...validOptions, amount: null as unknown as number }).errors).toContain(
      'amount is required (integer minor units)'
    );
  });

  it('should reject missing or invalid currencyCode for tokenize', () => {
    expect(
      validateTokenizeOptions({ ...validOptions, currencyCode: '' }).errors.some((e) => e.includes('currencyCode'))
    ).toBe(true);
    expect(validateTokenizeOptions({ ...validOptions, currencyCode: 'usd' }).errors).toContain(
      'currencyCode must be a valid 3-letter ISO currency code'
    );
    expect(
      validateTokenizeOptions({ ...validOptions, currencyCode: null as unknown as string }).errors
    ).toContain('currencyCode is required and must be a string');
  });

  it('should reject missing accountId string', () => {
    expect(validateTokenizeOptions({ ...validOptions, accountId: '' }).errors).toContain(
      'accountId is required and must be a string'
    );
  });
});

describe('validateInitializeContextOptions', () => {
  const valid: ApplePayInitializeContextOptions = {
    currencyCode: 'USD',
    accountId: '89999999',
    merchantIdentifier: 'merchant.com.example.app',
    countryCode: 'US',
  };

  it('should validate valid initialize options', () => {
    const result = validateInitializeContextOptions(valid);
    expect(result.isValid).toBe(true);
  });

  it('should reject bad merchant id', () => {
    const result = validateInitializeContextOptions({
      ...valid,
      merchantIdentifier: 'not-merchant',
    });
    expect(result.isValid).toBe(false);
  });

  it('should reject bad country', () => {
    const result = validateInitializeContextOptions({ ...valid, countryCode: 'USA' });
    expect(result.isValid).toBe(false);
  });

  it('should reject missing or invalid currencyCode', () => {
    expect(validateInitializeContextOptions({ ...valid, currencyCode: '' }).errors).toContain('currencyCode is required');
    expect(validateInitializeContextOptions({ ...valid, currencyCode: 'US' }).errors).toContain(
      'currencyCode must be a valid 3-letter ISO currency code'
    );
  });

  it('should reject missing or non-digit accountId', () => {
    expect(validateInitializeContextOptions({ ...valid, accountId: '' }).errors).toContain('accountId is required');
    expect(validateInitializeContextOptions({ ...valid, accountId: '12a' }).errors).toContain(
      'accountId must contain only digits'
    );
  });

  it('should reject missing or invalid merchantIdentifier', () => {
    expect(validateInitializeContextOptions({ ...valid, merchantIdentifier: '' }).errors).toContain(
      'merchantIdentifier is required'
    );
    expect(validateInitializeContextOptions({ ...valid, merchantIdentifier: 'com.bad' }).errors).toContain(
      'merchantIdentifier must start with "merchant."'
    );
  });

  it('should reject missing or invalid countryCode', () => {
    expect(validateInitializeContextOptions({ ...valid, countryCode: '' }).errors).toContain('countryCode is required');
    expect(validateInitializeContextOptions({ ...valid, countryCode: 'U' }).errors).toContain(
      'countryCode must be a valid 2-letter ISO country code'
    );
  });

  it('should reject non-string fields for initialize context', () => {
    expect(
      validateInitializeContextOptions({ ...valid, currencyCode: 1 as unknown as string }).errors
    ).toContain('currencyCode is required');
    expect(
      validateInitializeContextOptions({ ...valid, accountId: 1 as unknown as string }).errors
    ).toContain('accountId is required');
    expect(
      validateInitializeContextOptions({ ...valid, merchantIdentifier: 1 as unknown as string }).errors
    ).toContain('merchantIdentifier is required');
    expect(
      validateInitializeContextOptions({ ...valid, countryCode: 1 as unknown as string }).errors
    ).toContain('countryCode is required');
  });
});
