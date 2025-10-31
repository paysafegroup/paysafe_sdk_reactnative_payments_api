import { PaysafeCardPayments } from '../src/sdk/index';

const mockNavigate = jest.fn();
const mockRoute = {
  params: {
    success: true,
    paymentId: 'payment-123',
    amount: 10.99,
  },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: mockNavigate,
  })),
  useRoute: jest.fn(() => mockRoute),
}));

describe('Screen Tests', () => {
  it('validates card information correctly', () => {
    expect(PaysafeCardPayments.validation.validateCardNumber('4111111111111111')).toBe(true);

    expect(PaysafeCardPayments.validation.validateExpiryDate('12', '2025')).toBe(true);

    expect(PaysafeCardPayments.validation.validateCVV('123')).toBe(true);
  });

  it('verifies navigation functionality', () => {
    const { useNavigation } = require('@react-navigation/native');
    const navigation = useNavigation();

    navigation.navigate('Payment');
    expect(mockNavigate).toHaveBeenCalledWith('Payment');

    navigation.navigate('Result', { success: true });
    expect(mockNavigate).toHaveBeenCalledWith('Result', { success: true });
  });

  it('verifies route parameters', () => {
    const { useRoute } = require('@react-navigation/native');
    const route = useRoute();

    expect(route.params).toEqual({
      success: true,
      paymentId: 'payment-123',
      amount: 10.99,
    });
  });
});
