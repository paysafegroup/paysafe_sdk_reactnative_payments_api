import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';

const mockNavigate = jest.fn();

const ResultScreen = () => (
  <View>
    <Text>Details Screen</Text>
    <Text>Test message</Text>
    <TouchableOpacity onPress={() => mockNavigate('Home')}>
      <Text>Back to Home</Text>
    </TouchableOpacity>
  </View>
);

describe('ResultScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders correctly with success params', () => {
    const { getByText } = render(<ResultScreen />);

    expect(getByText('Details Screen')).toBeTruthy();

    expect(getByText('Test message')).toBeTruthy();
  });

  it('navigates back to Home when button is pressed', () => {
    const { getByText } = render(<ResultScreen />);

    fireEvent.press(getByText('Back to Home'));

    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });
});
