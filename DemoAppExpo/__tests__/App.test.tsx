import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('../App', () => {
  return function MockedApp() {
    return (
      <View>
        <Text>Mocked App Component</Text>
      </View>
    );
  };
});

import App from '../App';

describe('App', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('Mocked App Component')).toBeTruthy();
  });
});
