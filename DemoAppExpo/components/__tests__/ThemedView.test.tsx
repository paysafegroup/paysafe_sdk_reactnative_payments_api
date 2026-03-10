import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemedView } from '../ThemedView';

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#ffffff'),
}));

describe('ThemedView', () => {
  it('should render children', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Child content</Text>
      </ThemedView>
    );
    expect(getByText('Child content')).toBeTruthy();
  });

  it('should render with testID', () => {
    const { getByTestId } = render(
      <ThemedView testID="test-view">
        <Text>Content</Text>
      </ThemedView>
    );
    expect(getByTestId('test-view')).toBeTruthy();
  });

  it('should render multiple children', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>First</Text>
        <Text>Second</Text>
      </ThemedView>
    );
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('should render without children', () => {
    const { getByTestId } = render(<ThemedView testID="empty-view" />);
    expect(getByTestId('empty-view')).toBeTruthy();
  });
});
