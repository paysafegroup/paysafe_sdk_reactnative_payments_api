const mockSetup = jest.fn();
const mockIsInitialized = jest.fn();
const mockGetMerchantReferenceNumber = jest.fn();

const mockTurboModule = {
  setup: mockSetup,
  isInitialized: mockIsInitialized,
  getMerchantReferenceNumber: mockGetMerchantReferenceNumber,
};

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    getEnforcing: jest.fn(() => mockTurboModule),
  },
}));

import { setup, isInitialized, getMerchantReferenceNumber } from '../src/index';

describe('paysafe-payments-sdk-common', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('calls native setup with TEST environment', async () => {
      mockSetup.mockResolvedValue(undefined);
      await setup('test-api-key', 'TEST');
      expect(mockSetup).toHaveBeenCalledWith('test-api-key', 'TEST');
    });

    it('calls native setup with PROD environment', async () => {
      mockSetup.mockResolvedValue(undefined);
      await setup('prod-api-key', 'PROD');
      expect(mockSetup).toHaveBeenCalledWith('prod-api-key', 'PROD');
    });

    it('defaults to TEST environment', async () => {
      mockSetup.mockResolvedValue(undefined);
      await setup('default-key');
      expect(mockSetup).toHaveBeenCalledWith('default-key', 'TEST');
    });

    it('propagates native setup failures', async () => {
      mockSetup.mockRejectedValue(new Error('native failure'));
      await expect(setup('k')).rejects.toThrow('native failure');
    });
  });

  describe('isInitialized', () => {
    it('returns initialization status from native module', () => {
      mockIsInitialized.mockReturnValue(true);
      expect(isInitialized()).toBe(true);
      expect(mockIsInitialized).toHaveBeenCalled();
    });
  });

  describe('getMerchantReferenceNumber', () => {
    it('returns merchant reference number from native module', () => {
      mockGetMerchantReferenceNumber.mockReturnValue('merchant-ref-123');
      expect(getMerchantReferenceNumber()).toBe('merchant-ref-123');
      expect(mockGetMerchantReferenceNumber).toHaveBeenCalled();
    });
  });
});
