import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../ThemedText';

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#000000'),
}));

describe('ThemedText', () => {
  it('should render text content', () => {
    const { getByText } = render(<ThemedText>Hello World</ThemedText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should render with title type', () => {
    const { getByText } = render(<ThemedText type="title">Title Text</ThemedText>);
    expect(getByText('Title Text')).toBeTruthy();
  });

  it('should render with subtitle type', () => {
    const { getByText } = render(<ThemedText type="subtitle">Subtitle Text</ThemedText>);
    expect(getByText('Subtitle Text')).toBeTruthy();
  });

  it('should render with link type', () => {
    const { getByText } = render(<ThemedText type="link">Link Text</ThemedText>);
    expect(getByText('Link Text')).toBeTruthy();
  });

  it('should render with defaultSemiBold type', () => {
    const { getByText } = render(<ThemedText type="defaultSemiBold">Bold Text</ThemedText>);
    expect(getByText('Bold Text')).toBeTruthy();
  });

  it('should pass through props', () => {
    const { getByTestId } = render(<ThemedText testID="test-text">Test</ThemedText>);
    expect(getByTestId('test-text')).toBeTruthy();
  });
});
