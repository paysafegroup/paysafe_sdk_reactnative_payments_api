import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../HomeScreen';
import { AppProvider } from '../../context/PaysafeContext';

// Mock navigation
const mockNavigate = jest.fn();

// Mock AppContext
jest.mock('../../context/PaysafeContext', () => ({
  useAppContext: () => ({
    isLoading: false,
    isInitialized: true,
    error: null,
    initializeSdk: jest.fn(),
  }),
  AppProvider: ({ children }: any) => children,
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
  };
});

// Mock useNavigation hook specifically for this test
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
      canGoBack: jest.fn(() => false),
    }),
    NavigationContainer: ({ children }: any) => {
      const { View } = require('react-native');
      return React.createElement(View, {}, children);
    },
  };
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    <AppProvider>
      {children}
    </AppProvider>
  </NavigationContainer>
);

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    expect(screen.getByText('Expo Demo App')).toBeTruthy();
    expect(screen.getByText('Simple Navigation Example')).toBeTruthy();
  });

  it('should navigate when button is pressed', () => {
    render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    const button = screen.getByText('Go to Details');
    fireEvent.press(button);

    expect(mockNavigate).toHaveBeenCalledWith('Result', {
      success: true,
      message: 'Navigation successful!',
      timestamp: expect.any(String),
    });
  });

  it('should render card structure', () => {
    render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    expect(screen.getAllByTestId('card').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('card-content').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('card-actions').length).toBeGreaterThan(0);
  });
});
