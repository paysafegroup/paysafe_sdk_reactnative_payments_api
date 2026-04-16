import React from 'react';
import type { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('@/components/HapticTab', () => {
  const R = require('react');
  const { Pressable } = require('react-native');
  return {
    HapticTab: (props: { children?: ReactNode }) =>
      R.createElement(Pressable, props, props.children),
  };
});

jest.mock('@/components/ui/TabBarBackground', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

const mockUseLocalSearchParams = jest.fn(() => ({}));
const mockPush = jest.fn();

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const Stack = ({ children }: { children: ReactNode }) => (
    <View testID="expo-stack">{children}</View>
  );
  Stack.Screen = () => null;
  const Tabs = ({ children }: { children: ReactNode }) => (
    <View testID="expo-tabs">{children}</View>
  );
  Tabs.Screen = () => null;
  return {
    Stack,
    Tabs,
    Link: ({ children }: { children: ReactNode }) => (
      <View testID="expo-link">{children}</View>
    ),
    useRouter: () => ({ push: mockPush, replace: jest.fn() }),
    useLocalSearchParams: () => mockUseLocalSearchParams(),
  };
});

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const { View } = require('react-native');
  return {
    ...actual,
    ThemeProvider: ({ children }: { children: ReactNode }) => (
      <View testID="theme-provider">{children}</View>
    ),
    NavigationContainer: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), canGoBack: jest.fn(() => false) }),
    useFocusEffect: jest.fn(),
    useRoute: () => ({ params: {} }),
  };
});

import RootLayout from '@/app/_layout';
import TabLayout from '@/app/(tabs)/_layout';
import NotFoundScreen from '@/app/+not-found';
import PaymentSuccessScreen from '@/app/paymentSuccessScreen';

describe('RootLayout', () => {
  it('renders navigation stack and status bar after fonts load', () => {
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId('expo-stack')).toBeTruthy();
    expect(getByTestId('theme-provider')).toBeTruthy();
  });
});

describe('TabLayout', () => {
  it('renders tabs chrome', () => {
    const { getByTestId } = render(<TabLayout />);
    expect(getByTestId('expo-tabs')).toBeTruthy();
  });
});

describe('NotFoundScreen', () => {
  it('shows missing route copy and home link', () => {
    render(<NotFoundScreen />);
    expect(screen.getByText("This screen doesn't exist.")).toBeTruthy();
    expect(screen.getByText('Go to home screen!')).toBeTruthy();
  });
});

describe('PaymentSuccessScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseLocalSearchParams.mockReturnValue({});
  });

  it('renders success message and go home', () => {
    render(<PaymentSuccessScreen />);
    expect(screen.getByText('Payment Successful!')).toBeTruthy();
    expect(screen.getByText('Your payment was successfully processed.')).toBeTruthy();
    expect(screen.getByText('Go Home')).toBeTruthy();
  });

  it('shows token when present in search params', () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'pay_abc' });
    render(<PaymentSuccessScreen />);
    expect(screen.getByText('Token: pay_abc')).toBeTruthy();
  });

  it('navigates home when Go Home is pressed', () => {
    const { getByText } = render(<PaymentSuccessScreen />);
    fireEvent.press(getByText('Go Home'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
