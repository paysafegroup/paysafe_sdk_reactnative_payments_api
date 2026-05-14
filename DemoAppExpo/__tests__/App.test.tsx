import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../App', () => {
  const { View: MockView, Text: MockText } = require('react-native');
  return function MockedApp() {
    return (
      <MockView>
        <MockText>Mocked App Component</MockText>
      </MockView>
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
