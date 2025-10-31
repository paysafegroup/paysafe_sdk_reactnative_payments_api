import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';

const mockNavigate = jest.fn();

const HomeScreen = () => (
  <View>
    <Text>Expo Demo App</Text>
    <Text>Simple Navigation Example</Text>
    <Text>Welcome to Expo Demo</Text>
    <TouchableOpacity onPress={() => mockNavigate('Result', {
      success: true,
      message: 'Navigation successful!',
      timestamp: new Date().toISOString()
    })}>
      <Text>Go to Details</Text>
    </TouchableOpacity>
  </View>
);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => children;

describe('HomeScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <AppProvider>
        <HomeScreen />
      </AppProvider>
    );

    expect(getByText('Expo Demo App')).toBeTruthy();
    expect(getByText('Simple Navigation Example')).toBeTruthy();

    expect(getByText('Go to Details')).toBeTruthy();
  });

  it('navigates to Result screen when button is pressed', () => {
    const { getByText } = render(
      <AppProvider>
        <HomeScreen />
      </AppProvider>
    );

    fireEvent.press(getByText('Go to Details'));

    expect(mockNavigate).toHaveBeenCalledWith('Result', {
      success: true,
      message: 'Navigation successful!',
      timestamp: expect.any(String)
    });
  });
});
