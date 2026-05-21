import { NativeModules, Platform } from 'react-native';
import { isApplePayAvailable } from '../src/index';

jest.mock('react-native', () => ({
  NativeModules: {
    RNPaysafeApplePay: {
      isApplePayAvailable: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(({ ios }) => ios),
  },
}));

const mockNativeModule = NativeModules.RNPaysafeApplePay;

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
    mockNativeModule.isApplePayAvailable.mockResolvedValue(mockResponse);

    const result = await isApplePayAvailable();

    expect(result).toEqual(mockResponse);
    expect(mockNativeModule.isApplePayAvailable).toHaveBeenCalledWith({});
  });

  it('should pass supportedNetworks when provided', async () => {
    mockNativeModule.isApplePayAvailable.mockResolvedValue({
      isAvailable: true,
      canMakePayments: true,
      canMakePaymentsUsingNetworks: true,
    });

    await isApplePayAvailable({ supportedNetworks: ['visa', 'masterCard'] });

    expect(mockNativeModule.isApplePayAvailable).toHaveBeenCalledWith({
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
    expect(mockNativeModule.isApplePayAvailable).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    mockNativeModule.isApplePayAvailable.mockRejectedValue(new Error('Native error'));
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
    mockNativeModule.isApplePayAvailable.mockResolvedValue(undefined);

    const result = await isApplePayAvailable();

    expect(result).toEqual({
      isAvailable: false,
      canMakePayments: false,
      canMakePaymentsUsingNetworks: false,
    });
  });
});
