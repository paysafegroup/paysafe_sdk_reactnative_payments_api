import {
  applyPaysafeSetupFromEnv,
  buildDemoTokenizeOptions,
  envString,
  getDemoGooglePayEnvConfig,
  hasGooglePayTokenizeConfig,
} from '../utils/googlePay/googlePayDemoConfig';

const mockSetup = jest.fn();
const TEST_API_KEY =
  'odJFCrnl2edlBDdz1C5Jau2RJtBRnlWmTSHf6pWkLUyifDLkDmWJ6UuVTAIjvFu7WICPhDeOZIiBOB/Y6sHrFH2ZUCr/lgotu2iXW7GboIRoL3u6aHwnMztVuaP+coUNEhEkk+iqq8vH2BzNZV45pFCiRcDCajhDie==';
const TEST_GOOGLE_PAY_ACCOUNT_ID = '1002652190';

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: (...args: unknown[]) => mockSetup(...args),
}));

describe('googlePayDemoConfig', () => {
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
      delete process.env.EXPO_PUBLIC_MISSING_XYZ;
      expect(envString('EXPO_PUBLIC_MISSING_XYZ')).toBeUndefined();
    });
  });

  describe('getDemoGooglePayEnvConfig', () => {
    it('reads known keys with defaults', () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'PROD';
      process.env.EXPO_PUBLIC_PAYSAFE_GOOGLE_PAY_ACCOUNT_ID = TEST_GOOGLE_PAY_ACCOUNT_ID;
      const c = getDemoGooglePayEnvConfig();
      expect(c).toEqual({
        apiKey: TEST_API_KEY,
        environment: 'PROD',
        accountId: TEST_GOOGLE_PAY_ACCOUNT_ID,
      });
    });

    it('defaults environment to TEST when unset', () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      delete process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT;
      expect(getDemoGooglePayEnvConfig().environment).toBe('TEST');
    });
  });

  describe('hasGooglePayTokenizeConfig', () => {
    it('is true when accountId is non-empty', () => {
      const c = { accountId: '  1  ' } as ReturnType<typeof getDemoGooglePayEnvConfig>;
      expect(hasGooglePayTokenizeConfig(c)).toBe(true);
    });

    it('is false when accountId missing or blank', () => {
      expect(
        hasGooglePayTokenizeConfig({ accountId: undefined } as ReturnType<typeof getDemoGooglePayEnvConfig>)
      ).toBe(false);
      expect(
        hasGooglePayTokenizeConfig({ accountId: '   ' } as ReturnType<typeof getDemoGooglePayEnvConfig>)
      ).toBe(false);
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

  describe('buildDemoTokenizeOptions', () => {
    const baseCfg = {
      apiKey: TEST_API_KEY,
      environment: 'TEST' as const,
      accountId: TEST_GOOGLE_PAY_ACCOUNT_ID,
    };

    it('builds tokenize payload matching native demo defaults', () => {
      const o = buildDemoTokenizeOptions(baseCfg, 'mref');
      expect(o.merchantRefNum).toBe('mref');
      expect(o.accountId).toBe(TEST_GOOGLE_PAY_ACCOUNT_ID);
      expect(o.amount).toBe(1000);
      expect(o.simulator).toBe('INTERNAL');
      expect(o.threeDS).toEqual({
        merchantUrl: 'https://api.qa.paysafe.com/checkout/v2/index.html#/desktop',
        process: true,
      });
      expect(o.merchantDescriptor).toEqual({
        dynamicDescriptor: 'dynamicDescriptor',
        phone: '0123456789',
      });
    });
  });
});
