const mockIsApplePayAvailable = jest.fn();

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    getEnforcing: jest.fn(() => ({
      isApplePayAvailable: mockIsApplePayAvailable,
    })),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(({ ios }) => ios),
  },
}));

import { Platform } from 'react-native';
import { isApplePayAvailable } from '../src/index';

describe('isApplePayAvailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as string) = 'ios';
  });

  it('should return availability information on iOS', async () => {
    const mockResponse = {
      isAvailable: true,
      canMakePayments: true,
      canMakePaymentsUsingNetworks: true,
    };
    mockIsApplePayAvailable.mockResolvedValue(mockResponse);

    const result = await isApplePayAvailable();

    expect(result).toEqual(mockResponse);
    expect(mockIsApplePayAvailable).toHaveBeenCalledWith({});
  });

  it('should pass supportedNetworks when provided', async () => {
    mockIsApplePayAvailable.mockResolvedValue({
      isAvailable: true,
      canMakePayments: true,
      canMakePaymentsUsingNetworks: true,
    });

    await isApplePayAvailable({ supportedNetworks: ['visa', 'masterCard'] });

    expect(mockIsApplePayAvailable).toHaveBeenCalledWith({
      supportedNetworks: ['visa', 'masterCard'],
    });
  });

  it('should return false for all availability on non-iOS platform', async () => {
    (Platform.OS as string) = 'android';

    const result = await isApplePayAvailable();

    expect(result).toEqual({
      isAvailable: false,
      canMakePayments: false,
      canMakePaymentsUsingNetworks: false,
    });
    expect(mockIsApplePayAvailable).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    mockIsApplePayAvailable.mockRejectedValue(new Error('Native error'));
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    const result = await isApplePayAvailable();

    expect(result).toEqual({
      isAvailable: false,
      canMakePayments: false,
      canMakePaymentsUsingNetworks: false,
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should coerce undefined native result fields to false', async () => {
    mockIsApplePayAvailable.mockResolvedValue(undefined);

    const result = await isApplePayAvailable();

    expect(result).toEqual({
      isAvailable: false,
      canMakePayments: false,
      canMakePaymentsUsingNetworks: false,
    });
  });
});
