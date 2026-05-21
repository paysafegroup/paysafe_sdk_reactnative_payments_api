import {
  applyPaysafeSetupFromEnv,
  buildCardTokenizeOptions,
  envString,
  getDemoCardEnvConfig,
} from '../app/cardPayments/cardPaymentsDemoConfig';
import { DEFAULT_DEMO_CARD_ACCOUNT_ID } from '../app/cardPayments/cardPaymentsEnv';

const mockSetup = jest.fn();
const TEST_API_KEY =
  'odJFCrnl2edlBDdz1C5Jau2RJtBRnlWmTSHf6pWkLUyifDLkDmWJ6UuVTAIjvFu7WICPhDeOZIiBOB/Y6sHrFH2ZUCr/lgotu2iXW7GboIRoL3u6aHwnMztVuaP+coUNEhEkk+iqq8vH2BzNZV45pFCiRcDCajhDie==';
const TEST_CARDS_ACCOUNT_ID = '8391746250';

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: (...args: unknown[]) => mockSetup(...args),
}));

describe('cardPaymentsDemoConfig', () => {
  const orig = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...orig };
    mockSetup.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = orig;
  });

  describe('envString', () => {
    it('returns trimmed value when set', () => {
      process.env.EXPO_PUBLIC_FOO = '  bar  ';
      expect(envString('EXPO_PUBLIC_FOO')).toBe('bar');
    });

    it('returns undefined when missing', () => {
      delete process.env.EXPO_PUBLIC_MISSING_CARD_XYZ;
      expect(envString('EXPO_PUBLIC_MISSING_CARD_XYZ')).toBeUndefined();
    });
  });

  describe('getDemoCardEnvConfig', () => {
    it('reads known keys with defaults', () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'PROD';
      process.env.EXPO_PUBLIC_PAYSAFE_CARDS_ACCOUNT_ID = TEST_CARDS_ACCOUNT_ID;
      const c = getDemoCardEnvConfig();
      expect(c).toEqual({
        apiKey: TEST_API_KEY,
        environment: 'PROD',
        accountId: TEST_CARDS_ACCOUNT_ID,
      });
    });

    it('defaults environment to TEST when unset', () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      delete process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT;
      expect(getDemoCardEnvConfig().environment).toBe('TEST');
    });

    it('defaults accountId when unset', () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      delete process.env.EXPO_PUBLIC_PAYSAFE_CARDS_ACCOUNT_ID;
      expect(getDemoCardEnvConfig().accountId).toBe(DEFAULT_DEMO_CARD_ACCOUNT_ID);
    });
  });

  describe('applyPaysafeSetupFromEnv', () => {
    it('returns message when api key missing', async () => {
      delete process.env.EXPO_PUBLIC_PAYSAFE_API_KEY;
      await expect(applyPaysafeSetupFromEnv()).resolves.toMatch(/EXPO_PUBLIC_PAYSAFE_API_KEY/);
      expect(mockSetup).not.toHaveBeenCalled();
    });

    it('returns message for invalid environment', async () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'STAGING';
      await expect(applyPaysafeSetupFromEnv()).resolves.toMatch(/TEST or PROD/);
      expect(mockSetup).not.toHaveBeenCalled();
    });

    it('returns error string when setup throws', async () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
      mockSetup.mockRejectedValueOnce(new Error('boom'));
      await expect(applyPaysafeSetupFromEnv()).resolves.toBe('boom');
    });

    it('returns string for non-Error rejection', async () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
      mockSetup.mockRejectedValueOnce('plain');
      await expect(applyPaysafeSetupFromEnv()).resolves.toBe('plain');
    });

    it('returns null on success', async () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
      await expect(applyPaysafeSetupFromEnv()).resolves.toBeNull();
      expect(mockSetup).toHaveBeenCalledWith(TEST_API_KEY, 'TEST');
    });
  });

  describe('buildCardTokenizeOptions', () => {
    it('builds tokenize options with merchant ref and account', () => {
      const o = buildCardTokenizeOptions('mref-1', TEST_CARDS_ACCOUNT_ID);
      expect(o.merchantRefNum).toBe('mref-1');
      expect(o.accountId).toBe(TEST_CARDS_ACCOUNT_ID);
      expect(o.currencyCode).toBe('USD');
      expect(o.threeDS?.process).toBe(true);
    });
  });
});
