import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

// Mock navigation
const mockNavigate = jest.fn();
const mockUseRoute = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => mockUseRoute(),
}));

// Mock react-native-paper components
jest.mock('react-native-paper', () => {
  const { View, TouchableOpacity, Text } = require('react-native');

  const MockCard = ({ children, style }: any) => React.createElement(View, { testID: 'card', style }, children);
  MockCard.Content = ({ children }: any) => React.createElement(View, { testID: 'card-content' }, children);
  MockCard.Actions = ({ children }: any) => React.createElement(View, { testID: 'card-actions' }, children);

  return {
    PaperProvider: ({ children }: any) => children,
    Button: ({ children, onPress, disabled }: any) => {
      return React.createElement(TouchableOpacity, {
        onPress,
        disabled,
        testID: 'nav-button',
        accessibilityRole: 'button'
      }, React.createElement(Text, {}, children));
    },
    Card: MockCard,
    Text: ({ children, variant, style }: any) => {
      return React.createElement(Text, { style, testID: variant || 'text' }, children);
    },
    Divider: ({ style }: any) => React.createElement(View, { style, testID: 'divider' }),
  };
});

import ResultScreen from '../ResultScreen';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>
    {children}
  </PaperProvider>
);

describe('ResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default successful route
    mockUseRoute.mockReturnValue({
      params: {
        success: true,
        message: 'Payment completed successfully',
        timestamp: '2023-01-01T00:00:00.000Z'
      }
    });
  });

  it('renders correctly with success result', () => {
    render(
      <TestWrapper>
        <ResultScreen />
      </TestWrapper>
    );

    expect(screen.getByText('Details Screen')).toBeTruthy();
    expect(screen.getByText('Success!')).toBeTruthy();
    expect(screen.getByText('Successful')).toBeTruthy();
  });

  it('should display success message', () => {
    render(
      <TestWrapper>
        <ResultScreen />
      </TestWrapper>
    );

    expect(screen.getByText('Payment completed successfully')).toBeTruthy();
  });

  it('should display error result when success is false', () => {
    mockUseRoute.mockReturnValue({
      params: {
        success: false,
        message: 'Payment failed',
        timestamp: '2023-01-01T00:00:00.000Z'
      }
    });

    render(
      <TestWrapper>
        <ResultScreen />
      </TestWrapper>
    );

    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('Failed')).toBeTruthy();
    expect(screen.getByText('Payment failed')).toBeTruthy();
  });

  it('should display timestamp correctly', () => {
    render(
      <TestWrapper>
        <ResultScreen />
      </TestWrapper>
    );

    // The timestamp should be formatted and displayed
    expect(screen.getByText(/1\/1\/2023/)).toBeTruthy();
  });

  it('should have back to home button', () => {
    render(
      <TestWrapper>
        <ResultScreen />
      </TestWrapper>
    );

    expect(screen.getByText('Back to Home')).toBeTruthy();
  });
});
