import { Platform } from 'react-native';

import {
  applyPaysafeSetupFromEnv,
  buildDemoTokenizeOptions,
  envString,
  getDemoVenmoEnvConfig,
  hasVenmoTokenizeConfig,
  resolveDemoConsumerId,
} from '../utils/venmo/venmoDemoConfig';
import {
  DEFAULT_DEMO_VENMO_CONSUMER_ID,
  DEFAULT_DEMO_VENMO_PROFILE_ID,
} from '../utils/venmo/venmoConstants';

const mockSetup = jest.fn();
const TEST_API_KEY =
  'odJFCrnl2edlBDdz1C5Jau2RJtBRnlWmTSHf6pWkLUyifDLkDmWJ6UuVTAIjvFu7WICPhDeOZIiBOB/Y6sHrFH2ZUCr/lgotu2iXW7GboIRoL3u6aHwnMztVuaP+coUNEhEkk+iqq8vH2BzNZV45pFCiRcDCajhDie==';
const TEST_VENMO_ACCOUNT_ID = '5183473829';
const TEST_VENMO_MERCHANT_ACCOUNT_ID = '6042918753';
const TEST_VENMO_PROFILE_ID = 'f7fd633d-bdde-131c-a376-6e4d58e72e31';
const TEST_VENMO_CONSUMER_ID = 'consumer-742';

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: (...args: unknown[]) => mockSetup(...args),
}));

describe('venmoDemoConfig', () => {
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

  describe('getDemoVenmoEnvConfig', () => {
    it('reads known keys with defaults', () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'PROD';
      process.env.EXPO_PUBLIC_PAYSAFE_VENMO_ACCOUNT_ID = TEST_VENMO_ACCOUNT_ID;
      process.env.EXPO_PUBLIC_PAYSAFE_VENMO_CONSUMER_ID = TEST_VENMO_CONSUMER_ID;
      process.env.EXPO_PUBLIC_PAYSAFE_VENMO_MERCHANT_ACCOUNT_ID = TEST_VENMO_MERCHANT_ACCOUNT_ID;
      process.env.EXPO_PUBLIC_PAYSAFE_VENMO_PROFILE_ID = TEST_VENMO_PROFILE_ID;
      const c = getDemoVenmoEnvConfig();
      expect(c).toEqual({
        apiKey: TEST_API_KEY,
        environment: 'PROD',
        accountId: TEST_VENMO_ACCOUNT_ID,
        consumerId: TEST_VENMO_CONSUMER_ID,
        merchantAccountId: TEST_VENMO_MERCHANT_ACCOUNT_ID,
        profileId: TEST_VENMO_PROFILE_ID,
      });
    });

    it('defaults environment to TEST when unset', () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
      delete process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT;
      expect(getDemoVenmoEnvConfig().environment).toBe('TEST');
    });
  });

  describe('hasVenmoTokenizeConfig', () => {
    it('is true when accountId is non-empty', () => {
      const c = { accountId: '  1  ' } as ReturnType<typeof getDemoVenmoEnvConfig>;
      expect(hasVenmoTokenizeConfig(c)).toBe(true);
    });

    it('is false when accountId missing or blank', () => {
      expect(hasVenmoTokenizeConfig({ accountId: undefined } as ReturnType<typeof getDemoVenmoEnvConfig>)).toBe(
        false
      );
      expect(hasVenmoTokenizeConfig({ accountId: '   ' } as ReturnType<typeof getDemoVenmoEnvConfig>)).toBe(false);
    });
  });

  describe('resolveDemoConsumerId', () => {
    it('uses env consumerId when set', () => {
      expect(resolveDemoConsumerId({ consumerId: '  from-env  ' } as ReturnType<typeof getDemoVenmoEnvConfig>)).toBe(
        'from-env'
      );
    });

    it('uses native demo default when consumerId unset', () => {
      expect(resolveDemoConsumerId({} as ReturnType<typeof getDemoVenmoEnvConfig>)).toBe(
        DEFAULT_DEMO_VENMO_CONSUMER_ID
      );
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
      accountId: TEST_VENMO_ACCOUNT_ID,
      consumerId: TEST_VENMO_CONSUMER_ID,
      merchantAccountId: undefined as string | undefined,
      profileId: undefined as string | undefined,
    };

    it('includes merchantAccountId when set', () => {
      const cfg = { ...baseCfg, merchantAccountId: `  ${TEST_VENMO_MERCHANT_ACCOUNT_ID}  ` };
      const o = buildDemoTokenizeOptions(cfg, 'mref');
      expect(o.merchantRefNum).toBe('mref');
      expect(o.accountId).toBe(TEST_VENMO_ACCOUNT_ID);
      expect(o.venmoRequest?.merchantAccountId).toBe(TEST_VENMO_MERCHANT_ACCOUNT_ID);
    });

    it('defaults merchantAccountId to accountId when env override unset', () => {
      const o = buildDemoTokenizeOptions(baseCfg, 'mref');
      expect(o.venmoRequest?.merchantAccountId).toBe(TEST_VENMO_ACCOUNT_ID);
    });

    it('includes merchantDescriptor and shippingDetails like native demo', () => {
      const o = buildDemoTokenizeOptions(baseCfg, 'mref');
      expect(o.merchantDescriptor).toEqual({
        dynamicDescriptor: 'dynamicDescriptor',
        phone: '0123456789',
      });
      expect(o.shippingDetails).toEqual({
        shipMethod: 'NEXT_DAY_OR_OVERNIGHT',
        street: 'street',
        street2: 'street2',
        city: 'Marbury',
        state: 'AL',
        countryCode: 'US',
        zip: '36051',
      });
    });

    it('uses billing and profile payloads aligned with native VenmoUtils', () => {
      const o = buildDemoTokenizeOptions(baseCfg, 'mref');
      expect(o.billingDetails).toEqual({
        nickName: 'nickName',
        street: 'street',
        city: 'city',
        state: 'AL',
        country: 'US',
        zip: '12345',
      });
      expect(o.profile).toEqual({
        firstName: 'firstName',
        lastName: 'lastName',
        locale: 'EN_GB',
        merchantCustomerId: 'merchantCustomerId',
        dateOfBirth: { day: 1, month: 1, year: 1990 },
        email: 'email@mail.com',
        phone: '0123456789',
        mobile: '0123456789',
        gender: 'MALE',
        nationality: 'nationality',
        identityDocuments: [{ documentNumber: 'SSN123456' }],
      });
    });

    it('adds customUrlScheme on Android only', () => {
      const prev = Platform.OS;
      Platform.OS = 'android';
      const o = buildDemoTokenizeOptions(baseCfg, 'mref');
      expect(o.customUrlScheme).toBe('customScheme');
      Platform.OS = 'ios';
      const oi = buildDemoTokenizeOptions(baseCfg, 'mref');
      expect(oi.customUrlScheme).toBeUndefined();
      Platform.OS = prev;
    });

    it('uses default profile id when profileId blank', () => {
      const o = buildDemoTokenizeOptions(baseCfg, 'mref');
      expect(o.venmoRequest?.profileId).toBe(DEFAULT_DEMO_VENMO_PROFILE_ID);
    });
  });
});
