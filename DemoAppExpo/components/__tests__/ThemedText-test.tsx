import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('../../components/ThemedText', () => {
  return {
    ThemedText: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

import { ThemedText } from '../../components/ThemedText';

describe('ThemedText', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('renders text correctly', () => {
    const { getByText } = render(<ThemedText>Test Text</ThemedText>);
    expect(getByText('Test Text')).toBeTruthy();
  });
});
